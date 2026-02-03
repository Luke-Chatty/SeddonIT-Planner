import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { prismaPlanToPlan } from '@/lib/db-plan';
import { getCurrentUserId, getAccessiblePlanIds } from '@/lib/plan-access';
import type { InfrastructurePlan, PlansCollection } from '@/lib/types';

function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasDatabase()) {
    return NextResponse.json(
      { error: 'Database not configured', plans: [], activePlanId: null },
      { status: 200 }
    );
  }

  try {
    const userId = getCurrentUserId(session);
    const planIds = await getAccessiblePlanIds(userId);

    const plans = await prisma.plan.findMany({
      where: { id: { in: planIds } },
      orderBy: { updatedAt: 'desc' },
      include: { tasks: true, milestones: true, members: true },
    });

    const collection: PlansCollection = {
      plans: plans.map((p) => {
        const plan = prismaPlanToPlan(p);
        const isOwner = p.ownerId === userId;
        const member = p.members.find((m) => m.userId === userId);
        // Legacy plans with no owner: treat any member as OWNER so they can Share/Delete
        const role = isOwner
          ? 'OWNER'
          : p.ownerId == null && member
            ? 'OWNER'
            : member?.role ?? null;
        return { ...plan, currentUserRole: role ?? undefined };
      }),
      activePlanId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(collection);
  } catch (error) {
    console.error('GET /api/plans error:', error);
    return NextResponse.json(
      { error: 'Failed to load plans' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasDatabase()) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    );
  }

  try {
    const userId = getCurrentUserId(session);
    if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 403 });

    const body = (await request.json()) as Omit<InfrastructurePlan, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };
    const { name, description, startDate, endDate, tasks = [], milestones = [] } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: name, startDate, endDate' },
        { status: 400 }
      );
    }

    // Generate new ids for tasks and milestones so imported ids never collide with existing rows
    const taskIdMap = new Map<string, string>();
    tasks.forEach((t) => taskIdMap.set(t.id, randomUUID()));

    const plan = await prisma.plan.create({
      data: {
        name,
        description: description ?? null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        ownerId: userId,
        tasks: {
          create: tasks.map((t) => {
            const newId = taskIdMap.get(t.id)!;
            const newDeps = (t.dependencies ?? [])
              .map((d) => taskIdMap.get(d))
              .filter((id): id is string => id != null);
            return {
              id: newId,
              title: t.title,
              description: t.description ?? '',
              startDate: new Date(t.startDate),
              endDate: new Date(t.endDate),
              status: t.status,
              priority: t.priority,
              dependencies: newDeps,
              assignedTo: t.assignedTo ?? null,
              documentation: t.documentation ?? null,
              scopeOfWorks: t.scopeOfWorks ?? null,
              designInformation: t.designInformation ?? null,
              order: t.order ?? 1,
              parentId: t.parentId ? (taskIdMap.get(t.parentId) ?? null) : null,
            };
          }),
        },
        milestones: {
          create: milestones.map((m) => ({
            id: randomUUID(),
            title: m.title,
            date: new Date(m.date),
            description: m.description ?? null,
          })),
        },
        members: {
          create: { userId, role: 'OWNER' },
        },
      },
      include: { tasks: true, milestones: true },
    });

    return NextResponse.json(prismaPlanToPlan(plan));
  } catch (error) {
    console.error('POST /api/plans error:', error);
    return NextResponse.json(
      { error: 'Failed to create plan' },
      { status: 500 }
    );
  }
}
