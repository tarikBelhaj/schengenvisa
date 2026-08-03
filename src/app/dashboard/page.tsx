import Link from 'next/link';
import { redirect } from 'next/navigation';

import Avatar from '@/components/Avatar';
import AlertEmailForm from '@/components/AlertEmailForm';
import { GaugeBar } from '@/components/Gauge';
import Header from '@/components/Header';
import PersonForm from '@/components/PersonForm';
import { fmt } from '@/i18n/config';
import { getI18n } from '@/i18n/server';
import { auth } from '@/lib/auth';
import { listPersons } from '@/lib/data';
import { prisma } from '@/lib/prisma';
import { formatDate, todayUtc } from '@/lib/dates';
import { daysPresentInWindow, findFirstOverage, nextPlannedTrip } from '@/lib/schengen';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const { locale, dict } = getI18n();
  const t = dict.dashboard;

  const [persons, account] = await Promise.all([
    listPersons(session.user.id),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { alertEmail: true },
    }),
  ]);
  const today = todayUtc();
  const flagged = persons.filter((p) => findFirstOverage(p.trips, today) !== null).length;

  return (
    <>
      <Header email={session.user.email} dict={dict} locale={locale} />

      <main className="mx-auto max-w-6xl px-6 pb-20">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t.title}</h1>
          <p className="text-sm text-slate-400">
            {fmt(dict.common.on, { date: formatDate(today, locale) })}
          </p>
        </div>

        {flagged > 0 && (
          <p className="mt-5 rounded-3xl bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
            {fmt(flagged > 1 ? t.flaggedPlural : t.flagged, { n: flagged })}
          </p>
        )}

        {persons.length === 0 ? (
          <p className="mt-6 rounded-3xl border border-dashed border-brand-200 bg-white/60 p-10 text-center text-sm text-slate-500">
            {t.empty}
          </p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {persons.map((person) => {
              const used = daysPresentInWindow(person.trips, today);
              const overage = findFirstOverage(person.trips, today);
              const next = nextPlannedTrip(person.trips, today);
              const n = person.trips.length;

              return (
                <li key={person.id}>
                  <Link
                    href={`/person/${person.id}`}
                    className={`block h-full rounded-3xl bg-white p-6 shadow-card transition hover:shadow-float ${
                      overage ? 'ring-1 ring-rose-200' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={person.name} photo={person.photo} />
                        <div className="min-w-0">
                        <h2 className="font-semibold text-slate-800">{person.name}</h2>
                        <p className="mt-1 text-sm text-slate-400">
                          {person.nationality ?? t.noNationality}
                          {' · '}
                          {fmt(n > 1 ? t.tripCountPlural : t.tripCount, { n })}
                        </p>
                        </div>
                      </div>
                      {overage && (
                        <span className="shrink-0 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                          {t.overageBadge}
                        </span>
                      )}
                    </div>

                    <div className="mt-5">
                      <GaugeBar daysUsed={used} dict={dict} />
                    </div>

                    <div className="mt-5 border-t border-brand-50 pt-4 text-sm">
                      {next ? (
                        <p className="text-slate-500">
                          {t.nextTrip}{' '}
                          <span className="font-semibold text-slate-700">
                            {formatDate(next.entryDate, locale)}
                          </span>
                          {next.exitDate && <> → {formatDate(next.exitDate, locale)}</>}
                        </p>
                      ) : (
                        <p className="text-slate-400">{t.noPlanned}</p>
                      )}

                      {overage && (
                        <p className="mt-1.5 text-rose-600">
                          {fmt(t.overageShort, {
                            date: formatDate(overage.date, locale),
                            n: overage.daysPresent,
                          })}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <section className="mt-10 rounded-3xl bg-white p-7 shadow-card">
          <h2 className="text-base font-semibold text-slate-800">{dict.alerts.title}</h2>
          <div className="mt-5">
            <AlertEmailForm dict={dict} current={account?.alertEmail ?? null} />
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-white p-7 shadow-card">
          <h2 className="text-base font-semibold text-slate-800">{t.addPerson}</h2>
          <div className="mt-5">
            <PersonForm dict={dict} />
          </div>
        </section>
      </main>
    </>
  );
}
