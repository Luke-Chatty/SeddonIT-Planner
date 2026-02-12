import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { prismaPlanToPlan } from '@/lib/db-plan';
import { getPlanAccess, getOwnerIdFromSession } from '@/lib/plan-access';
import { hasDatabase } from '@/lib/db';
import type { InfrastructurePlan } from '@/lib/types';

function parseDateInput(value: unknown): Date | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
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
  const userId = await getOwnerIdFromSession(session);

  try {
    let plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: { tasks: true, milestones: true },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    if (plan.ownerId == null && userId != null) {
      await prisma.plan.update({
        where: { id: planId },
        data: { ownerId: userId },
      });
      plan = { ...plan, ownerId: userId };
    }

    const access = await getPlanAccess(planId, userId);
    if (!access?.canView) {
      return NextResponse.json({ error: 'Plan not found or access denied' }, { status: 404 });
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
  const userId = await getOwnerIdFromSession(session);

  try {
    const existing = await prisma.plan.findUnique({
      where: { id: planId },
      select: { ownerId: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const access = await getPlanAccess(planId, userId);
    if (!access?.canEdit) {
      return NextResponse.json({ error: 'You do not have permission to edit this plan' }, { status: 403 });
    }

    let body: InfrastructurePlan;
    try {
      body = (await request.json()) as InfrastructurePlan;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    if (body.id !== planId) {
      return NextResponse.json(
        { error: 'Plan ID mismatch' },
        { status: 400 }
      );
    }
    if (typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ error: 'Plan name is required' }, { status: 400 });
    }

    const startDate = parseDateInput(body.startDate);
    const endDate = parseDateInput(body.endDate);
    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Invalid plan startDate or endDate' }, { status: 400 });
    }

    const tasks: {
      id: string; title: string; description: string; startDate: Date; endDate: Date;
      status: string; priority: string; dependencies: string[]; assignedTo: string | null;
      documentation: string | null; scopeOfWorks: string | null; designInformation: string | null;
      order: number; parentId: string | null;
    }[] = [];
    for (const [index, task] of (body.tasks ?? []).entries()) {
      const taskStart = parseDateInput(task.startDate);
      const taskEnd = parseDateInput(task.endDate);
      if (!taskStart || !taskEnd) {
        return NextResponse.json(
          { error: `Task ${index + 1} has an invalid startDate or endDate` },
          { status: 400 }
        );
      }
      tasks.push({
        id: task.id,
        title: task.title,
        description: task.description ?? '',
        startDate: taskStart,
        endDate: taskEnd,
        status: task.status,
        priority: task.priority,
        dependencies: task.dependencies ?? [],
        assignedTo: task.assignedTo ?? null,
        documentation: task.documentation ?? null,
        scopeOfWorks: task.scopeOfWorks ?? null,
        designInformation: task.designInformation ?? null,
        order: task.order ?? 1,
        parentId: task.parentId ?? null,
      });
    }

    const milestones: {
      id: string; title: string; date: Date; description: string | null;
    }[] = [];
    for (const [index, milestone] of (body.milestones ?? []).entries()) {
      const milestoneDate = parseDateInput(milestone.date);
      if (!milestoneDate) {
        return NextResponse.json(
          { error: `Milestone ${index + 1} has an invalid date` },
          { status: 400 }
        );
      }
      milestones.push({
        id: milestone.id,
        title: milestone.title,
        date: milestoneDate,
        description: milestone.description ?? null,
      });
    }

    const resolvedOwnerId = existing.ownerId == null ? await getOwnerIdFromSession(session) : null;
    const claimOwnership = existing.ownerId == null && resolvedOwnerId != null;

    await prisma.$transaction(async (tx) => {
      await tx.task.deleteMany({ where: { planId } });
      await tx.milestone.deleteMany({ where: { planId } });

      await tx.plan.update({
        where: { id: planId },
        data: {
          ...(claimOwnership && resolvedOwnerId && { ownerId: resolvedOwnerId }),
          name: body.name.trim(),
          description: body.description ?? null,
          startDate,
          endDate,
          tasks: {
            create: tasks,
          },
          milestones: {
            create: milestones,
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
  const userId = await getOwnerIdFromSession(session);

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
