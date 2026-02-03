import { NextResponse } from 'next/server';

export async function GET() {
  const hasAzure =
    Boolean(process.env.AZURE_AD_CLIENT_ID) &&
    Boolean(process.env.AZURE_AD_CLIENT_SECRET);
  return NextResponse.json({ hasAzure });
}
