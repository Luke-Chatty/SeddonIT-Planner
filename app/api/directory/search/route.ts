import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { getPrisma } from '@/lib/prisma';
import { getGraphAccessToken, hasAzureGraphConfig } from '@/lib/azure-graph';

export type DirectoryUser = {
  id: string;
  displayName: string | null;
  mail: string;
  jobTitle?: string | null;
  source: 'graph' | 'database';
};

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

/** Fetch group members (users only), optionally with $search. */
async function fetchGroupMembers(
  token: string,
  groupId: string,
  searchExpr: string | null,
  top: number
): Promise<{ id: string; displayName?: string; mail?: string; userPrincipalName?: string; jobTitle?: string }[]> {
  const params = new URLSearchParams({
    $select: 'id,displayName,mail,jobTitle',
    $top: String(top),
    $orderby: 'displayName',
  });
  if (searchExpr) params.set('$search', searchExpr);
  const url = `https://graph.microsoft.com/v1.0/groups/${groupId}/members/microsoft.graph.user?${params.toString()}`;
  const headers: Record<string, string> = { ...graphHeaders(token), ConsistencyLevel: 'eventual' };
  const res = await fetch(url, { headers });
  if (!res.ok) return [];
  const data = await res.json();
  return data.value ?? [];
}

/** Search only users who are members of the configured groups. Tries $search first, then fallback to fetch-all-and-filter. */
async function searchGraphUsersInGroups(q: string): Promise<DirectoryUser[]> {
  const token = await getGraphAccessToken();
  if (!token) return [];

  const groupIds = await resolveGroupIds(token);
  if (groupIds.length === 0) return [];

  const trimmed = q.trim().toLowerCase();
  const searchTerm = trimmed.replace(/"/g, '');
  const byId = new Map<string, DirectoryUser>();

  const pushUsers = (
    list: { id: string; displayName?: string; mail?: string; userPrincipalName?: string; jobTitle?: string }[]
  ) => {
    for (const u of list) {
      if (byId.has(u.id)) continue;
      const match =
        trimmed.length < 2 ||
        (u.displayName?.toLowerCase().includes(trimmed) ||
          (u.mail ?? '').toLowerCase().includes(trimmed) ||
          (u.userPrincipalName ?? '').toLowerCase().includes(trimmed));
      if (!match) continue;
      byId.set(u.id, {
        id: u.id,
        displayName: u.displayName ?? null,
        mail: u.mail ?? u.userPrincipalName ?? '',
        jobTitle: u.jobTitle ?? null,
        source: 'graph',
      });
    }
  };

  for (const groupId of groupIds) {
    if (searchTerm.length >= 2) {
      const searchExprs = [`"displayName:${searchTerm}"`, `"mail:${searchTerm}"`];
      for (const searchExpr of searchExprs) {
        const list = await fetchGroupMembers(token, groupId, searchExpr, 30);
        pushUsers(list);
      }
    }
    if (byId.size === 0) {
      const list = await fetchGroupMembers(token, groupId, null, 300);
      pushUsers(list);
    }
  }

  return Array.from(byId.values()).slice(0, 50);
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
  const graphSearch = hasAzureGraphConfig()
    ? restrictToGroups
      ? searchGraphUsersInGroups(trimmed)
      : searchGraphUsersAll(trimmed)
    : Promise.resolve([]);
  const [graphUsers, dbUsers] = await Promise.all([graphSearch, searchPrismaUsers(trimmed)]);

  const users = hasAzureGraphConfig() ? mergeUsers(graphUsers, dbUsers) : dbUsers;

  return NextResponse.json({ users });
}
