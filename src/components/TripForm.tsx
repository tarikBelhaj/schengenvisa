'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';

import { saveTrip, type ActionState } from '@/app/actions';
import type { Dict } from '@/i18n/dictionaries';
import type { TripDTO } from '@/lib/data';
import { toIsoDate, todayUtc } from '@/lib/dates';
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
  const formRef = useRef<HTMLFormElement>(null);
  const uid = trip?.id ?? 'new';
  const t = dict.tripForm;
  const today = toIsoDate(todayUtc());

  const [entryDate, setEntryDate] = useState(trip?.entryDate ?? '');
  const [exitDate, setExitDate] = useState(trip?.exitDate ?? '');
  const [status, setStatus] = useState<'PAST' | 'PLANNED'>(trip?.status ?? 'PAST');
  const [ongoing, setOngoing] = useState(trip ? trip.exitDate === null : false);

  const futureEntry = entryDate !== '' && entryDate > today;

  // Un séjour à venir ne peut pas être « passé ». On bascule au lieu de
  // laisser saisir un état que le serveur corrigerait en silence.
  useEffect(() => {
    if (futureEntry && status === 'PAST') setStatus('PLANNED');
  }, [futureEntry, status]);

  // Après une création réussie, on repart d'un formulaire vide.
  useEffect(() => {
    if (!state.savedAt || trip) return;
    formRef.current?.reset();
    setEntryDate('');
    setExitDate('');
    setStatus('PAST');
    setOngoing(false);
  }, [state.savedAt, trip]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
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
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
          />
        </div>
        <div>
          <label className={label} htmlFor={`exit-${uid}`}>
            {t.exit}
          </label>
          <input
            id={`exit-${uid}`}
            className={`${input} mt-1.5 disabled:bg-slate-50 disabled:text-slate-400`}
            type="date"
            name="exitDate"
            min={entryDate || undefined}
            disabled={ongoing}
            value={ongoing ? '' : exitDate}
            onChange={(e) => setExitDate(e.target.value)}
          />

          <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-brand-200 text-brand-500 focus:ring-brand-400"
              checked={ongoing}
              onChange={(e) => setOngoing(e.target.checked)}
            />
            {t.ongoingTrip}
          </label>
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
            value={status}
            onChange={(e) => setStatus(e.target.value as 'PAST' | 'PLANNED')}
          >
            <option value="PAST" disabled={futureEntry}>
              {t.statusPast}
            </option>
            <option value="PLANNED">{t.statusPlanned}</option>
          </select>
          {futureEntry && <p className="mt-1.5 text-xs text-brand-600">{t.futureIsPlanned}</p>}
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
