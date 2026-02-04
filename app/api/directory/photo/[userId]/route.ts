import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';

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

/** GET /api/directory/photo/[userId] - Returns profile photo from Microsoft Graph for Azure AD user id. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSession();
  if (!session) return new NextResponse(null, { status: 401 });

  const { userId } = await params;
  if (!userId?.trim()) return new NextResponse(null, { status: 400 });

  if (!hasAzureConfig) return new NextResponse(null, { status: 404 });

  const token = await getGraphAccessToken();
  if (!token) return new NextResponse(null, { status: 503 });

  const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userId)}/photo/$value`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return new NextResponse(null, { status: res.status === 404 ? 404 : 502 });

  const blob = await res.blob();
  const contentType = res.headers.get('content-type') || 'image/jpeg';

  return new NextResponse(blob, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
