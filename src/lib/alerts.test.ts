import { describe, expect, it } from 'vitest';

import { alertText, isOnTerritory, personAlert, WARN_DAYS } from './alerts';
import type { TripLike } from './schengen';

const REF = '2026-06-01';
const past = (a: string, b: string | null): TripLike => ({ entryDate: a, exitDate: b, status: 'PAST' });

describe('isOnTerritory', () => {
  it('reconnaît un séjour en cours sans date de sortie', () => {
    expect(isOnTerritory([past('2026-05-20', null)], REF)).toBe(true);
  });

  it('reconnaît un séjour encadrant la date', () => {
    expect(isOnTerritory([past('2026-05-20', '2026-06-10')], REF)).toBe(true);
  });

  it('est faux entre deux séjours', () => {
    expect(isOnTerritory([past('2026-04-01', '2026-04-10')], REF)).toBe(false);
  });

  it('est faux avant le début', () => {
    expect(isOnTerritory([past('2026-07-01', '2026-07-10')], REF)).toBe(false);
  });
});

describe('personAlert', () => {
  it('ne dit rien quand le crédit est confortable', () => {
    expect(personAlert([past('2026-05-01', '2026-05-10')], REF)).toBeNull();
  });

  it('alerte à 10 jours restants', () => {
    // 80 jours consommés : du 12 mars au 31 mai inclus.
    const alert = personAlert([past('2026-03-13', '2026-05-31')], REF)!;
    expect(alert.kind).toBe('DAYS_10');
    expect(alert.daysLeft).toBe(WARN_DAYS);
  });

  it('alerte à 0 jour restant', () => {
    const alert = personAlert([past('2026-03-03', '2026-05-31')], REF)!;
    expect(alert.daysLeft).toBe(0);
    expect(alert.kind).toBe('DAYS_0');
  });

  it('signale le dépassement plutôt que le seuil de 10', () => {
    const alert = personAlert([past('2026-02-01', '2026-05-31')], REF)!;
    expect(alert.kind).toBe('OVERAGE');
    expect(alert.daysLeft).toBeLessThan(0);
  });

  it('indique si la personne est sur le territoire', () => {
    const ongoing = personAlert([past('2026-03-13', null)], REF)!;
    expect(ongoing.onTerritory).toBe(true);
    const finished = personAlert([past('2026-03-13', '2026-05-31')], REF)!;
    expect(finished.onTerritory).toBe(false);
  });
});

describe('alertText', () => {
  it('rédige le dépassement dans les deux langues', () => {
    const alert = { kind: 'OVERAGE' as const, daysLeft: -5, onTerritory: true };
    expect(alertText('Yasmine', alert, 'fr').body).toContain('5 jour');
    expect(alertText('Yasmine', alert, 'en').body).toContain('5 day');
  });

  it('précise la sortie du jour quand le séjour est en cours', () => {
    const alert = { kind: 'DAYS_0' as const, daysLeft: 0, onTerritory: true };
    expect(alertText('Karim', alert, 'fr').body).toContain("aujourd’hui");
  });

  it('ne parle pas de sortie quand la personne est hors zone', () => {
    const alert = { kind: 'DAYS_0' as const, daysLeft: 0, onTerritory: false };
    expect(alertText('Karim', alert, 'fr').body).not.toContain("aujourd’hui");
  });
});
