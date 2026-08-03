import { deleteTrip } from '@/app/actions';
import { fmt, type Locale } from '@/i18n/config';
import type { Dict } from '@/i18n/dictionaries';
import type { TripDTO } from '@/lib/data';
import { formatDate, inclusiveDays, toEpochDay, todayUtc } from '@/lib/dates';
import {
  daysPresentInWindow,
  historyClearDate,
  MAX_DAYS,
  maxStayFromEntry,
  windowRange,
} from '@/lib/schengen';
import { btnDanger } from '@/lib/ui';

import TripForm from './TripForm';

interface TimelineProps {
  personId: string;
  trips: TripDTO[];
  dict: Dict;
  locale: Locale;
}

function StatusBadge({ status, dict }: { status: TripDTO['status']; dict: Dict }) {
  return status === 'PLANNED' ? (
    <span className="rounded-full border border-dashed border-brand-300 bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-600">
      {dict.timeline.planned}
    </span>
  ) : (
    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
      {dict.timeline.past}
    </span>
  );
}

export default function Timeline({ personId, trips, dict, locale }: TimelineProps) {
  if (trips.length === 0) {
    return (
      <p className="rounded-3xl border border-dashed border-brand-200 bg-white/60 p-8 text-center text-sm text-slate-500">
        {dict.timeline.empty}
      </p>
    );
  }

  const today = todayUtc();
  const todayDay = toEpochDay(today);
  const ordered = [...trips].sort((a, b) => toEpochDay(b.entryDate) - toEpochDay(a.entryDate));

  return (
    <ol className="space-y-3">
      {ordered.map((trip) => {
        const isPlanned = trip.status === 'PLANNED';
        const ongoing = trip.exitDate === null;
        const duration = inclusiveDays(trip.entryDate, trip.exitDate ?? today);
        const loadAtExit = daysPresentInWindow(trips, trip.exitDate ?? today);
        const over = loadAtExit > MAX_DAYS;
        const future = toEpochDay(trip.entryDate) > todayDay;

        // Inclure le séjour lui-même est sans effet : ses jours sont déjà
        // dans la simulation et l'union ne les compte qu'une fois.
        const stay = isPlanned || future ? maxStayFromEntry(trips, trip.entryDate) : null;
        // Les autres séjours, pour expliquer d'où vient le crédit disponible.
        const others = trips.filter((other) => other.id !== trip.id);
        const clearDate = stay ? historyClearDate(others, trip.entryDate) : null;
        const entryWindow = stay ? windowRange(trip.entryDate) : null;
        // Sur les autres séjours seulement : maxStayFromEntry compte aussi le
        // jour d'entrée du séjour courant, ce qui gonflerait le chiffre de 1.
        const usedBefore = stay ? daysPresentInWindow(others, trip.entryDate) : 0;
        const naive = MAX_DAYS - usedBefore;
        const plannedExitDay = trip.exitDate ? toEpochDay(trip.exitDate) : null;
        const excess =
          stay?.maxExitDate && plannedExitDay !== null
            ? plannedExitDay - toEpochDay(stay.maxExitDate)
            : 0;

        return (
          <li key={trip.id} className="rounded-3xl bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      isPlanned
                        ? 'border-2 border-brand-400 bg-white'
                        : 'bg-gradient-to-r from-brand-600 to-aqua'
                    }`}
                  />
                  <span className="font-semibold text-slate-800">
                    {formatDate(trip.entryDate, locale)}
                    {' → '}
                    {trip.exitDate ? (
                      formatDate(trip.exitDate, locale)
                    ) : (
                      <span className="text-slate-400">{dict.timeline.ongoingInline}</span>
                    )}
                  </span>
                  <StatusBadge status={trip.status} dict={dict} />
                  {ongoing && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
                      {dict.timeline.ongoing}
                    </span>
                  )}
                </div>

                {/* aligné sous le texte, pastille + gouttière */}
                <p className="mt-1.5 pl-[18px] text-sm text-slate-500">
                  <span className="font-semibold text-slate-700 tabular-nums">
                    {duration} {locale === 'en' ? 'd' : 'j'}
                  </span>
                  {trip.country && <> · {trip.country}</>}
                  {trip.note && <> · {trip.note}</>}
                </p>

                {!future && (
                  <p
                    className={`mt-1 pl-[18px] text-xs tabular-nums ${
                      over ? 'text-rose-600' : 'text-slate-400'
                    }`}
                  >
                    {fmt(dict.timeline.loadAtExit, { n: loadAtExit, max: MAX_DAYS })}
                    {over && dict.timeline.overSuffix}
                  </p>
                )}
              </div>

              <form action={deleteTrip} className="shrink-0">
                <input type="hidden" name="id" value={trip.id} />
                <input type="hidden" name="personId" value={personId} />
                <button type="submit" className={btnDanger}>
                  {dict.common.delete}
                </button>
              </form>
            </div>

            {stay && (
              <div
                className={`mt-3 rounded-2xl px-4 py-3 ${
                  stay.allowedDays === 0 || excess > 0 ? 'bg-rose-50' : 'bg-brand-50'
                }`}
              >
                {stay.allowedDays === 0 ? (
                  <p className="text-sm font-medium text-rose-700">
                    {dict.timeline.cannotEnter}
                  </p>
                ) : (
                  <>
                    <p
                      className={`text-sm font-semibold ${
                        excess > 0 ? 'text-rose-700' : 'text-brand-700'
                      }`}
                    >
                      {fmt(dict.timeline.canStayUntil, {
                        date: formatDate(stay.maxExitDate!, locale),
                      })}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {fmt(dict.timeline.canStayDays, { n: stay.allowedDays })}
                    </p>

                    <div className="mt-3 space-y-1.5 border-t border-white/70 pt-3 text-xs leading-relaxed text-slate-600">
                      {usedBefore === 0 ? (
                        <p>{dict.timeline.stayNoHistory}</p>
                      ) : (
                        <>
                          <p>
                            {fmt(dict.timeline.stayUsedAtEntry, {
                              date: formatDate(trip.entryDate, locale),
                              n: usedBefore,
                              start: formatDate(entryWindow!.start, locale),
                              end: formatDate(entryWindow!.end, locale),
                            })}
                          </p>
                          <p>
                            <span className="text-slate-500">
                              {fmt(dict.timeline.stayNaive, { n: naive })}
                            </span>{' '}
                            {stay.allowedDays > naive && clearDate ? (
                              <span className="font-medium text-brand-700">
                                {fmt(dict.timeline.stayRelease, {
                                  n: stay.allowedDays,
                                  date: formatDate(clearDate, locale),
                                })}
                              </span>
                            ) : (
                              <span>{dict.timeline.stayNoRelease}</span>
                            )}
                          </p>
                        </>
                      )}
                    </div>
                    {excess > 0 && (
                      <p className="mt-1.5 text-xs font-medium text-rose-600">
                        {fmt(dict.timeline.exceeds, {
                          n: excess,
                          date: formatDate(trip.exitDate!, locale),
                        })}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            <details className="mt-3">
              <summary className="inline-flex cursor-pointer list-none items-center rounded-full border border-brand-100 px-4 py-1.5 text-sm text-slate-500 transition hover:border-brand-300 hover:text-brand-600">
                {dict.common.edit}
              </summary>
              <div className="mt-4 rounded-2xl bg-brand-50/60 p-4">
                <TripForm personId={personId} trip={trip} dict={dict} />
              </div>
            </details>
          </li>
        );
      })}
    </ol>
  );
}
