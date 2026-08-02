export const LOCALES = ['fr', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'fr';

/** Cookie qui porte la langue choisie. Un an, lisible côté serveur. */
export const LOCALE_COOKIE = 'locale';
export const LOCALE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * Interpolation minimale : `fmt('{n} jours', { n: 3 })`.
 *
 * Les valeurs du dictionnaire restent de simples chaînes — donc sérialisables,
 * donc transmissibles telles quelles aux composants client. Une fonction ne
 * franchirait pas la frontière serveur/client.
 */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in vars ? String(vars[key]) : match,
  );
}
