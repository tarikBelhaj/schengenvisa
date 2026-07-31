import Link from 'next/link';
import { redirect } from 'next/navigation';

import { SignInButton } from '@/components/AuthButtons';
import { auth } from '@/lib/auth';

const ERRORS: Record<string, string> = {
  AccessDenied: "Ce compte Google n'est pas autorisé sur cette instance.",
  OAuthAccountNotLinked: 'Cette adresse est déjà associée à une autre méthode de connexion.',
  Configuration: 'Configuration OAuth incomplète — vérifiez les variables d\'environnement.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  const error = searchParams.error
    ? (ERRORS[searchParams.error] ?? 'La connexion a échoué. Réessayez.')
    : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-semibold text-slate-900">Connexion</h1>
        <p className="mt-2 text-sm text-slate-600">
          L&apos;accès se fait avec un compte Google. Chacun ne voit que ses propres personnes et
          séjours.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="mt-6">
          <SignInButton className="inline-flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50" />
        </div>
      </div>

      <Link href="/" className="mt-6 text-center text-sm text-slate-500 hover:text-slate-800">
        ← Retour
      </Link>
    </main>
  );
}
