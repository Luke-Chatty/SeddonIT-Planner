import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { getPrisma } from '@/lib/prisma';

export type DirectoryUser = {
  id: string;
  displayName: string | null;
  mail: string;
  jobTitle?: string | null;
  source: 'graph' | 'database';
};

const hasAzureConfig =
  Boolean(process.env.AZURE_AD_CLIENT_ID) &&
  Boolean(process.env.AZURE_AD_CLIENT_SECRET);

/** Comma-separated group display names (e.g. allscl,allhomes) – only users in these groups are searchable. Defaults to allscl,allhomes. */
const groupNames = (process.env.AZURE_AD_GROUP_NAMES ?? 'allscl,allhomes')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
/** Comma-separated group object IDs – alternative to AZURE_AD_GROUP_NAMES. */
const groupIdsFromEnv = (process.env.AZURE_AD_GROUP_IDS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const restrictToGroups = groupNames.length > 0 || groupIdsFromEnv.length > 0;

async function getGraphAccessToken(): Promise<string | null> {
  if (!hasAzureConfig) return null;
  const tenant = process.env.AZURE_AD_TENANT_ID ?? 'common';
  const url = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: process.env.AZURE_AD_CLIENT_ID!,
    client_secret: process.env.AZURE_AD_CLIENT_SECRET!,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token ?? null;
}

const graphHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

/** Resolve group display names to object IDs. */
async function resolveGroupIds(token: string): Promise<string[]> {
  if (groupIdsFromEnv.length > 0) return groupIdsFromEnv;
  if (groupNames.length === 0) return [];
  const ids: string[] = [];
  for (const name of groupNames) {
    const escaped = name.replace(/'/g, "''");
    const params = new URLSearchParams({
      $filter: `displayName eq '${escaped}'`,
      $select: 'id',
      $top: '1',
    });
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/groups?${params.toString()}`,
      { headers: graphHeaders(token) }
    );
    if (!res.ok) continue;
    const data = await res.json();
    const group = (data.value ?? [])[0];
    if (group?.id) ids.push(group.id);
  }
  return ids;
}

/** Search only users who are members of the configured groups (allscl, allhomes). Uses $search with ConsistencyLevel: eventual. */
async function searchGraphUsersInGroups(q: string): Promise<DirectoryUser[]> {
  const token = await getGraphAccessToken();
  if (!token) return [];

  const groupIds = await resolveGroupIds(token);
  if (groupIds.length === 0) return [];

  const trimmed = q.trim();
  const searchTerm = trimmed.replace(/"/g, '');
  const byId = new Map<string, DirectoryUser>();

  const fetchGroupMembers = async (groupId: string, searchExpr: string) => {
    const params = new URLSearchParams({
      $search: searchExpr,
      $select: 'id,displayName,mail,jobTitle',
      $top: '30',
      $orderby: 'displayName',
    });
    const url = `https://graph.microsoft.com/v1.0/groups/${groupId}/members/microsoft.graph.user?${params.toString()}`;
    const res = await fetch(url, {
      headers: {
        ...graphHeaders(token),
        ConsistencyLevel: 'eventual',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.value ?? [];
  };

  for (const groupId of groupIds) {
    const searchExprs = [`"displayName:${searchTerm}"`, `"mail:${searchTerm}"`];
    for (const searchExpr of searchExprs) {
      const list = await fetchGroupMembers(groupId, searchExpr);
      for (const u of list as { id: string; displayName?: string; mail?: string; userPrincipalName?: string; jobTitle?: string }[]) {
        if (byId.has(u.id)) continue;
        byId.set(u.id, {
          id: u.id,
          displayName: u.displayName ?? null,
          mail: u.mail ?? u.userPrincipalName ?? '',
          jobTitle: u.jobTitle ?? null,
          source: 'graph',
        });
      }
    }
  }

  return Array.from(byId.values());
}

/** Search all users (no group restriction). */
async function searchGraphUsersAll(q: string): Promise<DirectoryUser[]> {
  const token = await getGraphAccessToken();
  if (!token) return [];

  const trimmed = q.trim();
  const escaped = trimmed.replace(/'/g, "''");
  const filter = `startswith(displayName,'${escaped}') or startswith(mail,'${escaped}') or startswith(userPrincipalName,'${escaped}')`;
  const params = new URLSearchParams({
    $filter: filter,
    $select: 'id,displayName,mail,jobTitle',
    $top: '30',
  });
  const url = `https://graph.microsoft.com/v1.0/users?${params.toString()}`;
  const res = await fetch(url, { headers: graphHeaders(token) });
  if (!res.ok) return [];
  const data = await res.json();
  const list = data.value ?? [];
  return list.map((u: { id: string; displayName?: string; mail?: string; userPrincipalName?: string; jobTitle?: string }) => ({
    id: u.id,
    displayName: u.displayName ?? null,
    mail: u.mail ?? u.userPrincipalName ?? '',
    jobTitle: u.jobTitle ?? null,
    source: 'graph' as const,
  }));
}

async function searchPrismaUsers(q: string): Promise<DirectoryUser[]> {
  const prisma = getPrisma();
  if (!prisma) return [];

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: q.trim(), mode: 'insensitive' } },
        { email: { contains: q.trim(), mode: 'insensitive' } },
      ],
    },
    select: { id: true, name: true, email: true },
    take: 20,
  });
  return users.map((u) => ({
    id: u.id,
    displayName: u.name ?? null,
    mail: u.email,
    jobTitle: null,
    source: 'database' as const,
  }));
}

/** Merge and dedupe by email (lowercase); prefer Graph when both exist for same email. */
function mergeUsers(graph: DirectoryUser[], db: DirectoryUser[]): DirectoryUser[] {
  const byEmail = new Map<string, DirectoryUser>();
  for (const u of db) {
    byEmail.set(u.mail.toLowerCase().trim(), u);
  }
  for (const u of graph) {
    const key = u.mail.toLowerCase().trim();
    if (key) byEmail.set(key, u);
  }
  return Array.from(byEmail.values());
}

/** GET /api/directory/search?q=... - Search Azure AD (if configured) and DB users; merge and return with jobTitle and source. */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const q = request.nextUrl.searchParams.get('q') ?? '';
  if (q.trim().length < 2) {
    return NextResponse.json({ users: [] });
  }

  const trimmed = q.trim();
  const graphSearch = hasAzureConfig
    ? restrictToGroups
      ? searchGraphUsersInGroups(trimmed)
      : searchGraphUsersAll(trimmed)
    : Promise.resolve([]);
  const [graphUsers, dbUsers] = await Promise.all([graphSearch, searchPrismaUsers(trimmed)]);

  const users = hasAzureConfig ? mergeUsers(graphUsers, dbUsers) : dbUsers;

  return NextResponse.json({ users });
}
