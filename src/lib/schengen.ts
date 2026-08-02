// Règle 90/180 en fenêtre glissante.
// Fenêtre = [ref - 179, ref], bornes d'entrée et de sortie incluses.
// PAST et PLANNED comptent pareil. exitDate null = séjour en cours.

import { fromEpochDay, toEpochDay, todayUtc, type DateInput } from './dates';

export const MAX_DAYS = 90;
export const WINDOW_DAYS = 180;

export type TripStatus = 'PAST' | 'PLANNED';

/** Un Trip Prisma satisfait ce type. */
export interface TripLike {
  entryDate: DateInput;
  exitDate?: DateInput | null;
  status?: TripStatus;
}

interface DaySpan {
  start: number;
  end: number;
}

// Set plutôt qu'une somme : deux séjours qui se chevauchent ne doivent pas
// compter le jour commun deux fois.
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
  /** null si l'entrée est déjà impossible. */
  maxExitDate: Date | null;
  allowedDays: number;
  /** Jours consommés au jour de l'entrée, hors simulation. */
  daysUsedAtEntry: number;
}

// Avance jour par jour et recalcule la fenêtre à chaque date. C'est ce
// recalcul qui capte la libération de crédit : de vieux jours sortent de la
// fenêtre pendant le séjour, donc un simple 90 - consommés sous-estime.
export function maxStayFromEntry(
  trips: readonly TripLike[],
  entryDate: DateInput,
): MaxStayResult {
  const entryDay = toEpochDay(entryDate);
  const daysUsedAtEntry = countPresence(trips, entryDay);

  let allowedDays = 0;
  // Un séjour ne peut pas excéder 90 jours, inutile d'aller plus loin.
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
  date: Date;
  daysPresent: number;
}

// On ne teste que les jours de présence : la fenêtre ne peut atteindre un
// nouveau maximum qu'un jour où la personne est effectivement sur place.
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
