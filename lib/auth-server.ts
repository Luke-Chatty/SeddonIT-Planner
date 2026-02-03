import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

/** Use in API routes. Returns session or null; callers can return 401 if null. */
export async function getSession() {
  return getServerSession(authOptions);
}
