'use client';

import { useFormState, useFormStatus } from 'react-dom';

import { saveTrip, type ActionState } from '@/app/actions';
import type { Dict } from '@/i18n/dictionaries';
import type { TripDTO } from '@/lib/data';
import { btnPrimary, input, label } from '@/lib/ui';

function SubmitButton({ children, saving }: { children: React.ReactNode; saving: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={btnPrimary}>
      {pending ? saving : children}
    </button>
  );
}

interface TripFormProps {
  personId: string;
  dict: Dict;
  /** Fourni = édition, absent = création. */
  trip?: TripDTO;
}

export default function TripForm({ personId, trip, dict }: TripFormProps) {
  const [state, formAction] = useFormState<ActionState, FormData>(saveTrip, {});
  const uid = trip?.id ?? 'new';
  const t = dict.tripForm;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="personId" value={personId} />
      {trip && <input type="hidden" name="id" value={trip.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor={`entry-${uid}`}>
            {t.entry}
          </label>
          <input
            id={`entry-${uid}`}
            className={`${input} mt-1.5`}
            type="date"
            name="entryDate"
            required
            defaultValue={trip?.entryDate}
          />
        </div>
        <div>
          <label className={label} htmlFor={`exit-${uid}`}>
            {t.exit}
          </label>
          <input
            id={`exit-${uid}`}
            className={`${input} mt-1.5`}
            type="date"
            name="exitDate"
            defaultValue={trip?.exitDate ?? ''}
          />
          <p className="mt-1.5 text-xs text-slate-400">{t.exitHint}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor={`status-${uid}`}>
            {t.status}
          </label>
          <select
            id={`status-${uid}`}
            className={`${input} mt-1.5`}
            name="status"
            defaultValue={trip?.status ?? 'PAST'}
          >
            <option value="PAST">{t.statusPast}</option>
            <option value="PLANNED">{t.statusPlanned}</option>
          </select>
        </div>
        <div>
          <label className={label} htmlFor={`country-${uid}`}>
            {t.country} <span className="text-slate-400">{dict.common.optional}</span>
          </label>
          <input
            id={`country-${uid}`}
            className={`${input} mt-1.5`}
            name="country"
            defaultValue={trip?.country ?? ''}
            placeholder={t.countryPlaceholder}
          />
        </div>
      </div>

      <div>
        <label className={label} htmlFor={`note-${uid}`}>
          {t.note} <span className="text-slate-400">{dict.common.optional}</span>
        </label>
        <input
          id={`note-${uid}`}
          className={`${input} mt-1.5`}
          name="note"
          defaultValue={trip?.note ?? ''}
        />
      </div>

      {state.error && (
        <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{state.error}</p>
      )}

      <SubmitButton saving={dict.common.saving}>
        {trip ? dict.common.update : t.submit}
      </SubmitButton>
    </form>
  );
}
