/**
 * Dates pures en UTC, sans heures.
 *
 * Toute la logique 90/180 raisonne en « numéro de jour » (jours écoulés depuis
 * l'epoch UTC). Un entier ne connaît ni fuseau ni heure d'été : c'est ce qui
 * garantit qu'un séjour du 1er au 10 fait 10 jours, où que soit l'utilisateur.
 */

export const MS_PER_DAY = 86_400_000;

/** Accepte un Date, un timestamp, ou une chaîne "YYYY-MM-DD". */
export type DateInput = Date | string | number;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;

/** Numéro de jour UTC (jours depuis 1970-01-01). */
export function toEpochDay(input: DateInput): number {
  if (typeof input === 'string') {
    const m = ISO_DATE.exec(input);
    if (!m) throw new Error(`Date invalide: ${input}`);
    return Math.floor(
      Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / MS_PER_DAY,
    );
  }
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) throw new Error(`Date invalide: ${String(input)}`);
  // On lit les composantes UTC : une colonne @db.Date revient à minuit UTC.
  return Math.floor(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / MS_PER_DAY,
  );
}

/** Date à minuit UTC à partir d'un numéro de jour. */
export function fromEpochDay(day: number): Date {
  return new Date(day * MS_PER_DAY);
}

/** Normalise n'importe quelle entrée en Date à minuit UTC. */
export function toUtcDate(input: DateInput): Date {
  return fromEpochDay(toEpochDay(input));
}

export function addDays(input: DateInput, days: number): Date {
  return fromEpochDay(toEpochDay(input) + days);
}

/** Nombre de jours de `a` à `b` (négatif si b précède a). */
export function diffDays(a: DateInput, b: DateInput): number {
  return toEpochDay(b) - toEpochDay(a);
}

/** Durée d'un séjour, bornes incluses. */
export function inclusiveDays(entry: DateInput, exit: DateInput): number {
  return Math.max(0, diffDays(entry, exit) + 1);
}

/** "YYYY-MM-DD" — le format des <input type="date"> et de l'affichage. */
export function toIsoDate(input: DateInput): string {
  return fromEpochDay(toEpochDay(input)).toISOString().slice(0, 10);
}

/** Aujourd'hui, à minuit UTC. */
export function todayUtc(): Date {
  return toUtcDate(new Date());
}

const MONTHS = {
  fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
       'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
} as const;

/**
 * Affichage court, sans dépendre du fuseau du navigateur.
 *
 * On n'utilise pas `toLocaleDateString` : il rendrait la date dans le fuseau
 * local, ce qui décalerait l'affichage d'un jour à l'ouest de Greenwich.
 */
export function formatDate(input: DateInput, locale: 'fr' | 'en' = 'fr'): string {
  const d = toUtcDate(input);
  const month = MONTHS[locale][d.getUTCMonth()];
  return locale === 'en'
    ? `${month} ${d.getUTCDate()}, ${d.getUTCFullYear()}`
    : `${d.getUTCDate()} ${month} ${d.getUTCFullYear()}`;
}
