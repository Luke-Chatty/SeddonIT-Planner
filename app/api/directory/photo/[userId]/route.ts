import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { getGraphAccessToken, hasAzureGraphConfig } from '@/lib/azure-graph';

/** GET /api/directory/photo/[userId] - Returns profile photo from Microsoft Graph for Azure AD user id. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSession();
  if (!session) return new NextResponse(null, { status: 401 });

  const { userId } = await params;
  if (!userId?.trim()) return new NextResponse(null, { status: 400 });

  if (!hasAzureGraphConfig()) return new NextResponse(null, { status: 404 });

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
