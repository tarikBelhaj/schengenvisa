import Link from 'next/link';
import { redirect } from 'next/navigation';

import Gauge from '@/components/Gauge';
import Header from '@/components/Header';
import PersonForm from '@/components/PersonForm';
import { auth } from '@/lib/auth';
import { listPersons } from '@/lib/data';
import { formatDateFr, todayUtc } from '@/lib/dates';
import { daysPresentInWindow, findFirstOverage, nextPlannedTrip } from '@/lib/schengen';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const persons = await listPersons(session.user.id);
  const today = todayUtc();

  return (
    <>
      <Header email={session.user.email} />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Personnes suivies</h1>
          <p className="text-sm text-slate-500">Au {formatDateFr(today)}</p>
        </div>

        {persons.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Personne suivie pour l&apos;instant. Ajoutez la première ci-dessous.
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {persons.map((person) => {
              const used = daysPresentInWindow(person.trips, today);
              const overage = findFirstOverage(person.trips, today);
              const next = nextPlannedTrip(person.trips, today);

              return (
                <li key={person.id}>
                  <Link
                    href={`/person/${person.id}`}
                    className={`block rounded-xl bg-white p-5 shadow-sm ring-1 transition hover:shadow-md ${
                      overage ? 'ring-red-200' : 'ring-slate-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="font-semibold text-slate-900">{person.name}</h2>
                          {overage && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                              Dépassement
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {person.nationality ?? 'Nationalité non renseignée'}
                          {' · '}
                          {person.trips.length} séjour{person.trips.length > 1 ? 's' : ''}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                          {next ? (
                            <>
                              Prochain séjour planifié :{' '}
                              <span className="font-medium">{formatDateFr(next.entryDate)}</span>
                              {next.exitDate && <> → {formatDateFr(next.exitDate)}</>}
                            </>
                          ) : (
                            <span className="text-slate-400">Aucun séjour planifié</span>
                          )}
                        </p>
                        {overage && (
                          <p className="mt-1 text-sm text-red-600">
                            Dépassement prévu le {formatDateFr(overage.date)} —{' '}
                            {overage.daysPresent} jours dans la fenêtre.
                          </p>
                        )}
                      </div>

                      <div className="shrink-0">
                        <Gauge daysUsed={used} referenceDate={today} compact />
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <section className="mt-10 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Ajouter une personne</h2>
          <div className="mt-4">
            <PersonForm />
          </div>
        </section>
      </main>
    </>
  );
}
