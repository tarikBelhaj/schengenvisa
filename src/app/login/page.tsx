import Link from 'next/link';
import { redirect } from 'next/navigation';

import { SignInButton } from '@/components/AuthButtons';
import { Wordmark } from '@/components/Header';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { getI18n } from '@/i18n/server';
import { auth } from '@/lib/auth';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  const { locale, dict } = getI18n();
  const t = dict.login;

  const errors: Record<string, string> = {
    AccessDenied: t.errorAccessDenied,
    OAuthAccountNotLinked: t.errorNotLinked,
    Configuration: t.errorConfiguration,
  };
  const error = searchParams.error ? (errors[searchParams.error] ?? t.errorGeneric) : null;

  const reassurances = [t.reassurance1, t.reassurance2, t.reassurance3];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/">
          <Wordmark />
        </Link>
        <LanguageSwitcher current={locale} />
      </header>

      <main className="flex flex-1 items-center justify-center px-6 pb-24">
        <div className="w-full max-w-sm">
          <div className="overflow-hidden rounded-4xl bg-white shadow-float">
            <div className="bg-gradient-to-br from-brand-600 via-brand-500 to-aqua px-7 py-9 text-center">
              <h1 className="text-xl font-semibold text-white">{t.title}</h1>
              <p className="mt-2 text-sm leading-relaxed text-white/80">{t.subtitle}</p>
            </div>

            <div className="px-7 py-7">
              {error && (
                <p className="mb-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </p>
              )}

              <SignInButton label={dict.nav.google} />

              <ul className="mt-7 space-y-3 border-t border-brand-100 pt-6">
                {reassurances.map((line) => (
                  <li key={line} className="flex gap-3 text-sm text-slate-500">
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-brand-500"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M6.3 11.7 3 8.4l1.1-1.1 2.2 2.2 5.6-5.6L13 5z" />
                    </svg>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Link
            href="/"
            className="mt-6 block text-center text-sm text-slate-400 transition hover:text-brand-600"
          >
            {t.back}
          </Link>
        </div>
      </main>
    </div>
  );
}
