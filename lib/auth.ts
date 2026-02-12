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
        const envEmail = process.env.BACKUP_ADMIN_EMAIL?.toLowerCase().trim();
        const password = process.env.BACKUP_ADMIN_PASSWORD;
        const inputEmail = credentials?.email?.toLowerCase().trim();
        if (!envEmail || !password || !inputEmail || !credentials?.password) return null;
        if (inputEmail !== envEmail || credentials.password !== password) return null;

        const prisma = getPrisma();
        if (!prisma) return null;

        let user = await prisma.user.findUnique({ where: { email: envEmail } });
        if (!user) {
          user = await prisma.user.create({
            data: { email: envEmail, name: envEmail.split('@')[0] },
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
        const emailNorm = user.email.toLowerCase().trim();
        await db.user.upsert({
          where: { email: emailNorm },
          create: {
            ...(uid ? { id: uid } : {}),
            email: emailNorm,
            name: user.name ?? undefined,
            image: user.image ?? undefined,
          },
          update: { name: user.name ?? undefined, image: user.image ?? undefined },
        });
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as { id?: string; image?: string };
        u.id = token.sub ?? u.id;
        if (token.picture) u.image = token.picture as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        if (user.image) token.picture = user.image;
      }
      return token;
    },
  },
  pages: { signIn: '/auth/signin' },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
};
