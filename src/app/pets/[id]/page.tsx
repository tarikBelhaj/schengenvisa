import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import Avatar from '@/components/Avatar';
import Header from '@/components/Header';
import DogForm from '@/components/pets/DogForm';
import TravelChecker from '@/components/pets/TravelChecker';
import VetRecordForm from '@/components/pets/VetRecordForm';
import VetTimeline from '@/components/pets/VetTimeline';
import { deleteDog } from '@/app/pets/actions';
import { fmt } from '@/i18n/config';
import { getI18n } from '@/i18n/server';
import { auth } from '@/lib/auth';
import { diffDays, todayUtc } from '@/lib/dates';
import { expiryAlerts } from '@/lib/pets';
import { typeLabel } from '@/lib/petsLabels';
import { getDog } from '@/lib/petsData';
import { btnDanger } from '@/lib/ui';
import { countryName, flagOf } from '@/travel-rules';

export const dynamic = 'force-dynamic';

export default async function DogPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const dog = await getDog(session.user.id, params.id);
  if (!dog) notFound();

  const { locale, dict } = getI18n();
  const t = dict.pets;
  const today = todayUtc();
  const alerts = expiryAlerts(dog.records, today);

  const ageDays = dog.birthDate ? diffDays(dog.birthDate, today) : null;
  const ageText =
    ageDays === null
      ? t.ageUnknown
      : ageDays >= 365
        ? fmt(t.age, { n: Math.floor(ageDays / 365) })
        : fmt(t.ageMonths, { n: Math.floor(ageDays / 30) });

  const facts = [
    dog.sex && (dog.sex === 'MALE' ? t.male : t.female),
    dog.weightKg && `${dog.weightKg} kg`,
    dog.color,
    dog.microchip && `${t.microchip} ${dog.microchip}`,
    dog.euPassport && `${t.euPassport} ${dog.euPassport}`,
  ].filter(Boolean) as string[];

  return (
    <>
      <Header email={session.user.email} dict={dict} locale={locale} />

      <main className="mx-auto max-w-6xl px-6 pb-20">
        <Link href="/pets" className="text-sm text-slate-400 transition hover:text-brand-600">
          {t.backToList}
        </Link>

        <div className="mt-3 flex flex-wrap items-center gap-4">
          <Avatar name={dog.name} photo={dog.photo} size={64} />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{dog.name}</h1>
            <p className="mt-1 text-sm text-slate-400">
              {dog.breed ?? t.noBreed} · {ageText}
              {dog.countryCode && (
                <>
                  {' '}
                  · {flagOf(dog.countryCode)} {countryName(dog.countryCode, locale)}
                </>
              )}
            </p>
          </div>
        </div>

        {facts.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {facts.map((fact) => (
              <span
                key={fact}
                className="rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-slate-500 shadow-sm"
              >
                {fact}
              </span>
            ))}
          </div>
        )}

        {alerts.length > 0 && (
          <section className="mt-6 rounded-3xl bg-amber-50 px-6 py-5">
            <h2 className="font-semibold text-amber-900">{t.alertsTitle}</h2>
            <ul className="mt-2 space-y-1">
              {alerts.map((alert, i) => (
                <li key={`${alert.recordId}-${i}`} className="text-sm text-amber-800">
                  {fmt(alert.daysLeft < 0 ? t.alertExpired : t.alertSoon, {
                    label: typeLabel(dict, alert.type),
                    n: Math.abs(alert.daysLeft),
                  })}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="space-y-6">
            <section>
              <h2 className="text-base font-semibold text-slate-800">{t.recordsTitle}</h2>
              <div className="mt-4">
                <VetTimeline dogId={dog.id} records={dog.records} dict={dict} locale={locale} />
              </div>
            </section>

            <section className="rounded-3xl bg-white p-7 shadow-card">
              <h2 className="text-base font-semibold text-slate-800">{t.addRecord}</h2>
              <div className="mt-5">
                <VetRecordForm dogId={dog.id} dict={dict} />
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <TravelChecker dog={dog} dict={dict} locale={locale} />

            <section className="rounded-3xl bg-white p-7 shadow-card">
              <h2 className="text-base font-semibold text-slate-800">{t.profile}</h2>
              <div className="mt-5">
                <DogForm dog={dog} dict={dict} locale={locale} />
              </div>

              <form action={deleteDog} className="mt-6 border-t border-brand-50 pt-5">
                <input type="hidden" name="id" value={dog.id} />
                <button type="submit" className={btnDanger}>
                  {fmt(t.deleteDog, { name: dog.name })}
                </button>
              </form>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
