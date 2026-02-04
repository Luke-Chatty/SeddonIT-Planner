import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { getPlanAccess, getOwnerIdFromSession } from '@/lib/plan-access';
import { PlanRole } from '@prisma/client';

function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/** GET: list members of the plan (Owner only or members can view) */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasDatabase()) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

  const { planId } = await params;
  const userId = await getOwnerIdFromSession(session);

  const access = await getPlanAccess(planId, userId);
  if (!access?.canView) {
    return NextResponse.json({ error: 'Plan not found or access denied' }, { status: 404 });
  }

  const members = await prisma.planMember.findMany({
    where: { planId },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  const owner = await prisma.plan.findUnique({
    where: { id: planId },
    select: { ownerId: true, owner: { select: { id: true, email: true, name: true } } },
  });

  const list = [
    ...(owner?.owner
      ? [{ userId: owner.owner.id, email: owner.owner.email, name: owner.owner.name, role: 'OWNER' as const }]
      : []),
    ...members
      .filter((m) => m.userId !== owner?.ownerId)
      .map((m) => ({
        userId: m.user.id,
        email: m.user.email,
        name: m.user.name,
        role: m.role,
      })),
  ];

  return NextResponse.json({ members: list });
}

/** POST: invite a user by email (Owner only) */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasDatabase()) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

  const { planId } = await params;
  const userId = await getOwnerIdFromSession(session);

  const access = await getPlanAccess(planId, userId);
  if (!access?.canManageMembers) {
    return NextResponse.json({ error: 'Only the plan owner can invite members' }, { status: 403 });
  }

  const body = await request.json();
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : null;
  const role = (body.role === 'EDITOR' || body.role === 'VIEWER' ? body.role : 'VIEWER') as PlanRole;
  const displayName = typeof body.displayName === 'string' ? body.displayName.trim() || null : null;

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Allow inviting by email even if they have not signed in yet (e.g. Azure AD user from directory search)
    user = await prisma.user.create({
      data: { email, name: displayName ?? email.split('@')[0] },
    });
  }

  if (user.id === userId) {
    return NextResponse.json({ error: 'You are already the owner' }, { status: 400 });
  }

  const existing = await prisma.planMember.findUnique({
    where: { planId_userId: { planId, userId: user.id } },
  });
  if (existing) {
    await prisma.planMember.update({
      where: { id: existing.id },
      data: { role },
    });
    return NextResponse.json({ ok: true, message: 'Role updated' });
  }

  await prisma.planMember.create({
    data: { planId, userId: user.id, role },
  });
  return NextResponse.json({ ok: true, message: 'Invited' });
}

/** DELETE: remove a member (Owner only). Query: userId= */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasDatabase()) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

  const { planId } = await params;
  const userId = await getOwnerIdFromSession(session);
  const targetUserId = request.nextUrl.searchParams.get('userId');

  if (!targetUserId) {
    return NextResponse.json({ error: 'userId query is required' }, { status: 400 });
  }

  const access = await getPlanAccess(planId, userId);
  if (!access?.canManageMembers) {
    return NextResponse.json({ error: 'Only the plan owner can remove members' }, { status: 403 });
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId }, select: { ownerId: true } });
  if (plan?.ownerId === targetUserId) {
    return NextResponse.json({ error: 'Cannot remove the plan owner' }, { status: 400 });
  }

  await prisma.planMember.deleteMany({
    where: { planId, userId: targetUserId },
  });
  return NextResponse.json({ ok: true });
}
