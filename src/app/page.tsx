import Link from 'next/link';
import { redirect } from 'next/navigation';

import Gauge from '@/components/Gauge';
import { Wordmark } from '@/components/Header';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import WindowBar, { WindowLegend } from '@/components/WindowBar';
import { fmt } from '@/i18n/config';
import { getI18n } from '@/i18n/server';
import { auth } from '@/lib/auth';
import { addDays, formatDate, todayUtc } from '@/lib/dates';
import { daysPresentInWindow, maxStayFromEntry, type TripLike } from '@/lib/schengen';

// Chiffres produits par les vraies fonctions, pas des valeurs en dur.
function buildDemo() {
  const today = todayUtc();
  const trips: TripLike[] = [
    { entryDate: addDays(today, -164), exitDate: addDays(today, -150), status: 'PAST' },
    { entryDate: addDays(today, -78), exitDate: addDays(today, -59), status: 'PAST' },
    { entryDate: addDays(today, -12), exitDate: addDays(today, 9), status: 'PLANNED' },
  ];
  const reference = addDays(today, 9);
  return {
    trips,
    reference,
    used: daysPresentInWindow(trips, reference),
    entry: addDays(today, 40),
    stay: maxStayFromEntry(trips, addDays(today, 40)),
  };
}

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  const { locale, dict } = getI18n();
  const t = dict.landing;
  const demo = buildDemo();

  const points = [
    { title: t.point1Title, body: t.point1Body },
    { title: t.point2Title, body: t.point2Body },
    { title: t.point3Title, body: t.point3Body },
  ];

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6">
        <Wordmark />
        <div className="flex items-center gap-3">
          <LanguageSwitcher current={locale} />
          <Link
            href="/login"
            className="rounded-full border border-brand-100 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-600"
          >
            {dict.nav.signIn}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid items-center gap-12 py-10 lg:grid-cols-[1fr_420px] lg:gap-16 lg:py-16">
          {/* carte produit en tête sur mobile, à droite en lg */}
          <div className="order-2 lg:order-1">
            <p className="inline-flex rounded-full bg-brand-100 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-700">
              {t.badge}
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
              {t.titleLine1}
              <br />
              <span className="text-brand-500">{t.titleLine2}</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-500">{t.subtitle}</p>

            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-brand-500 px-8 py-3.5 text-sm font-semibold text-white shadow-pill transition hover:bg-brand-600"
              >
                {t.cta}
              </Link>
              <span className="text-sm text-slate-400">{t.ctaHint}</span>
            </div>

            <dl className="mt-14 space-y-6 border-t border-brand-100 pt-10">
              {points.map((point) => (
                <div key={point.title} className="flex gap-4">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-gradient-to-r from-brand-600 to-aqua" />
                  <div>
                    <dt className="text-base font-semibold text-slate-800">{point.title}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-slate-500">{point.body}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          <div className="order-1 lg:order-2">
            <div className="overflow-hidden rounded-4xl bg-white shadow-float">
              <div className="bg-gradient-to-br from-brand-600 via-brand-500 to-aqua px-6 pb-16 pt-7 text-center">
                <p className="text-sm text-white/80">Yasmine Haddad</p>
                <p className="mt-1 text-xs text-white/60">
                  {fmt(dict.common.on, { date: formatDate(demo.reference, locale) })}
                </p>
              </div>

              <div className="-mt-12 px-5">
                <div className="rounded-3xl bg-white px-5 py-6 shadow-card">
                  <Gauge
                    daysUsed={demo.used}
                    referenceDate={demo.reference}
                    dict={dict}
                    locale={locale}
                    size={172}
                    bare
                  />
                </div>
              </div>

              <div className="px-5 pb-5 pt-5">
                <WindowBar
                  trips={demo.trips}
                  referenceDate={demo.reference}
                  dict={dict}
                  locale={locale}
                  markerDate={todayUtc()}
                />
                <div className="mt-4">
                  <WindowLegend dict={dict} />
                </div>
              </div>

              <div className="mx-5 mb-5 rounded-3xl bg-brand-50 px-5 py-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {dict.simulator.title}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {fmt(t.demoEntry, { date: formatDate(demo.entry, locale) })}
                </p>
                <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-3xl font-semibold tabular-nums text-brand-600">
                    {demo.stay.allowedDays}{' '}
                    <span className="text-sm font-normal text-slate-500">{dict.common.days}</span>
                  </p>
                  <p className="text-sm text-slate-500">
                    {demo.stay.maxExitDate
                      ? fmt(t.demoUntil, { date: formatDate(demo.stay.maxExitDate, locale) })
                      : '—'}
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-slate-400">{t.demoNote}</p>
          </div>
        </div>

        <p className="mt-10 border-t border-brand-100 pt-8 text-xs leading-relaxed text-slate-400">
          {t.disclaimer}
        </p>
      </main>
    </div>
  );
}
