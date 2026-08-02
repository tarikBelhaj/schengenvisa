// Classes partagées, pour ne pas recopier les mêmes chaînes Tailwind partout.

export const card = 'rounded-3xl bg-white shadow-card';

export const input =
  'w-full rounded-xl border border-brand-100 bg-white px-3.5 py-2.5 text-sm text-slate-800 ' +
  'shadow-sm outline-none transition placeholder:text-slate-400 ' +
  'focus:border-brand-400 focus:ring-2 focus:ring-brand-100';

export const chip =
  'rounded-xl border border-brand-100 bg-white px-3 py-1.5 text-sm font-semibold text-brand-600 shadow-sm';

export const label = 'text-sm text-slate-500';

export const btnPrimary =
  'inline-flex w-full items-center justify-center rounded-full bg-brand-500 px-6 py-3.5 ' +
  'text-sm font-semibold text-white shadow-pill transition hover:bg-brand-600 ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

export const btnGhost =
  'inline-flex items-center justify-center rounded-full border border-brand-100 bg-white px-5 py-2.5 ' +
  'text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-600';

export const btnDanger =
  'inline-flex items-center justify-center rounded-full border border-transparent px-4 py-2 ' +
  'text-sm text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600';
