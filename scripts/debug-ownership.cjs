#!/usr/bin/env node
/**
 * Debug ownership: show all users, all plans with ownerId, and whether they match.
 * Run from /app in the container: node scripts/debug-ownership.cjs
 */
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }

const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true } });
  console.log('\n=== USERS ===');
  for (const u of users) console.log(`  id=${u.id}  email=${u.email}  name=${u.name}`);
  if (users.length === 0) console.log('  (none)');

  const plans = await prisma.plan.findMany({ select: { id: true, name: true, ownerId: true } });
  console.log('\n=== PLANS ===');
  for (const p of plans) {
    const ownerUser = users.find(u => u.id === p.ownerId);
    console.log(`  id=${p.id}  name=${p.name}`);
    console.log(`    ownerId=${p.ownerId ?? '(null)'}  matches_user=${ownerUser ? ownerUser.email : 'NO MATCH'}`);
  }
  if (plans.length === 0) console.log('  (none)');

  const members = await prisma.planMember.findMany({ select: { planId: true, userId: true, role: true } });
  console.log('\n=== PLAN MEMBERS ===');
  for (const m of members) console.log(`  planId=${m.planId}  userId=${m.userId}  role=${m.role}`);
  if (members.length === 0) console.log('  (none)');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
