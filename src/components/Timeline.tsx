import { deleteTrip } from '@/app/actions';
import type { TripDTO } from '@/lib/data';
import { formatDateFr, inclusiveDays, toEpochDay, todayUtc } from '@/lib/dates';
import { daysPresentInWindow, MAX_DAYS } from '@/lib/schengen';

import TripForm from './TripForm';

interface TimelineProps {
  personId: string;
  trips: TripDTO[];
}

/** Séjour passé vs planifié : deux traitements visuels nettement distincts. */
function StatusBadge({ status }: { status: TripDTO['status'] }) {
  return status === 'PLANNED' ? (
    <span className="rounded-full border border-dashed border-indigo-300 bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
      Planifié
    </span>
  ) : (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      Passé
    </span>
  );
}

export default function Timeline({ personId, trips }: TimelineProps) {
  if (trips.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
        Aucun séjour enregistré. Ajoutez-en un ci-dessous.
      </p>
    );
  }

  const today = todayUtc();
  const todayDay = toEpochDay(today);
  // Le plus récent en haut : c'est ce qu'on consulte le plus souvent.
  const ordered = [...trips].sort((a, b) => toEpochDay(b.entryDate) - toEpochDay(a.entryDate));

  return (
    <ol className="space-y-3">
      {ordered.map((trip) => {
        const isPlanned = trip.status === 'PLANNED';
        const ongoing = trip.exitDate === null;
        const duration = inclusiveDays(trip.entryDate, trip.exitDate ?? today);
        // Charge de la fenêtre au dernier jour du séjour : rend visible le séjour
        // qui, à lui seul, fait basculer la personne en dépassement.
        const loadAtExit = daysPresentInWindow(trips, trip.exitDate ?? today);
        const over = loadAtExit > MAX_DAYS;
        const future = toEpochDay(trip.entryDate) > todayDay;

        return (
          <li
            key={trip.id}
            className={`rounded-xl bg-white p-4 shadow-sm ring-1 ${
              isPlanned ? 'ring-indigo-100' : 'ring-slate-200'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900">
                    {formatDateFr(trip.entryDate)}
                    {' → '}
                    {trip.exitDate ? (
                      formatDateFr(trip.exitDate)
                    ) : (
                      <span className="text-slate-500">en cours</span>
                    )}
                  </span>
                  <StatusBadge status={trip.status} />
                  {ongoing && (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      En cours
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  <span className="font-medium text-slate-700 tabular-nums">{duration} j</span>
                  {trip.country && <> · {trip.country}</>}
                  {trip.note && <> · {trip.note}</>}
                </p>
                {!future && (
                  <p className={`mt-1 text-xs tabular-nums ${over ? 'text-red-600' : 'text-slate-400'}`}>
                    Fenêtre à la sortie : {loadAtExit} / {MAX_DAYS} j
                    {over && ' — dépassement'}
                  </p>
                )}
              </div>

              <form action={deleteTrip} className="shrink-0">
                <input type="hidden" name="id" value={trip.id} />
                <input type="hidden" name="personId" value={personId} />
                <button
                  type="submit"
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                >
                  Supprimer
                </button>
              </form>
            </div>

            <details className="mt-3">
              <summary className="inline-block cursor-pointer list-none rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
                Modifier
              </summary>
              <div className="mt-3 rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200">
                <TripForm personId={personId} trip={trip} />
              </div>
            </details>
          </li>
        );
      })}
    </ol>
  );
}
