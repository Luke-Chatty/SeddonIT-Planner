import type { NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getPrisma } from './prisma';

const hasAzureConfig =
  process.env.AZURE_AD_CLIENT_ID &&
  process.env.AZURE_AD_CLIENT_SECRET;

export const authOptions: NextAuthOptions = {
  providers: [
    ...(hasAzureConfig
      ? [
          AzureADProvider({
            clientId: process.env.AZURE_AD_CLIENT_ID!,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
            tenantId: process.env.AZURE_AD_TENANT_ID ?? 'common',
          }),
        ]
      : []),
    CredentialsProvider({
      id: 'backup-login',
      name: 'Backup login (when SSO is down)',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = process.env.BACKUP_ADMIN_EMAIL;
        const password = process.env.BACKUP_ADMIN_PASSWORD;
        if (!email || !password || !credentials?.email || !credentials?.password) return null;
        if (credentials.email !== email || credentials.password !== password) return null;

        const prisma = getPrisma();
        if (!prisma) return null;

        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          user = await prisma.user.create({
            data: { email, name: email.split('@')[0] },
          });
        }
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'azure-ad' && user.email && getPrisma()) {
        const db = getPrisma()!;
        const uid = (user as { id?: string }).id;
        await db.user.upsert({
          where: { email: user.email },
          create: { id: uid!, email: user.email, name: user.name ?? undefined, image: user.image ?? undefined },
          update: { name: user.name ?? undefined, image: user.image ?? undefined },
        });
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.sub ?? (session.user as { id?: string }).id;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
  },
  pages: { signIn: '/auth/signin' },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
};
