import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { prismaPlanToPlan } from '@/lib/db-plan';
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
    const plans = await prisma.plan.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { tasks: true, milestones: true },
    });

    const collection: PlansCollection = {
      plans: plans.map(prismaPlanToPlan),
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
    const body = (await request.json()) as Omit<InfrastructurePlan, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };
    const { name, description, startDate, endDate, tasks = [], milestones = [] } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: name, startDate, endDate' },
        { status: 400 }
      );
    }

    const plan = await prisma.plan.create({
      data: {
        name,
        description: description ?? null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        tasks: {
          create: tasks.map((t) => ({
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
          create: milestones.map((m) => ({
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
  } catch (error) {
    console.error('POST /api/plans error:', error);
    return NextResponse.json(
      { error: 'Failed to create plan' },
      { status: 500 }
    );
  }
}
