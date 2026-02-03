import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { prismaPlanToPlan } from '@/lib/db-plan';
import { getCurrentUserId, getPlanAccess } from '@/lib/plan-access';
import type { InfrastructurePlan } from '@/lib/types';

function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasDatabase()) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    );
  }

  const { planId } = await params;
  const userId = getCurrentUserId(session);

  try {
    const access = await getPlanAccess(planId, userId);
    if (!access?.canView) {
      return NextResponse.json({ error: 'Plan not found or access denied' }, { status: 404 });
    }

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: { tasks: true, milestones: true },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const payload = prismaPlanToPlan(plan);
    return NextResponse.json({ ...payload, currentUserRole: access.role });
  } catch (error) {
    console.error('GET /api/plans/[planId] error:', error);
    return NextResponse.json(
      { error: 'Failed to load plan' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasDatabase()) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    );
  }

  const { planId } = await params;
  const userId = getCurrentUserId(session);

  try {
    const access = await getPlanAccess(planId, userId);
    if (!access?.canEdit) {
      return NextResponse.json({ error: 'You do not have permission to edit this plan' }, { status: 403 });
    }

    const body = (await request.json()) as InfrastructurePlan;

    if (body.id !== planId) {
      return NextResponse.json(
        { error: 'Plan ID mismatch' },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.task.deleteMany({ where: { planId } });
      await tx.milestone.deleteMany({ where: { planId } });

      await tx.plan.update({
        where: { id: planId },
        data: {
          name: body.name,
          description: body.description ?? null,
          startDate: new Date(body.startDate),
          endDate: new Date(body.endDate),
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
      });
    });

    const updated = await prisma.plan.findUnique({
      where: { id: planId },
      include: { tasks: true, milestones: true },
    });

    if (!updated) {
      return NextResponse.json({ error: 'Plan not found after update' }, { status: 500 });
    }

    return NextResponse.json(prismaPlanToPlan(updated));
  } catch (error) {
    console.error('PUT /api/plans/[planId] error:', error);
    return NextResponse.json(
      { error: 'Failed to update plan' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasDatabase()) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    );
  }

  const { planId } = await params;
  const userId = getCurrentUserId(session);

  try {
    const access = await getPlanAccess(planId, userId);
    if (!access?.canDelete) {
      return NextResponse.json(
        { error: 'Only the plan owner can delete this plan. If you created it, try signing out and back in.' },
        { status: 403 }
      );
    }

    await prisma.plan.delete({
      where: { id: planId },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/plans/[planId] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete plan' },
      { status: 500 }
    );
  }
}
