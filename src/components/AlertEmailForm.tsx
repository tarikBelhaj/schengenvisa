'use client';

import { useFormState, useFormStatus } from 'react-dom';

import { saveAlertEmail, type ActionState } from '@/app/actions';
import type { Dict } from '@/i18n/dictionaries';
import { input, label } from '@/lib/ui';

function SubmitButton({ children, saving }: { children: React.ReactNode; saving: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-pill transition hover:bg-brand-600 disabled:opacity-60"
    >
      {pending ? saving : children}
    </button>
  );
}

export default function AlertEmailForm({
  dict,
  current,
}: {
  dict: Dict;
  current: string | null;
}) {
  const [state, formAction] = useFormState<ActionState, FormData>(saveAlertEmail, {});
  const t = dict.alerts;

  return (
    <form action={formAction}>
      <label className={label} htmlFor="alert-email">
        {t.emailLabel}
      </label>
      <div className="mt-1.5 flex flex-wrap items-start gap-3">
        <input
          id="alert-email"
          type="email"
          name="alertEmail"
          className={`${input} sm:max-w-xs`}
          defaultValue={current ?? ''}
          placeholder="vous@exemple.com"
        />
        <SubmitButton saving={dict.common.saving}>{dict.common.update}</SubmitButton>
      </div>

      {state.error && <p className="mt-2 text-sm text-rose-600">{state.error}</p>}
      {state.savedAt && !state.error && (
        <p className="mt-2 text-sm text-emerald-600">{t.emailSaved}</p>
      )}
      <p className="mt-2 text-xs leading-relaxed text-slate-400">{t.emailHint}</p>
    </form>
  );
}
