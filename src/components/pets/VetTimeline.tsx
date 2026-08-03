import { deleteRecord } from '@/app/pets/actions';
import { fmt, type Locale } from '@/i18n/config';
import type { Dict } from '@/i18n/dictionaries';
import { formatDate, toEpochDay, todayUtc } from '@/lib/dates';
import { docStatus, effectiveExpiry, type DocStatus } from '@/lib/pets';
import type { VetRecordDTO } from '@/lib/petsData';
import { btnDanger } from '@/lib/ui';

import { typeLabel } from '@/lib/petsLabels';

import VetRecordForm from './VetRecordForm';

const TONE: Record<DocStatus, string> = {
  VALID: 'bg-emerald-50 text-emerald-700',
  EXPIRING_SOON: 'bg-amber-50 text-amber-700',
  EXPIRED: 'bg-rose-50 text-rose-700',
  NO_EXPIRY: 'bg-slate-100 text-slate-500',
};

const DOT: Record<DocStatus, string> = {
  VALID: 'bg-emerald-500',
  EXPIRING_SOON: 'bg-amber-500',
  EXPIRED: 'bg-rose-500',
  NO_EXPIRY: 'bg-slate-300',
};

interface VetTimelineProps {
  dogId: string;
  records: VetRecordDTO[];
  dict: Dict;
  locale: Locale;
}

export default function VetTimeline({ dogId, records, dict, locale }: VetTimelineProps) {
  const t = dict.pets;

  if (records.length === 0) {
    return (
      <p className="rounded-3xl border border-dashed border-brand-200 bg-white/60 p-8 text-center text-sm text-slate-500">
        {t.noRecords}
      </p>
    );
  }

  const today = todayUtc();
  const ordered = [...records].sort((a, b) => toEpochDay(b.date) - toEpochDay(a.date));

  return (
    <ol className="space-y-3">
      {ordered.map((record) => {
        const expiryDay = effectiveExpiry(record);
        const status = docStatus(expiryDay, today);
        const statusText =
          status === 'VALID'
            ? t.statusValid
            : status === 'EXPIRING_SOON'
              ? t.statusExpiring
              : status === 'EXPIRED'
                ? t.statusExpired
                : t.statusNoExpiry;

        return (
          <li key={record.id} className="rounded-3xl bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT[status]}`} />
                  <span className="font-semibold text-slate-800">
                    {record.label || typeLabel(dict, record.type)}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE[status]}`}>
                    {statusText}
                  </span>
                </div>

                <p className="mt-1.5 pl-[18px] text-sm text-slate-500">
                  {formatDate(record.date, locale)}
                  {record.expiresAt && (
                    <> · {fmt(t.expiresOn, { date: formatDate(record.expiresAt, locale) })}</>
                  )}
                  {record.label && <> · {typeLabel(dict, record.type)}</>}
                </p>

                {record.note && (
                  <p className="mt-1 pl-[18px] text-sm text-slate-500">{record.note}</p>
                )}

                {record.hasFile && (
                  <a
                    href={`/pets/attachment/${record.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 ml-[18px] inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 transition hover:bg-brand-100"
                  >
                    {t.download} · {record.fileName}
                  </a>
                )}
              </div>

              <form action={deleteRecord} className="shrink-0">
                <input type="hidden" name="id" value={record.id} />
                <input type="hidden" name="dogId" value={dogId} />
                <button type="submit" className={btnDanger}>
                  {dict.common.delete}
                </button>
              </form>
            </div>

            <details className="mt-3">
              <summary className="inline-flex cursor-pointer list-none items-center rounded-full border border-brand-100 px-4 py-1.5 text-sm text-slate-500 transition hover:border-brand-300 hover:text-brand-600">
                {dict.common.edit}
              </summary>
              <div className="mt-4 rounded-2xl bg-brand-50/60 p-4">
                <VetRecordForm dogId={dogId} record={record} dict={dict} />
              </div>
            </details>
          </li>
        );
      })}
    </ol>
  );
}
