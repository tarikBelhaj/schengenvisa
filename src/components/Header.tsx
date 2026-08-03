import Link from 'next/link';

import type { Locale } from '@/i18n/config';
import type { Dict } from '@/i18n/dictionaries';

import { SignOutButton } from './AuthButtons';
import LanguageSwitcher from './LanguageSwitcher';

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-aqua text-[11px] font-bold text-white">
        90
      </span>
      <span className="text-sm font-semibold tracking-tight text-slate-800">
        Schengen <span className="text-brand-500">90/180</span>
      </span>
    </span>
  );
}

interface HeaderProps {
  email?: string | null;
  dict: Dict;
  locale: Locale;
}

export default function Header({ email, dict, locale }: HeaderProps) {
  return (
    <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6">
      <div className="flex items-center gap-6">
        <Link href="/dashboard">
          <Wordmark />
        </Link>
        <nav className="flex items-center gap-1 rounded-full bg-white p-1 shadow-sm">
          <Link
            href="/dashboard"
            className="rounded-full px-3.5 py-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-600"
          >
            Schengen
          </Link>
          <Link
            href="/pets"
            className="rounded-full px-3.5 py-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-600"
          >
            {dict.pets.nav}
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        {email && <span className="hidden text-sm text-slate-500 sm:inline">{email}</span>}
        <LanguageSwitcher current={locale} />
        <SignOutButton label={dict.nav.signOut} />
      </div>
    </header>
  );
}
