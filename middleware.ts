import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: { signIn: '/auth/signin' },
});

export const config = {
  matcher: ['/', '/plans/:path*', '/tasks/:path*', '/api/plans/:path*'],
};
