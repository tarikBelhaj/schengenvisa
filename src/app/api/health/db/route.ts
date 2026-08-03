import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Endpoint de diagnostic temporaire. Ne renvoie aucun secret : seulement des
// booléens de présence et l'hôte de la base, identifiants retirés.
function redact(message: string): string {
  return message
    .replace(/:\/\/[^@\s]*@/g, '://***@')
    .split('\n')
    .slice(0, 5)
    .join(' | ');
}

function host(url: string | undefined): string {
  if (!url) return 'absent';
  const m = /@([^/:?]+)/.exec(url);
  return m ? m[1] : 'illisible';
}

export async function GET() {
  const env = {
    DATABASE_URL: host(process.env.DATABASE_URL),
    DIRECT_URL: host(process.env.DIRECT_URL),
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? 'absent',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'defini' : 'ABSENT',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'defini' : 'ABSENT',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'defini' : 'ABSENT',
  };

  try {
    const users = await prisma.user.count();
    const accounts = await prisma.account.count();
    return Response.json({ db: 'ok', users, accounts, env });
  } catch (error) {
    return Response.json(
      { db: 'erreur', message: redact((error as Error).message), env },
      { status: 500 },
    );
  }
}
