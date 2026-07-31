'use client';

import { useFormState, useFormStatus } from 'react-dom';

import { savePerson, type ActionState } from '@/app/actions';
import type { PersonDTO } from '@/lib/data';

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

export default function PersonForm({ person }: { person?: PersonDTO }) {
  const [state, formAction] = useFormState<ActionState, FormData>(savePerson, {});

  return (
    <form action={formAction} className="space-y-4">
      {person && <input type="hidden" name="id" value={person.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="person-name">
            Nom
          </label>
          <input
            id="person-name"
            className={`${field} mt-1`}
            name="name"
            required
            defaultValue={person?.name}
            placeholder="Prénom Nom"
          />
        </div>
        <div>
          <label className={label} htmlFor="person-nationality">
            Nationalité (optionnel)
          </label>
          <input
            id="person-nationality"
            className={`${field} mt-1`}
            name="nationality"
            defaultValue={person?.nationality ?? ''}
            placeholder="Tunisienne, Marocaine…"
          />
        </div>
      </div>

      <div>
        <label className={label} htmlFor="person-notes">
          Notes (optionnel)
        </label>
        <textarea
          id="person-notes"
          className={`${field} mt-1`}
          name="notes"
          rows={2}
          defaultValue={person?.notes ?? ''}
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <SubmitButton>{person ? 'Mettre à jour' : 'Ajouter la personne'}</SubmitButton>
    </form>
  );
}
