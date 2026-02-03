import { defineConfig } from 'prisma/config';

// In production, DATABASE_URL must be set (e.g. in Dokploy env vars). Fallback only for local `prisma generate`.
const databaseUrl =
  process.env.DATABASE_URL ??
  (process.env.NODE_ENV === 'production'
    ? (() => {
        throw new Error('DATABASE_URL must be set in production. Add it in Dokploy → your app → Environment variables.');
      })()
    : 'postgresql://localhost:5432/seddon_planner');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: databaseUrl,
  },
});
