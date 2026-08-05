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

/** Le motif de l'objet, sans le nom : l'objet bilingue le réutilise. */
function alertLabel(alert: PersonAlert, locale: 'fr' | 'en'): string {
  const fr = locale === 'fr';
  switch (alert.kind) {
    case 'OVERAGE':
      return fr ? 'dépassement Schengen' : 'Schengen overstay';
    case 'DAYS_0':
      return fr ? 'quota épuisé' : 'quota exhausted';
    default:
      return fr ? `${alert.daysLeft} jours restants` : `${alert.daysLeft} days left`;
  }
}

function alertBody(name: string, alert: PersonAlert, locale: 'fr' | 'en'): string {
  const fr = locale === 'fr';
  switch (alert.kind) {
    case 'OVERAGE':
      return fr
        ? `${name} dépasse de ${-alert.daysLeft} jour(s) le quota de ${MAX_DAYS} jours sur 180.`
        : `${name} is ${-alert.daysLeft} day(s) over the ${MAX_DAYS}-in-180 limit.`;
    case 'DAYS_0':
      return fr
        ? `${name} a consommé ses ${MAX_DAYS} jours.${alert.onTerritory ? ' La sortie doit avoir lieu aujourd’hui.' : ''}`
        : `${name} has used all ${MAX_DAYS} days.${alert.onTerritory ? ' Departure must happen today.' : ''}`;
    default:
      return fr
        ? `Il reste ${alert.daysLeft} jour(s) à ${name} dans la fenêtre de 180 jours.${alert.onTerritory ? ' Le séjour est en cours.' : ''}`
        : `${name} has ${alert.daysLeft} day(s) left in the 180-day window.${alert.onTerritory ? ' The stay is ongoing.' : ''}`;
  }
}

/** Message prêt à envoyer, en clair. */
export function alertText(
  name: string,
  alert: PersonAlert,
  locale: 'fr' | 'en' = 'fr',
): { subject: string; body: string } {
  return {
    subject: `${name} — ${alertLabel(alert, locale)}`,
    body: alertBody(name, alert, locale),
  };
}

/**
 * Le même message en français puis en anglais.
 *
 * Aucune langue n'est enregistrée par compte : plutôt que de deviner, l'alerte
 * porte les deux versions, le nom n'étant répété qu'une fois dans l'objet.
 */
export function bilingualAlertText(
  name: string,
  alert: PersonAlert,
): { subject: string; body: string } {
  return {
    subject: `${name} — ${alertLabel(alert, 'fr')} / ${alertLabel(alert, 'en')}`,
    body: `${alertBody(name, alert, 'fr')}\n\n—\n\n${alertBody(name, alert, 'en')}`,
  };
}
