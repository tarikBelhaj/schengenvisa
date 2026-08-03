import Link from 'next/link';
import { redirect } from 'next/navigation';

import Avatar from '@/components/Avatar';
import Header from '@/components/Header';
import DogForm from '@/components/pets/DogForm';
import { fmt } from '@/i18n/config';
import { getI18n } from '@/i18n/server';
import { auth } from '@/lib/auth';
import { diffDays, formatDate, todayUtc } from '@/lib/dates';
import { assessTravel, expiryAlerts } from '@/lib/pets';
import { listDogs } from '@/lib/petsData';
import { flagOf } from '@/travel-rules';

export const dynamic = 'force-dynamic';

export default async function PetsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const { locale, dict } = getI18n();
  const t = dict.pets;
  const dogs = await listDogs(session.user.id);
  const today = todayUtc();

  return (
    <>
      <Header email={session.user.email} dict={dict} locale={locale} />

      <main className="mx-auto max-w-6xl px-6 pb-20">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t.title}</h1>
            <p className="mt-1 text-sm text-slate-400">{t.subtitle}</p>
          </div>
          <p className="text-sm text-slate-400">
            {fmt(dict.common.on, { date: formatDate(today, locale) })}
          </p>
        </div>

        {dogs.length === 0 ? (
          <p className="mt-6 rounded-3xl border border-dashed border-brand-200 bg-white/60 p-10 text-center text-sm text-slate-500">
            {t.empty}
          </p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {dogs.map((dog) => {
              const alerts = expiryAlerts(dog.records, today);
              const urgent = alerts.filter((a) => a.threshold <= 30).length;
              // Aperçu sur le pays de destination le plus courant du dossier.
              const preview = dog.countryCode
                ? assessTravel(dog, dog.records, dog.countryCode === 'FR' ? 'OM' : 'FR', today)
                : null;
              const age = dog.birthDate ? Math.floor(diffDays(dog.birthDate, today) / 365) : null;
              const n = dog.records.length;

              return (
                <li key={dog.id}>
                  <Link
                    href={`/pets/${dog.id}`}
                    className={`block h-full rounded-3xl bg-white p-6 shadow-card transition hover:shadow-float ${
                      urgent > 0 ? 'ring-1 ring-amber-200' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <Avatar name={dog.name} photo={dog.photo} size={52} />
                      <div className="min-w-0 flex-1">
                        <h2 className="font-semibold text-slate-800">{dog.name}</h2>
                        <p className="mt-0.5 text-sm text-slate-400">
                          {dog.breed ?? t.noBreed}
                          {age !== null && <> · {fmt(t.age, { n: age })}</>}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {fmt(n > 1 ? t.docCountPlural : t.docCount, { n })}
                          {dog.countryCode && <> · {flagOf(dog.countryCode)}</>}
                        </p>
                      </div>
                    </div>

                    {preview && (
                      <div className="mt-5 border-t border-brand-50 pt-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">{t.scoreLabel}</span>
                          <span
                            className={`font-semibold tabular-nums ${
                              preview.compliant ? 'text-emerald-600' : 'text-brand-600'
                            }`}
                          >
                            {preview.score}%
                          </span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-100">
                          <div
                            className={`h-full rounded-full ${
                              preview.compliant
                                ? 'bg-emerald-500'
                                : 'bg-gradient-to-r from-brand-600 to-aqua'
                            }`}
                            style={{ width: `${preview.score}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {urgent > 0 && (
                      <p className="mt-3 text-sm text-amber-700">
                        {fmt(alerts[0].daysLeft < 0 ? t.alertExpired : t.alertSoon, {
                          label: dict.pets[`type${alerts[0].type}` as keyof typeof dict.pets],
                          n: Math.abs(alerts[0].daysLeft),
                        })}
                      </p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <section className="mt-10 rounded-3xl bg-white p-7 shadow-card">
          <h2 className="text-base font-semibold text-slate-800">{t.addDog}</h2>
          <div className="mt-5">
            <DogForm dict={dict} locale={locale} />
          </div>
        </section>
      </main>
    </>
  );
}
