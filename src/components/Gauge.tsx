import { formatDateFr, type DateInput } from '@/lib/dates';
import { MAX_DAYS, windowRange } from '@/lib/schengen';

interface GaugeProps {
  daysUsed: number;
  referenceDate: DateInput;
  /** Compact : version une ligne pour la liste des personnes. */
  compact?: boolean;
}

/** Palier de couleur : vert sous 60 jours, ambre au-delà, rouge en dépassement. */
export function gaugeTone(daysUsed: number) {
  if (daysUsed > MAX_DAYS) return { bar: 'bg-red-500', text: 'text-red-700', ring: 'ring-red-200' };
  if (daysUsed >= 75) return { bar: 'bg-amber-500', text: 'text-amber-700', ring: 'ring-amber-200' };
  if (daysUsed >= 60) return { bar: 'bg-yellow-500', text: 'text-yellow-700', ring: 'ring-yellow-200' };
  return { bar: 'bg-emerald-500', text: 'text-emerald-700', ring: 'ring-emerald-200' };
}

export default function Gauge({ daysUsed, referenceDate, compact = false }: GaugeProps) {
  const remaining = MAX_DAYS - daysUsed;
  const tone = gaugeTone(daysUsed);
  const percent = Math.min(100, (daysUsed / MAX_DAYS) * 100);
  const { start, end } = windowRange(referenceDate);

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-200">
          <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${percent}%` }} />
        </div>
        <span className={`text-sm font-semibold tabular-nums ${tone.text}`}>
          {remaining < 0 ? `${-remaining} j de trop` : `${remaining} j restants`}
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-xl bg-white p-5 shadow-sm ring-1 ${tone.ring}`}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Jours consommés</p>
          <p className="text-3xl font-semibold tabular-nums text-slate-900">
            {daysUsed}
            <span className="text-lg font-normal text-slate-400"> / {MAX_DAYS}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">{remaining < 0 ? 'Dépassement' : 'Restants'}</p>
          <p className={`text-3xl font-semibold tabular-nums ${tone.text}`}>
            {remaining < 0 ? -remaining : remaining}
          </p>
        </div>
      </div>

      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all ${tone.bar}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Fenêtre glissante de 180 jours : {formatDateFr(start)} → {formatDateFr(end)}
      </p>
    </div>
  );
}
