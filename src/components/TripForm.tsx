'use client';

import { useFormState, useFormStatus } from 'react-dom';

import { saveTrip, type ActionState } from '@/app/actions';
import type { TripDTO } from '@/lib/data';

const field =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm ' +
  'focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
const label = 'block text-xs font-medium uppercase tracking-wide text-slate-500';

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm
                 hover:bg-indigo-500 disabled:opacity-60"
    >
      {pending ? 'Enregistrement…' : children}
    </button>
  );
}

interface TripFormProps {
  personId: string;
  /** Fourni = édition, absent = création. */
  trip?: TripDTO;
}

export default function TripForm({ personId, trip }: TripFormProps) {
  const [state, formAction] = useFormState<ActionState, FormData>(saveTrip, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="personId" value={personId} />
      {trip && <input type="hidden" name="id" value={trip.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor={`entry-${trip?.id ?? 'new'}`}>
            Entrée
          </label>
          <input
            id={`entry-${trip?.id ?? 'new'}`}
            className={`${field} mt-1`}
            type="date"
            name="entryDate"
            required
            defaultValue={trip?.entryDate}
          />
        </div>
        <div>
          <label className={label} htmlFor={`exit-${trip?.id ?? 'new'}`}>
            Sortie
          </label>
          <input
            id={`exit-${trip?.id ?? 'new'}`}
            className={`${field} mt-1`}
            type="date"
            name="exitDate"
            defaultValue={trip?.exitDate ?? ''}
          />
          <p className="mt-1 text-xs text-slate-400">Vide = séjour en cours</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor={`status-${trip?.id ?? 'new'}`}>
            Statut
          </label>
          <select
            id={`status-${trip?.id ?? 'new'}`}
            className={`${field} mt-1`}
            name="status"
            defaultValue={trip?.status ?? 'PAST'}
          >
            <option value="PAST">Passé</option>
            <option value="PLANNED">Planifié</option>
          </select>
        </div>
        <div>
          <label className={label} htmlFor={`country-${trip?.id ?? 'new'}`}>
            Pays (optionnel)
          </label>
          <input
            id={`country-${trip?.id ?? 'new'}`}
            className={`${field} mt-1`}
            name="country"
            defaultValue={trip?.country ?? ''}
            placeholder="France, Espagne…"
          />
        </div>
      </div>

      <div>
        <label className={label} htmlFor={`note-${trip?.id ?? 'new'}`}>
          Note (optionnel)
        </label>
        <input
          id={`note-${trip?.id ?? 'new'}`}
          className={`${field} mt-1`}
          name="note"
          defaultValue={trip?.note ?? ''}
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <SubmitButton>{trip ? 'Mettre à jour' : 'Ajouter le séjour'}</SubmitButton>
    </form>
  );
}
