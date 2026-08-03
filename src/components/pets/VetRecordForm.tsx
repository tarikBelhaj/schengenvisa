'use client';

import { useFormState, useFormStatus } from 'react-dom';

import { saveRecord, type ActionState } from '@/app/pets/actions';
import type { Dict } from '@/i18n/dictionaries';
import type { VetRecordDTO } from '@/lib/petsData';
import { btnPrimary, input, label } from '@/lib/ui';
import type { VetRecordType } from '@/travel-rules/types';

import AttachmentInput from './AttachmentInput';

const TYPES: VetRecordType[] = [
  'RABIES_VACCINE',
  'RABIES_TITER',
  'CHPPI_VACCINE',
  'LEPTOSPIROSIS_VACCINE',
  'BORDETELLA_VACCINE',
  'DEWORMING',
  'ANTIPARASITIC',
  'HEALTH_CERTIFICATE',
  'IMPORT_PERMIT',
  'OTHER',
];

/** Libellé traduit d'un type de document. */
export function typeLabel(dict: Dict, type: VetRecordType): string {
  return dict.pets[`type${type}` as keyof Dict['pets']] ?? type;
}

function SubmitButton({ children, saving }: { children: React.ReactNode; saving: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={btnPrimary}>
      {pending ? saving : children}
    </button>
  );
}

interface VetRecordFormProps {
  dogId: string;
  dict: Dict;
  record?: VetRecordDTO;
}

export default function VetRecordForm({ dogId, record, dict }: VetRecordFormProps) {
  const [state, formAction] = useFormState<ActionState, FormData>(saveRecord, {});
  const uid = record?.id ?? 'new';
  const t = dict.pets;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="dogId" value={dogId} />
      {record && <input type="hidden" name="id" value={record.id} />}

      <div>
        <label className={label} htmlFor={`rec-type-${uid}`}>
          {t.recordType}
        </label>
        <select
          id={`rec-type-${uid}`}
          className={`${input} mt-1.5`}
          name="type"
          defaultValue={record?.type ?? 'RABIES_VACCINE'}
        >
          {TYPES.map((type) => (
            <option key={type} value={type}>
              {typeLabel(dict, type)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor={`rec-date-${uid}`}>
            {t.recordDate}
          </label>
          <input
            id={`rec-date-${uid}`}
            type="date"
            className={`${input} mt-1.5`}
            name="date"
            required
            defaultValue={record?.date}
          />
        </div>
        <div>
          <label className={label} htmlFor={`rec-exp-${uid}`}>
            {t.recordExpiry}
          </label>
          <input
            id={`rec-exp-${uid}`}
            type="date"
            className={`${input} mt-1.5`}
            name="expiresAt"
            defaultValue={record?.expiresAt ?? ''}
          />
          <p className="mt-1.5 text-xs text-slate-400">{t.recordExpiryHint}</p>
        </div>
      </div>

      <div>
        <label className={label} htmlFor={`rec-label-${uid}`}>
          {t.recordLabel} <span className="text-slate-400">{dict.common.optional}</span>
        </label>
        <input
          id={`rec-label-${uid}`}
          className={`${input} mt-1.5`}
          name="label"
          defaultValue={record?.label ?? ''}
        />
      </div>

      <div>
        <label className={label} htmlFor={`rec-note-${uid}`}>
          {t.recordNote} <span className="text-slate-400">{dict.common.optional}</span>
        </label>
        <textarea
          id={`rec-note-${uid}`}
          className={`${input} mt-1.5`}
          name="note"
          rows={2}
          defaultValue={record?.note ?? ''}
        />
      </div>

      <AttachmentInput dict={dict} existingName={record?.fileName} />

      {state.error && (
        <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{state.error}</p>
      )}

      <SubmitButton saving={dict.common.saving}>
        {record ? dict.common.update : t.addRecord}
      </SubmitButton>
    </form>
  );
}
