'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';

import { savePerson, type ActionState } from '@/app/actions';
import type { Dict } from '@/i18n/dictionaries';
import type { PersonDTO } from '@/lib/data';
import { btnPrimary, input, label } from '@/lib/ui';

import PhotoInput from './PhotoInput';

function SubmitButton({ children, saving }: { children: React.ReactNode; saving: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={btnPrimary}>
      {pending ? saving : children}
    </button>
  );
}

export default function PersonForm({ person, dict }: { person?: PersonDTO; dict: Dict }) {
  const [state, formAction] = useFormState<ActionState, FormData>(savePerson, {});
  // Suivi du nom pour que les initiales de l'aperçu se mettent à jour.
  const [name, setName] = useState(person?.name ?? '');
  const t = dict.personForm;

  return (
    <form action={formAction} className="space-y-4">
      {person && <input type="hidden" name="id" value={person.id} />}

      <PhotoInput name={name} dict={dict} initialPhoto={person?.photo} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="person-name">
            {t.name}
          </label>
          <input
            id="person-name"
            className={`${input} mt-1.5`}
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.namePlaceholder}
          />
        </div>
        <div>
          <label className={label} htmlFor="person-nationality">
            {t.nationality} <span className="text-slate-400">{dict.common.optional}</span>
          </label>
          <input
            id="person-nationality"
            className={`${input} mt-1.5`}
            name="nationality"
            defaultValue={person?.nationality ?? ''}
            placeholder={t.nationalityPlaceholder}
          />
        </div>
      </div>

      <div>
        <label className={label} htmlFor="person-notes">
          {t.notes} <span className="text-slate-400">{dict.common.optional}</span>
        </label>
        <textarea
          id="person-notes"
          className={`${input} mt-1.5`}
          name="notes"
          rows={2}
          defaultValue={person?.notes ?? ''}
        />
      </div>

      {state.error && (
        <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{state.error}</p>
      )}

      <SubmitButton saving={dict.common.saving}>
        {person ? dict.common.update : t.submit}
      </SubmitButton>
    </form>
  );
}
