import type { Session } from 'next-auth';
import { prisma } from '@/lib/prisma';
import type { PlanRole } from '@prisma/client';

export function getCurrentUserId(session: Session | null): string | null {
  const id = session?.user?.id ?? session?.user?.email;
  return id ?? null;
}

export type PlanAccess = {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageMembers: boolean;
  role: PlanRole | null;
};

export async function getPlanAccess(
  planId: string,
  userId: string | null
): Promise<PlanAccess | null> {
  if (!userId) return null;

  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: { members: true },
  });
  if (!plan) return null;

  // Plans with no ownerId (legacy) are not accessible until assigned
  const isOwner = plan.ownerId != null && plan.ownerId === userId;
  const member = plan.members.find((m) => m.userId === userId);

  if (isOwner) {
    return {
      canView: true,
      canEdit: true,
      canDelete: true,
      canManageMembers: true,
      role: 'OWNER',
    };
  }
  if (member) {
    return {
      canView: true,
      canEdit: member.role === 'EDITOR' || member.role === 'OWNER',
      canDelete: false,
      canManageMembers: false,
      role: member.role,
    };
  }
  return null;
}

/** Returns plan IDs the user can see (owner or member). */
export async function getAccessiblePlanIds(userId: string | null): Promise<string[]> {
  if (!userId) return [];

  const [owned, memberOf] = await Promise.all([
    prisma.plan.findMany({ where: { ownerId: userId }, select: { id: true } }),
    prisma.planMember.findMany({ where: { userId }, select: { planId: true } }),
  ]);
  const ids = new Set<string>([...owned.map((p) => p.id), ...memberOf.map((m) => m.planId)]);
  return Array.from(ids);
}
