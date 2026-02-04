import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { getPrisma } from '@/lib/prisma';

export type DirectoryUser = { id: string; displayName: string | null; mail: string };

const hasAzureConfig =
  Boolean(process.env.AZURE_AD_CLIENT_ID) &&
  Boolean(process.env.AZURE_AD_CLIENT_SECRET);

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

async function searchGraphUsers(q: string): Promise<DirectoryUser[]> {
  const token = await getGraphAccessToken();
  if (!token) return [];

  const escaped = q.trim().replace(/'/g, "''");
  const filter = `startswith(displayName,'${escaped}') or startswith(mail,'${escaped}')`;
  const params = new URLSearchParams({
    $filter: filter,
    $select: 'id,displayName,mail',
    $top: '20',
  });
  const url = `https://graph.microsoft.com/v1.0/users?${params.toString()}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const list = data.value ?? [];
  return list.map((u: { id: string; displayName?: string; mail?: string }) => ({
    id: u.id,
    displayName: u.displayName ?? null,
    mail: u.mail ?? '',
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
  }));
}

/** GET /api/directory/search?q=... - Search directory (Graph if configured, else Prisma users). */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const q = request.nextUrl.searchParams.get('q') ?? '';
  if (q.trim().length < 2) {
    return NextResponse.json({ users: [] });
  }

  let users: DirectoryUser[] = [];
  if (hasAzureConfig) {
    users = await searchGraphUsers(q);
  }
  if (users.length === 0) {
    users = await searchPrismaUsers(q);
  }

  return NextResponse.json({ users });
}
