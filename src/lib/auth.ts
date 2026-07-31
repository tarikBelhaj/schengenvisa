import { PrismaAdapter } from '@auth/prisma-adapter';
import type { Adapter } from 'next-auth/adapters';
import { getServerSession, type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

import { prisma } from './prisma';

/**
 * Liste blanche optionnelle : l'app est privée, quelques proches seulement.
 * ALLOWED_EMAILS="a@x.com,b@y.com" — vide ou absent = tout compte Google passe.
 */
const allowedEmails = (process.env.ALLOWED_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      // Google vérifie ses adresses : on accepte de rattacher la connexion à un
      // User existant de même email (utile pour le compte créé par le seed).
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: { strategy: 'database' },
  pages: { signIn: '/login' },
  callbacks: {
    signIn({ user }) {
      if (allowedEmails.length === 0) return true;
      return !!user.email && allowedEmails.includes(user.email.toLowerCase());
    },
    session({ session, user }) {
      // L'id est la clé de l'isolation multi-utilisateur : on l'expose partout.
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}

/** Session garantie, ou null. À utiliser dans chaque page/action protégée. */
export async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
