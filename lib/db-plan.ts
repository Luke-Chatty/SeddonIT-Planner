import type { InfrastructurePlan, Task, Milestone } from './types';
import type { Plan as PrismaPlan, Task as PrismaTask, Milestone as PrismaMilestone } from '@prisma/client';

type PlanWithRelations = PrismaPlan & {
  tasks: PrismaTask[];
  milestones: PrismaMilestone[];
};

export function prismaPlanToPlan(p: PlanWithRelations): InfrastructurePlan {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? undefined,
    startDate: p.startDate.toISOString(),
    endDate: p.endDate.toISOString(),
    tasks: p.tasks.map(prismaTaskToTask),
    milestones: p.milestones.map(prismaMilestoneToMilestone),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

function prismaTaskToTask(t: PrismaTask): Task {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    startDate: t.startDate.toISOString(),
    endDate: t.endDate.toISOString(),
    status: t.status as Task['status'],
    priority: t.priority as Task['priority'],
    dependencies: t.dependencies ?? [],
    assignedTo: t.assignedTo ?? undefined,
    documentation: t.documentation ?? undefined,
    scopeOfWorks: t.scopeOfWorks ?? undefined,
    designInformation: t.designInformation ?? undefined,
    order: t.order,
    parentId: t.parentId ?? undefined,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

function prismaMilestoneToMilestone(m: PrismaMilestone): Milestone {
  return {
    id: m.id,
    title: m.title,
    date: m.date.toISOString(),
    description: m.description ?? undefined,
  };
}
