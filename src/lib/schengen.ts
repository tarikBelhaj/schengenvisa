/**
 * Règle Schengen 90/180 — fenêtre glissante.
 *
 * Sur toute période de 180 jours consécutifs se terminant à une date donnée,
 * un séjour ne peut dépasser 90 jours de présence. La fenêtre « glisse » :
 * chaque jour qui passe fait sortir un jour ancien par la gauche, ce qui
 * libère du crédit.
 *
 * Conventions :
 *  - fenêtre = [referenceDate − 179, referenceDate], soit 180 jours bornes incluses ;
 *  - un séjour compte le jour d'entrée ET le jour de sortie ;
 *  - PAST et PLANNED comptent tous les deux ;
 *  - exitDate null = séjour en cours → borné à la date de référence.
 */

import { fromEpochDay, toEpochDay, todayUtc, type DateInput } from './dates';

export const MAX_DAYS = 90;
export const WINDOW_DAYS = 180;

export type TripStatus = 'PAST' | 'PLANNED';

/** Le minimum dont le calcul a besoin — un Trip Prisma satisfait ce type. */
export interface TripLike {
  entryDate: DateInput;
  exitDate?: DateInput | null;
  status?: TripStatus;
}

/** Segment de jours [start, end] en numéros de jour UTC, bornes incluses. */
interface DaySpan {
  start: number;
  end: number;
}

/**
 * Jours de présence effectivement passés dans la fenêtre.
 *
 * Passe par un Set : deux séjours qui se chevauchent (double saisie, retour
 * anticipé mal corrigé) ne comptent le jour commun qu'une seule fois.
 */
function countPresence(
  trips: readonly TripLike[],
  referenceDay: number,
  extra?: DaySpan | null,
): number {
  const windowStart = referenceDay - (WINDOW_DAYS - 1);
  const days = new Set<number>();

  const add = (start: number, end: number) => {
    if (end < start) return;
    const from = Math.max(start, windowStart);
    const to = Math.min(end, referenceDay);
    for (let d = from; d <= to; d++) days.add(d);
  };

  for (const trip of trips) {
    const entry = toEpochDay(trip.entryDate);
    // Séjour en cours : on le considère ouvert jusqu'à la date de référence.
    const exit = trip.exitDate == null ? referenceDay : toEpochDay(trip.exitDate);
    add(entry, exit);
  }

  if (extra) add(extra.start, extra.end);

  return days.size;
}

/** Jours consommés dans la fenêtre de 180 jours se terminant à `referenceDate`. */
export function daysPresentInWindow(
  trips: readonly TripLike[],
  referenceDate: DateInput = todayUtc(),
): number {
  return countPresence(trips, toEpochDay(referenceDate));
}

/** Crédit restant à `referenceDate`. Négatif = dépassement. */
export function daysRemaining(
  trips: readonly TripLike[],
  referenceDate: DateInput = todayUtc(),
): number {
  return MAX_DAYS - daysPresentInWindow(trips, referenceDate);
}

/** Bornes de la fenêtre glissante, pour l'affichage. */
export function windowRange(referenceDate: DateInput = todayUtc()): {
  start: Date;
  end: Date;
} {
  const end = toEpochDay(referenceDate);
  return { start: fromEpochDay(end - (WINDOW_DAYS - 1)), end: fromEpochDay(end) };
}

export interface MaxStayResult {
  /** Dernier jour où la personne peut légalement rester, ou null si l'entrée est déjà impossible. */
  maxExitDate: Date | null;
  /** Nombre de jours du séjour simulé (0 si aucune journée n'est possible). */
  allowedDays: number;
  /** Jours déjà consommés dans la fenêtre au jour de l'entrée, hors simulation. */
  daysUsedAtEntry: number;
}

/**
 * « Si la personne entre le X, jusqu'à quand peut-elle rester ? »
 *
 * On avance jour par jour depuis `entryDate`. À chaque date candidate on
 * recalcule la fenêtre glissante **à cette date**, en comptant les jours
 * simulés depuis l'entrée plus tous les séjours déjà enregistrés. Dès que le
 * total dépasserait 90, on s'arrête : la veille est la sortie maximale.
 *
 * Recalculer la fenêtre à chaque pas est ce qui capte la libération de crédit :
 * un long séjour peut être autorisé parce que d'anciens jours sortent de la
 * fenêtre pendant qu'il se déroule.
 */
export function maxStayFromEntry(
  trips: readonly TripLike[],
  entryDate: DateInput,
): MaxStayResult {
  const entryDay = toEpochDay(entryDate);
  const daysUsedAtEntry = countPresence(trips, entryDay);

  let allowedDays = 0;
  // Un séjour ne peut jamais excéder 90 jours : inutile de simuler plus loin.
  for (let offset = 0; offset < MAX_DAYS; offset++) {
    const candidate = entryDay + offset;
    const total = countPresence(trips, candidate, { start: entryDay, end: candidate });
    if (total > MAX_DAYS) break;
    allowedDays = offset + 1;
  }

  return {
    maxExitDate: allowedDays > 0 ? fromEpochDay(entryDay + allowedDays - 1) : null,
    allowedDays,
    daysUsedAtEntry,
  };
}

export interface Overage {
  /** Premier jour où la fenêtre glissante dépasse 90 jours. */
  date: Date;
  /** Jours de présence constatés ce jour-là. */
  daysPresent: number;
}

/**
 * Premier jour de dépassement sur l'ensemble des séjours connus, planifiés
 * compris. C'est le drapeau rouge de la vue liste et l'alerte de la fiche.
 *
 * Il suffit de tester les jours de présence : la fenêtre ne peut atteindre un
 * nouveau maximum qu'un jour où la personne est effectivement dans l'espace
 * Schengen.
 */
export function findFirstOverage(
  trips: readonly TripLike[],
  referenceDate: DateInput = todayUtc(),
): Overage | null {
  const refDay = toEpochDay(referenceDate);
  const candidates = new Set<number>();

  for (const trip of trips) {
    const entry = toEpochDay(trip.entryDate);
    const exit = trip.exitDate == null ? Math.max(entry, refDay) : toEpochDay(trip.exitDate);
    for (let d = entry; d <= exit; d++) candidates.add(d);
  }

  for (const day of Array.from(candidates).sort((a, b) => a - b)) {
    const present = countPresence(trips, day);
    if (present > MAX_DAYS) {
      return { date: fromEpochDay(day), daysPresent: present };
    }
  }

  return null;
}

/** Prochain séjour planifié à partir de la date de référence. */
export function nextPlannedTrip<T extends TripLike>(
  trips: readonly T[],
  referenceDate: DateInput = todayUtc(),
): T | null {
  const refDay = toEpochDay(referenceDate);
  let best: T | null = null;
  let bestDay = Infinity;

  for (const trip of trips) {
    if (trip.status === 'PAST') continue;
    const entry = toEpochDay(trip.entryDate);
    if (entry >= refDay && entry < bestDay) {
      best = trip;
      bestDay = entry;
    }
  }

  return best;
}
