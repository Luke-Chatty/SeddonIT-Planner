import type { Session } from 'next-auth';
import { prisma } from '@/lib/prisma';
import type { PlanRole } from '@prisma/client';

export function getCurrentUserId(session: Session | null): string | null {
  const id = session?.user?.id ?? session?.user?.email;
  return id ?? null;
}

/**
 * Ensure the signed-in user exists in the User table (create if missing), then return their database id.
 * Handles email case mismatches by also looking up by session user id (Azure AD object ID).
 */
export async function getOwnerIdFromSession(session: Session | null): Promise<string | null> {
  const email = session?.user?.email;
  if (!email || typeof email !== 'string') return null;
  const normalizedEmail = email.toLowerCase().trim();
  const name = session?.user?.name;
  const externalId = (session?.user as { id?: string })?.id;

  // 1. Look up by normalised email (the happy path)
  const byEmail = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (byEmail) return byEmail.id;

  // 2. Fallback: look up by session user id (Azure AD GUID) in case email was stored with different casing
  if (externalId) {
    const byId = await prisma.user.findUnique({
      where: { id: externalId },
      select: { id: true, email: true },
    });
    if (byId) {
      // Fix the email casing so future lookups work
      if (byId.email !== normalizedEmail) {
        await prisma.user.update({
          where: { id: byId.id },
          data: { email: normalizedEmail },
        }).catch(() => {}); // ignore if another row already has this email
      }
      return byId.id;
    }
  }

  // 3. Create user
  try {
    const created = await prisma.user.create({
      data: {
        ...(externalId && { id: externalId }),
        email: normalizedEmail,
        name: name ?? email.split('@')[0],
      },
      select: { id: true },
    });
    return created.id;
  } catch {
    // Race condition: another request may have just created it
    const retry = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    return retry?.id ?? null;
  }
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
    // Plans with no ownerId (legacy): allow any member to delete so they can clean up
    const canDelete = plan.ownerId == null;
    return {
      canView: true,
      canEdit: member.role === 'EDITOR' || member.role === 'OWNER',
      canDelete,
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
