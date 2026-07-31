import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { deletePerson } from '@/app/actions';
import Gauge from '@/components/Gauge';
import Header from '@/components/Header';
import PersonForm from '@/components/PersonForm';
import Simulator from '@/components/Simulator';
import Timeline from '@/components/Timeline';
import TripForm from '@/components/TripForm';
import { auth } from '@/lib/auth';
import { getPerson } from '@/lib/data';
import { formatDateFr, todayUtc } from '@/lib/dates';
import { daysPresentInWindow, findFirstOverage, MAX_DAYS } from '@/lib/schengen';

export const dynamic = 'force-dynamic';

export default async function PersonPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const person = await getPerson(session.user.id, params.id);
  if (!person) notFound();

  const today = todayUtc();
  const used = daysPresentInWindow(person.trips, today);
  const overage = findFirstOverage(person.trips, today);
  const plannedCount = person.trips.filter((t) => t.status === 'PLANNED').length;

  return (
    <>
      <Header email={session.user.email} />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-800">
          ← Toutes les personnes
        </Link>

        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{person.name}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {person.nationality ?? 'Nationalité non renseignée'}
              {person.notes && <> · {person.notes}</>}
            </p>
          </div>
          <p className="text-sm text-slate-500">Au {formatDateFr(today)}</p>
        </div>

        {overage && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 ring-1 ring-red-200">
            <p className="font-semibold text-red-800">Dépassement détecté</p>
            <p className="mt-1 text-sm text-red-700">
              Le {formatDateFr(overage.date)}, la fenêtre de 180 jours atteint{' '}
              {overage.daysPresent} jours de présence — {overage.daysPresent - MAX_DAYS} de plus que
              les {MAX_DAYS} autorisés.
              {plannedCount > 0 && ' Les séjours planifiés sont inclus dans ce calcul.'}
            </p>
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Gauge daysUsed={used} referenceDate={today} />
          <Simulator personName={person.name} trips={person.trips} />
        </div>

        <section className="mt-10">
          <h2 className="text-base font-semibold text-slate-900">Séjours</h2>
          <div className="mt-4">
            <Timeline personId={person.id} trips={person.trips} />
          </div>
        </section>

        <section className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Ajouter un séjour</h2>
          <div className="mt-4">
            <TripForm personId={person.id} />
          </div>
        </section>

        <section className="mt-10 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Fiche</h2>
          <div className="mt-4">
            <PersonForm person={person} />
          </div>

          <form action={deletePerson} className="mt-6 border-t border-slate-200 pt-4">
            <input type="hidden" name="id" value={person.id} />
            <button
              type="submit"
              className="text-sm text-slate-500 hover:text-red-600"
            >
              Supprimer {person.name} et ses {person.trips.length} séjour
              {person.trips.length > 1 ? 's' : ''}
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
