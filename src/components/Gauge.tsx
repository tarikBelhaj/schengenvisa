import { fmt, type Locale } from '@/i18n/config';
import type { Dict } from '@/i18n/dictionaries';
import { formatDate, type DateInput } from '@/lib/dates';
import { MAX_DAYS, windowRange } from '@/lib/schengen';

// Bleu normal, ambre au-delà de 75 j, rouge en dépassement.
export function gaugeTone(daysUsed: number) {
  if (daysUsed > MAX_DAYS) {
    return { from: '#f43f5e', to: '#fb7185', text: 'text-rose-600' };
  }
  if (daysUsed >= 75) {
    return { from: '#f59e0b', to: '#fbbf24', text: 'text-amber-600' };
  }
  return { from: '#1a58d6', to: '#22cfee', text: 'text-brand-600' };
}

interface GaugeProps {
  daysUsed: number;
  referenceDate: DateInput;
  dict: Dict;
  locale: Locale;
  size?: number;
  /** Masque les bornes de la fenêtre. */
  bare?: boolean;
}

export default function Gauge({
  daysUsed,
  referenceDate,
  dict,
  locale,
  size = 208,
  bare = false,
}: GaugeProps) {
  const remaining = MAX_DAYS - daysUsed;
  const tone = gaugeTone(daysUsed);
  const ratio = Math.min(1, Math.max(0, daysUsed / MAX_DAYS));

  const stroke = Math.round(size * 0.085);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const gradientId = `gauge-${tone.from.slice(1)}`;
  const { start, end } = windowRange(referenceDate);
  const shown = Math.abs(remaining);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={tone.from} />
              <stop offset="100%" stopColor={tone.to} />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2ecfb" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - ratio)}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xs text-slate-400">
            {remaining < 0 ? dict.gauge.over : dict.gauge.remaining}
          </p>
          <p className={`text-5xl font-semibold leading-none tabular-nums ${tone.text}`}>{shown}</p>
          <p className="mt-1 text-xs text-slate-400">
            {shown > 1 ? dict.common.days : dict.common.day}
          </p>
        </div>
      </div>

      <div className="mt-5 flex w-full items-start justify-center gap-8">
        <div className="text-center">
          <p className="text-xs text-slate-400">{dict.gauge.used}</p>
          <p className="mt-0.5 text-base font-semibold tabular-nums text-slate-800">
            {daysUsed} <span className="font-normal text-slate-400">/ {MAX_DAYS}</span>
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400">{dict.gauge.window}</p>
          <p className="mt-0.5 text-base font-semibold tabular-nums text-slate-800">
            180 {locale === 'en' ? 'd' : 'j'}
          </p>
        </div>
      </div>

      {!bare && (
        <p className="mt-3 text-center text-xs text-slate-400">
          {formatDate(start, locale)} → {formatDate(end, locale)}
        </p>
      )}
    </div>
  );
}

export function GaugeBar({ daysUsed, dict }: { daysUsed: number; dict: Dict }) {
  const remaining = MAX_DAYS - daysUsed;
  const tone = gaugeTone(daysUsed);
  const percent = Math.min(100, (daysUsed / MAX_DAYS) * 100);

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-brand-100">
        <div
          className="h-full rounded-full"
          style={{
            width: `${percent}%`,
            backgroundImage: `linear-gradient(90deg, ${tone.from}, ${tone.to})`,
          }}
        />
      </div>
      <span className={`text-sm font-semibold tabular-nums ${tone.text}`}>
        {remaining < 0
          ? fmt(dict.gauge.overShort, { n: -remaining })
          : fmt(dict.gauge.remainingShort, { n: remaining })}
      </span>
    </div>
  );
}
