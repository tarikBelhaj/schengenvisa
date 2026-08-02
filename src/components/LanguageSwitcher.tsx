import { setLocale } from '@/app/actions';
import { LOCALES, type Locale } from '@/i18n/config';

const NAMES: Record<Locale, string> = { fr: 'FR', en: 'EN' };

// Server action plutôt qu'un onClick : marche sans JavaScript.
export default function LanguageSwitcher({ current }: { current: Locale }) {
  return (
    <form action={setLocale} className="flex items-center rounded-full bg-white p-1 shadow-sm">
      {LOCALES.map((locale) => {
        const active = locale === current;
        return (
          <button
            key={locale}
            type="submit"
            name="locale"
            value={locale}
            aria-current={active ? 'true' : undefined}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              active
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-brand-600'
            }`}
          >
            {NAMES[locale]}
          </button>
        );
      })}
    </form>
  );
}
