import Link from 'next/link';

import { SignOutButton } from './AuthButtons';

export default function Header({ email }: { email?: string | null }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="text-sm font-semibold tracking-tight text-slate-900">
          Schengen <span className="text-indigo-600">90/180</span>
        </Link>
        <div className="flex items-center gap-4">
          {email && <span className="hidden text-sm text-slate-500 sm:inline">{email}</span>}
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
