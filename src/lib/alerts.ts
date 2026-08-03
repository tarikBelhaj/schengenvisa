import { toEpochDay, todayUtc, type DateInput } from './dates';
import { daysRemaining, findFirstOverage, MAX_DAYS, type TripLike } from './schengen';

export const WARN_DAYS = 10;

export type AlertKind = 'DAYS_10' | 'DAYS_0' | 'OVERAGE';

export interface PersonAlert {
  kind: AlertKind;
  daysLeft: number;
  /** Vrai si la personne est actuellement dans l'espace Schengen. */
  onTerritory: boolean;
}

/** La personne a-t-elle un séjour couvrant la date de référence ? */
export function isOnTerritory(
  trips: readonly TripLike[],
  referenceDate: DateInput = todayUtc(),
): boolean {
  const ref = toEpochDay(referenceDate);
  return trips.some((trip) => {
    const entry = toEpochDay(trip.entryDate);
    const exit = trip.exitDate == null ? Infinity : toEpochDay(trip.exitDate);
    return entry <= ref && ref <= exit;
  });
}

/**
 * L'alerte en vigueur pour une personne, ou null.
 *
 * Un seul niveau est rendu à la fois, du plus grave au plus léger : inutile
 * d'envoyer « il reste 10 jours » à quelqu'un déjà en dépassement.
 */
export function personAlert(
  trips: readonly TripLike[],
  referenceDate: DateInput = todayUtc(),
): PersonAlert | null {
  const left = daysRemaining(trips, referenceDate);
  const onTerritory = isOnTerritory(trips, referenceDate);

  if (findFirstOverage(trips, referenceDate) !== null || left < 0) {
    return { kind: 'OVERAGE', daysLeft: left, onTerritory };
  }
  if (left === 0) return { kind: 'DAYS_0', daysLeft: 0, onTerritory };
  if (left <= WARN_DAYS) return { kind: 'DAYS_10', daysLeft: left, onTerritory };
  return null;
}

/** Message prêt à envoyer, en clair. */
export function alertText(
  name: string,
  alert: PersonAlert,
  locale: 'fr' | 'en' = 'fr',
): { subject: string; body: string } {
  const fr = locale === 'fr';
  switch (alert.kind) {
    case 'OVERAGE':
      return {
        subject: fr ? `${name} — dépassement Schengen` : `${name} — Schengen overstay`,
        body: fr
          ? `${name} dépasse de ${-alert.daysLeft} jour(s) le quota de ${MAX_DAYS} jours sur 180.`
          : `${name} is ${-alert.daysLeft} day(s) over the ${MAX_DAYS}-in-180 limit.`,
      };
    case 'DAYS_0':
      return {
        subject: fr ? `${name} — quota épuisé` : `${name} — quota exhausted`,
        body: fr
          ? `${name} a consommé ses ${MAX_DAYS} jours.${alert.onTerritory ? ' La sortie doit avoir lieu aujourd’hui.' : ''}`
          : `${name} has used all ${MAX_DAYS} days.${alert.onTerritory ? ' Departure must happen today.' : ''}`,
      };
    default:
      return {
        subject: fr ? `${name} — ${alert.daysLeft} jours restants` : `${name} — ${alert.daysLeft} days left`,
        body: fr
          ? `Il reste ${alert.daysLeft} jour(s) à ${name} dans la fenêtre de 180 jours.${alert.onTerritory ? ' Le séjour est en cours.' : ''}`
          : `${name} has ${alert.daysLeft} day(s) left in the 180-day window.${alert.onTerritory ? ' The stay is ongoing.' : ''}`,
      };
  }
}
