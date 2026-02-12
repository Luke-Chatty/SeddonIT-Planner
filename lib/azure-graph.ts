const hasAzureConfig =
  Boolean(process.env.AZURE_AD_CLIENT_ID) &&
  Boolean(process.env.AZURE_AD_CLIENT_SECRET);

/** Get a client credentials token for Microsoft Graph. Returns null if not configured or on failure. */
export async function getGraphAccessToken(): Promise<string | null> {
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

export function hasAzureGraphConfig(): boolean {
  return hasAzureConfig;
}
