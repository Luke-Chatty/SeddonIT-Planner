import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { prismaPlanToPlan } from '@/lib/db-plan';
import type { InfrastructurePlan } from '@/lib/types';

function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/** POST: create a plan (current user becomes owner). Used for new plans and for import. */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasDatabase()) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

  const { getOwnerIdFromSession } = await import('@/lib/plan-access');
  const ownerId = await getOwnerIdFromSession(session);
  if (!ownerId) return NextResponse.json({ error: 'User not found. Sign in again.' }, { status: 403 });

  let body: InfrastructurePlan & { id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const startDate = body.startDate;
  const endDate = body.endDate;
  if (!name || !startDate || !endDate) {
    return NextResponse.json({ error: 'name, startDate, and endDate are required' }, { status: 400 });
  }

  const planId = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : undefined;

  try {
    const plan = await prisma.plan.create({
      data: {
        ...(planId && { id: planId }),
        name,
        description: typeof body.description === 'string' ? body.description.trim() || null : null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        ownerId,
        tasks: {
          create: (body.tasks ?? []).map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description ?? '',
            startDate: new Date(t.startDate),
            endDate: new Date(t.endDate),
            status: t.status,
            priority: t.priority,
            dependencies: t.dependencies ?? [],
            assignedTo: t.assignedTo ?? null,
            documentation: t.documentation ?? null,
            scopeOfWorks: t.scopeOfWorks ?? null,
            designInformation: t.designInformation ?? null,
            order: t.order ?? 1,
            parentId: t.parentId ?? null,
          })),
        },
        milestones: {
          create: (body.milestones ?? []).map((m) => ({
            id: m.id,
            title: m.title,
            date: new Date(m.date),
            description: m.description ?? null,
          })),
        },
      },
      include: { tasks: true, milestones: true },
    });
    return NextResponse.json(prismaPlanToPlan(plan));
  } catch (e) {
    console.error('POST /api/plans error:', e);
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
  }
}
