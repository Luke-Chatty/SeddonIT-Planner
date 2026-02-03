import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET() {
  const hasUrl = Boolean(process.env.DATABASE_URL);
  let database = false;
  let errorMessage: string | null = null;
  if (hasUrl) {
    try {
      const prisma = getPrisma();
      if (prisma) {
        await prisma.$queryRaw`SELECT 1`;
        database = true;
      } else {
        errorMessage = 'Prisma client not initialized';
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      errorMessage = msg;
      console.error('[health] Database connection failed:', msg);
    }
  }
  return NextResponse.json({
    database,
    hasDatabaseUrl: hasUrl,
    ...(errorMessage && { error: errorMessage }),
    ok: true,
  });
}
