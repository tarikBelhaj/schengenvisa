'use client';

import { useMemo, useState } from 'react';

import { fmt, type Locale } from '@/i18n/config';
import type { Dict } from '@/i18n/dictionaries';
import type { TripDTO } from '@/lib/data';
import { formatDate, toIsoDate, todayUtc } from '@/lib/dates';
import { MAX_DAYS, maxStayFromEntry } from '@/lib/schengen';
import { input, label } from '@/lib/ui';

interface SimulatorProps {
  personName: string;
  trips: TripDTO[];
  dict: Dict;
  locale: Locale;
}

// Le calcul est pur, il tourne côté client : réponse instantanée.
export default function Simulator({ personName, trips, dict, locale }: SimulatorProps) {
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
    <section className="overflow-hidden rounded-3xl bg-white shadow-card">
      <div
        className={`px-6 py-7 text-center ${
          impossible
            ? 'bg-gradient-to-br from-rose-500 to-rose-400'
            : 'bg-gradient-to-br from-brand-600 via-brand-500 to-aqua'
        }`}
      >
        {impossible ? (
          <>
            <p className="text-sm text-white/80">{dict.simulator.impossible}</p>
            <p className="mt-2 text-5xl font-semibold leading-none text-white">0</p>
            <p className="mt-2 text-sm text-white/80">
              {fmt(dict.simulator.impossibleBody, {
                n: result.daysUsedAtEntry,
                max: MAX_DAYS,
              })}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-white/80">{dict.simulator.possible}</p>
            <p className="mt-2 text-6xl font-semibold leading-none tabular-nums text-white">
              {result?.allowedDays ?? '—'}
            </p>
            <p className="mt-2 text-sm text-white/80">{dict.common.days}</p>

            {result?.maxExitDate && (
              <div className="mt-5 border-t border-dashed border-white/30 pt-4">
                <p className="text-xs uppercase tracking-wide text-white/70">
                  {dict.simulator.exitBy}
                </p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {formatDate(result.maxExitDate, locale)}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="px-6 py-6">
        <h2 className="text-base font-semibold text-slate-800">{dict.simulator.title}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {fmt(dict.simulator.question, { name: personName })}
        </p>

        <label className={`${label} mt-5 block`} htmlFor="sim-entry">
          {dict.simulator.entryDate}
        </label>
        <input
          id="sim-entry"
          type="date"
          value={entryDate}
          onChange={(e) => setEntryDate(e.target.value)}
          className={`${input} mt-1.5`}
        />

        {result && !impossible && result.daysUsedAtEntry > 0 && (
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            {fmt(dict.simulator.usedAtEntry, { n: result.daysUsedAtEntry })}
            {result.allowedDays === MAX_DAYS && fmt(dict.simulator.releaseNote, { max: MAX_DAYS })}
          </p>
        )}

        <p className="mt-4 text-xs text-slate-400">{dict.simulator.footnote}</p>
      </div>
    </section>
  );
}
