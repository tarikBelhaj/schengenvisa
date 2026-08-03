import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { deletePerson } from '@/app/actions';
import Avatar from '@/components/Avatar';
import Gauge from '@/components/Gauge';
import Header from '@/components/Header';
import PersonForm from '@/components/PersonForm';
import Simulator from '@/components/Simulator';
import Timeline from '@/components/Timeline';
import TripForm from '@/components/TripForm';
import WindowBar, { WindowLegend } from '@/components/WindowBar';
import { fmt } from '@/i18n/config';
import { getI18n } from '@/i18n/server';
import { auth } from '@/lib/auth';
import { getPerson } from '@/lib/data';
import { formatDate, todayUtc } from '@/lib/dates';
import { daysPresentInWindow, findFirstOverage, MAX_DAYS } from '@/lib/schengen';
import { btnDanger } from '@/lib/ui';

export const dynamic = 'force-dynamic';

export default async function PersonPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const person = await getPerson(session.user.id, params.id);
  if (!person) notFound();

  const { locale, dict } = getI18n();
  const t = dict.person;

  const today = todayUtc();
  const used = daysPresentInWindow(person.trips, today);
  const overage = findFirstOverage(person.trips, today);
  const plannedCount = person.trips.filter((tr) => tr.status === 'PLANNED').length;
  const n = person.trips.length;

  return (
    <>
      <Header email={session.user.email} dict={dict} locale={locale} />

      <main className="mx-auto max-w-6xl px-6 pb-20">
        <Link href="/dashboard" className="text-sm text-slate-400 transition hover:text-brand-600">
          {t.backToList}
        </Link>

        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
          <div className="flex items-center gap-4">
            <Avatar name={person.name} photo={person.photo} size={56} />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                {person.name}
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                {person.nationality ?? dict.dashboard.noNationality}
                {person.notes && <> · {person.notes}</>}
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-400">
            {fmt(dict.common.on, { date: formatDate(today, locale) })}
          </p>
        </div>

        {overage && (
          <div className="mt-6 rounded-3xl bg-rose-50 px-6 py-5">
            <p className="font-semibold text-rose-800">{t.overageTitle}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-rose-700">
              {fmt(t.overageBody, {
                date: formatDate(overage.date, locale),
                present: overage.daysPresent,
                excess: overage.daysPresent - MAX_DAYS,
                max: MAX_DAYS,
              })}
              {plannedCount > 0 && t.overagePlanned}
            </p>
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <section className="rounded-3xl bg-white p-7 shadow-card">
              <div className="flex flex-col items-center gap-8 sm:flex-row">
                <Gauge
                  daysUsed={used}
                  referenceDate={today}
                  dict={dict}
                  locale={locale}
                  size={188}
                  bare
                />

                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-slate-800">{t.windowTitle}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">{t.windowBody}</p>
                  <div className="mt-5">
                    <WindowBar
                      trips={person.trips}
                      referenceDate={today}
                      dict={dict}
                      locale={locale}
                    />
                  </div>
                  <div className="mt-4">
                    <WindowLegend dict={dict} />
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-800">{t.tripsTitle}</h2>
              <div className="mt-4">
                <Timeline
                  personId={person.id}
                  trips={person.trips}
                  dict={dict}
                  locale={locale}
                />
              </div>
            </section>

            <section className="rounded-3xl bg-white p-7 shadow-card">
              <h2 className="text-base font-semibold text-slate-800">{t.addTrip}</h2>
              <div className="mt-5">
                <TripForm personId={person.id} dict={dict} />
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <Simulator
              personName={person.name}
              trips={person.trips}
              dict={dict}
              locale={locale}
            />

            <section className="rounded-3xl bg-white p-7 shadow-card">
              <h2 className="text-base font-semibold text-slate-800">{t.profile}</h2>
              <div className="mt-5">
                <PersonForm person={person} dict={dict} />
              </div>

              <form action={deletePerson} className="mt-6 border-t border-brand-50 pt-5">
                <input type="hidden" name="id" value={person.id} />
                <button type="submit" className={btnDanger}>
                  {fmt(n > 1 ? t.deletePersonPlural : t.deletePerson, { name: person.name, n })}
                </button>
              </form>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
