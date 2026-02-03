import { NextResponse } from 'next/server';

export async function GET() {
  const hasDatabase = Boolean(process.env.DATABASE_URL);
  return NextResponse.json({
    database: hasDatabase,
    ok: true,
  });
}
