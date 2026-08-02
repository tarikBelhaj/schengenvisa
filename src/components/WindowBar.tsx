import { fmt, type Locale } from '@/i18n/config';
import type { Dict } from '@/i18n/dictionaries';
import { formatDate, fromEpochDay, toEpochDay, type DateInput } from '@/lib/dates';
import { WINDOW_DAYS, type TripLike } from '@/lib/schengen';

interface WindowBarProps {
  trips: readonly TripLike[];
  referenceDate: DateInput;
  dict: Dict;
  locale: Locale;
  markerDate?: DateInput;
}

// La fenêtre de 180 jours à l'échelle, un bloc par séjour.
export default function WindowBar({
  trips,
  referenceDate,
  dict,
  locale,
  markerDate,
}: WindowBarProps) {
  const end = toEpochDay(referenceDate);
  const start = end - (WINDOW_DAYS - 1);

  const blocks = trips
    .map((trip) => {
      const entry = toEpochDay(trip.entryDate);
      const exit = trip.exitDate == null ? end : toEpochDay(trip.exitDate);
      const from = Math.max(entry, start);
      const to = Math.min(exit, end);
      if (to < from) return null;
      return {
        left: ((from - start) / WINDOW_DAYS) * 100,
        width: ((to - from + 1) / WINDOW_DAYS) * 100,
        planned: trip.status === 'PLANNED',
        days: to - from + 1,
      };
    })
    .filter((b): b is NonNullable<typeof b> => b !== null);

  const marker = markerDate != null ? toEpochDay(markerDate) : null;
  const markerPercent =
    marker !== null && marker >= start && marker <= end
      ? ((marker - start + 0.5) / WINDOW_DAYS) * 100
      : null;

  return (
    <div>
      <div className="relative h-8 overflow-hidden rounded-full bg-brand-50 ring-1 ring-inset ring-brand-100">
        {blocks.map((block, i) => (
          <div
            key={i}
            className={`absolute inset-y-1 rounded-full ${
              block.planned
                ? 'bg-brand-200 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(255,255,255,.7)_4px,rgba(255,255,255,.7)_8px)]'
                : 'bg-gradient-to-r from-brand-600 to-aqua'
            }`}
            style={{ left: `${block.left}%`, width: `${block.width}%` }}
            title={fmt(
              block.planned ? dict.window.tooltipPlanned : dict.window.tooltip,
              { n: block.days },
            )}
          />
        ))}

        {markerPercent !== null && (
          <div
            className="absolute inset-y-0 z-10 w-0.5 rounded-full bg-slate-700/60"
            style={{ left: `${markerPercent}%` }}
          />
        )}
      </div>

      <div className="relative mt-2 h-4 text-[11px] text-slate-400">
        <span className="absolute left-0">{formatDate(fromEpochDay(start), locale)}</span>
        {/* trop près d'un bord, il chevaucherait les dates */}
        {markerPercent !== null && markerPercent > 15 && markerPercent < 85 && (
          <span
            className="absolute -translate-x-1/2 whitespace-nowrap font-medium text-slate-500"
            style={{ left: `${markerPercent}%` }}
          >
            {dict.window.today}
          </span>
        )}
        <span className="absolute right-0">{formatDate(referenceDate, locale)}</span>
      </div>
    </div>
  );
}

export function WindowLegend({ dict }: { dict: Dict }) {
  return (
    <div className="flex items-center gap-5 text-xs text-slate-500">
      <span className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-brand-600 to-aqua" />
        {dict.window.legendPast}
      </span>
      <span className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-brand-200" />
        {dict.window.legendPlanned}
      </span>
    </div>
  );
}
