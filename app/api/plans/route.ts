import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { prismaPlanToPlan } from '@/lib/db-plan';
import { getOwnerIdFromSession, getAccessiblePlanIds } from '@/lib/plan-access';
import { hasDatabase } from '@/lib/db';
import type { InfrastructurePlan } from '@/lib/types';

function parseDateInput(value: unknown): Date | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** GET: list plans the current user can access (owner or member). */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasDatabase()) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

  const userId = await getOwnerIdFromSession(session);
  const planIds = await getAccessiblePlanIds(userId);

  const plans = planIds.length > 0
    ? await prisma.plan.findMany({
        where: { id: { in: planIds } },
        include: { tasks: true, milestones: true },
        orderBy: { updatedAt: 'desc' },
      })
    : [];

  const planList = plans.map((p) => {
    const base = prismaPlanToPlan(p);
    const role = p.ownerId === userId ? 'OWNER' : 'VIEWER';
    return { ...base, currentUserRole: role };
  });

  return NextResponse.json({
    plans: planList,
    activePlanId: planList[0]?.id ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

/** POST: create a plan (current user becomes owner). Used for new plans and for import. */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasDatabase()) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

  const ownerId = await getOwnerIdFromSession(session);
  if (!ownerId) return NextResponse.json({ error: 'User not found. Sign in again.' }, { status: 403 });

  let body: InfrastructurePlan & { id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const startDate = parseDateInput(body.startDate);
  const endDate = parseDateInput(body.endDate);
  if (!name || !startDate || !endDate) {
    return NextResponse.json(
      { error: 'Valid name, startDate, and endDate are required' },
      { status: 400 }
    );
  }

  const planId = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : undefined;
  const tasks = [];
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

  const milestones = [];
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

  try {
    const plan = await prisma.plan.create({
      data: {
        ...(planId && { id: planId }),
        name,
        description: typeof body.description === 'string' ? body.description.trim() || null : null,
        startDate,
        endDate,
        ownerId,
        tasks: {
          create: tasks,
        },
        milestones: {
          create: milestones,
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
