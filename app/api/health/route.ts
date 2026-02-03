import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET() {
  const hasUrl = Boolean(process.env.DATABASE_URL);
  let database = false;
  if (hasUrl) {
    try {
      const prisma = getPrisma();
      if (prisma) {
        await prisma.$queryRaw`SELECT 1`;
        database = true;
      }
    } catch {
      database = false;
    }
  }
  return NextResponse.json({
    database,
    ok: true,
  });
}
