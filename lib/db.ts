/** Whether DATABASE_URL is set so API routes can use the database. */
export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
