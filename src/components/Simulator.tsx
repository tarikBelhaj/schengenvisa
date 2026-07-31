'use client';

import { useMemo, useState } from 'react';

import type { TripDTO } from '@/lib/data';
import { formatDateFr, toIsoDate, todayUtc } from '@/lib/dates';
import { MAX_DAYS, maxStayFromEntry } from '@/lib/schengen';

interface SimulatorProps {
  personName: string;
  trips: TripDTO[];
}

/**
 * « Si [Person] entre le 1er décembre, jusqu'à quand peut-elle rester ? »
 *
 * Le calcul est pur et sans dépendance : il tourne dans le navigateur, la
 * réponse est instantanée à chaque changement de date.
 */
export default function Simulator({ personName, trips }: SimulatorProps) {
  const [entryDate, setEntryDate] = useState(() => toIsoDate(todayUtc()));

  const result = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) return null;
    try {
      return maxStayFromEntry(trips, entryDate);
    } catch {
      return null;
    }
  }, [trips, entryDate]);

  const impossible = result !== null && result.allowedDays === 0;

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-base font-semibold text-slate-900">Simulateur de séjour</h2>
      <p className="mt-1 text-sm text-slate-500">
        Si {personName} entre à cette date, jusqu&apos;à quand peut-elle rester ?
      </p>

      <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-slate-500">
        Date d&apos;entrée
      </label>
      <input
        type="date"
        value={entryDate}
        onChange={(e) => setEntryDate(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm
                   focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:w-56"
      />

      {result && (
        <div
          className={`mt-4 rounded-lg p-4 ring-1 ${
            impossible ? 'bg-red-50 ring-red-200' : 'bg-indigo-50 ring-indigo-200'
          }`}
        >
          {impossible ? (
            <>
              <p className="font-semibold text-red-800">Entrée impossible à cette date</p>
              <p className="mt-1 text-sm text-red-700">
                {result.daysUsedAtEntry} jours sont déjà consommés dans la fenêtre de 180 jours ·
                le quota de {MAX_DAYS} jours est atteint.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-indigo-900">
                Sortie au plus tard le{' '}
                <span className="font-semibold">{formatDateFr(result.maxExitDate!)}</span>
              </p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-indigo-900">
                {result.allowedDays} <span className="text-base font-normal">jours autorisés</span>
              </p>
              <p className="mt-2 text-xs text-indigo-700">
                {result.daysUsedAtEntry} jour{result.daysUsedAtEntry > 1 ? 's' : ''} déjà
                consommé{result.daysUsedAtEntry > 1 ? 's' : ''} dans la fenêtre au jour de
                l&apos;entrée
                {result.allowedDays === MAX_DAYS && result.daysUsedAtEntry > 0 && (
                  <> — l&apos;historique sort de la fenêtre pendant le séjour, d&apos;où les {MAX_DAYS} jours pleins</>
                )}
                .
              </p>
            </>
          )}
        </div>
      )}

      <p className="mt-3 text-xs text-slate-400">
        La simulation tient compte des séjours passés <em>et</em> planifiés déjà enregistrés.
      </p>
    </section>
  );
}
