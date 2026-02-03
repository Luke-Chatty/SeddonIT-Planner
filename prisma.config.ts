import { defineConfig } from 'prisma/config';

// DATABASE_URL is required in production (e.g. Dokploy). Fallback only for `prisma generate` when no DB.
const databaseUrl =
  process.env.DATABASE_URL ?? 'postgresql://localhost:5432/seddon_planner';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: databaseUrl,
  },
});
