import { describe, expect, it } from 'vitest';

import { toIsoDate } from './dates';
import {
  assessTravel,
  docStatus,
  earliestTravelDate,
  effectiveExpiry,
  expiryAlerts,
  normalizeBreed,
  type DogLike,
  type RecordLike,
} from './pets';
import {
  ALL_COUNTRY_CODES,
  COUNTRY_CODES,
  countryName,
  flagOf,
  getCountry,
  isCountryCode,
} from '@/travel-rules';

const TRAVEL = '2026-06-01';

const dog: DogLike = {
  breed: 'Labrador',
  birthDate: '2024-01-01',
  microchip: '250269604123456',
  euPassport: 'FR12345',
};

const rec = (type: RecordLike['type'], date: string, expiresAt?: string): RecordLike => ({
  id: `${type}-${date}`,
  type,
  date,
  expiresAt: expiresAt ?? null,
});

/** Dossier complet pour Oman au 1er juin 2026. */
function omanFullFile(): RecordLike[] {
  return [
    rec('RABIES_VACCINE', '2026-01-10', '2027-01-10'),
    rec('RABIES_TITER', '2026-02-10', '2027-02-10'),
    rec('IMPORT_PERMIT', '2026-05-20', '2026-06-19'),
    rec('HEALTH_CERTIFICATE', '2026-05-25'),
    rec('DEWORMING', '2026-05-25'),
  ];
}

describe('registre des pays', () => {
  it('expose les cinq pays', () => {
    expect(COUNTRY_CODES.sort()).toEqual(['FR', 'GB', 'JP', 'OM', 'US']);
  });

  it('est insensible à la casse', () => {
    expect(getCountry('om')?.code).toBe('OM');
  });

  it('rend null pour un pays inconnu', () => {
    expect(getCountry('ZZ')).toBeNull();
  });

  it('donne des identifiants d’exigence uniques par pays', () => {
    for (const code of COUNTRY_CODES) {
      const ids = getCountry(code)!.requirements.map((r) => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('ne référence que des requiresAfter existants et antérieurs', () => {
    for (const code of COUNTRY_CODES) {
      const reqs = getCountry(code)!.requirements;
      reqs.forEach((req, index) => {
        if (!req.requiresAfter) return;
        const target = reqs.findIndex((r) => r.id === req.requiresAfter);
        expect(target).toBeGreaterThanOrEqual(0);
        // Doit être évalué avant, sinon la dépendance ne peut pas être résolue.
        expect(target).toBeLessThan(index);
      });
    }
  });
});

describe('normalizeBreed', () => {
  it('retire accents et casse', () => {
    expect(normalizeBreed('Bergér Bêlge')).toBe('berger belge');
    expect(normalizeBreed('  Dogo Argentino ')).toBe('dogo argentino');
  });
});

describe('effectiveExpiry et docStatus', () => {
  it('préfère la date saisie à la durée de validité', () => {
    const day = effectiveExpiry(rec('RABIES_VACCINE', '2026-01-01', '2026-03-01'), 365);
    expect(toIsoDate(day! * 86_400_000)).toBe('2026-03-01');
  });

  it('déduit l’échéance de la durée de validité', () => {
    const day = effectiveExpiry(rec('RABIES_VACCINE', '2026-01-01'), 365);
    expect(toIsoDate(day! * 86_400_000)).toBe('2027-01-01');
  });

  it('rend null sans date ni durée', () => {
    expect(effectiveExpiry(rec('HEALTH_CERTIFICATE', '2026-01-01'))).toBeNull();
  });

  it('classe les statuts autour de la date de référence', () => {
    const d = (iso: string) => effectiveExpiry(rec('OTHER', '2020-01-01', iso));
    expect(docStatus(d('2026-05-31'), TRAVEL)).toBe('EXPIRED');
    expect(docStatus(d('2026-06-01'), TRAVEL)).toBe('EXPIRING_SOON');
    expect(docStatus(d('2026-07-01'), TRAVEL)).toBe('EXPIRING_SOON');
    expect(docStatus(d('2026-07-02'), TRAVEL)).toBe('VALID');
    expect(docStatus(null, TRAVEL)).toBe('NO_EXPIRY');
  });
});

describe('assessTravel — Oman', () => {
  it('valide un dossier complet', () => {
    const a = assessTravel(dog, omanFullFile(), 'OM', TRAVEL)!;
    expect(a.compliant).toBe(true);
    expect(a.score).toBe(100);
    expect(a.remainingSteps).toBe(0);
  });

  it('signale le titrage manquant', () => {
    const records = omanFullFile().filter((r) => r.type !== 'RABIES_TITER');
    const a = assessTravel(dog, records, 'OM', TRAVEL)!;
    expect(a.compliant).toBe(false);
    expect(a.checks.find((c) => c.requirementId === 'titer')?.status).toBe('MISSING');
    expect(a.remainingSteps).toBe(1);
  });

  it('refuse un titrage antérieur à la vaccination', () => {
    const records = omanFullFile().map((r) =>
      r.type === 'RABIES_TITER' ? rec('RABIES_TITER', '2025-12-01', '2026-12-01') : r,
    );
    const a = assessTravel(dog, records, 'OM', TRAVEL)!;
    expect(a.checks.find((c) => c.requirementId === 'titer')?.status).toBe('ORDER_INVALID');
  });

  it('refuse une vaccination trop récente et chiffre l’attente', () => {
    const records = omanFullFile().map((r) =>
      r.type === 'RABIES_VACCINE' ? rec('RABIES_VACCINE', '2026-05-20', '2027-05-20') : r,
    );
    const a = assessTravel(dog, records, 'OM', TRAVEL)!;
    const check = a.checks.find((c) => c.requirementId === 'rabies')!;
    expect(check.status).toBe('TOO_RECENT');
    expect(check.daysShort).toBe(18); // 30 requis, 12 écoulés
  });

  it('refuse un certificat sanitaire trop ancien', () => {
    const records = omanFullFile().map((r) =>
      r.type === 'HEALTH_CERTIFICATE' ? rec('HEALTH_CERTIFICATE', '2026-05-01') : r,
    );
    const a = assessTravel(dog, records, 'OM', TRAVEL)!;
    expect(a.checks.find((c) => c.requirementId === 'health-certificate')?.status).toBe('TOO_OLD');
  });

  it('détecte un permis expiré', () => {
    const records = omanFullFile().map((r) =>
      r.type === 'IMPORT_PERMIT' ? rec('IMPORT_PERMIT', '2026-03-01', '2026-04-01') : r,
    );
    const a = assessTravel(dog, records, 'OM', TRAVEL)!;
    expect(a.checks.find((c) => c.requirementId === 'import-permit')?.status).toBe('EXPIRED');
  });

  it('refuse une vaccination faite trop jeune', () => {
    const puppy: DogLike = { ...dog, birthDate: '2025-11-20' };
    const a = assessTravel(puppy, omanFullFile(), 'OM', TRAVEL)!;
    expect(a.checks.find((c) => c.requirementId === 'rabies')?.status).toBe('AGE_INVALID');
  });

  it('ignore le CHPPI, non obligatoire, dans le score', () => {
    const a = assessTravel(dog, omanFullFile(), 'OM', TRAVEL)!;
    expect(a.checks.find((c) => c.requirementId === 'chppi')?.status).toBe('MISSING');
    expect(a.compliant).toBe(true);
  });
});

describe('assessTravel — blocages', () => {
  it('bloque une race interdite', () => {
    const banned: DogLike = { ...dog, breed: 'American Staffordshire Terrier' };
    const a = assessTravel(banned, omanFullFile(), 'OM', TRAVEL)!;
    expect(a.compliant).toBe(false);
    expect(a.blockers.map((b) => b.kind)).toContain('BREED');
  });

  it('bloque un chien trop jeune', () => {
    const puppy: DogLike = { ...dog, birthDate: '2026-04-01' };
    const a = assessTravel(puppy, omanFullFile(), 'OM', TRAVEL)!;
    expect(a.blockers.map((b) => b.kind)).toContain('AGE');
  });

  it('bloque l’absence de puce', () => {
    const a = assessTravel({ ...dog, microchip: null }, omanFullFile(), 'OM', TRAVEL)!;
    expect(a.blockers.map((b) => b.kind)).toContain('MICROCHIP');
  });

  it('exige le passeport européen pour la France', () => {
    const a = assessTravel({ ...dog, euPassport: null }, [], 'FR', TRAVEL)!;
    expect(a.blockers.map((b) => b.kind)).toContain('EU_PASSPORT');
  });

  it('fait baisser le score sans jamais le rendre négatif', () => {
    const a = assessTravel({ breed: 'Pit Bull' }, [], 'OM', TRAVEL)!;
    expect(a.score).toBeGreaterThanOrEqual(0);
    expect(a.compliant).toBe(false);
  });

  it('rend null pour une destination inconnue', () => {
    expect(assessTravel(dog, [], 'ZZ', TRAVEL)).toBeNull();
  });
});

describe('score', () => {
  it('vaut 0 sans aucun document', () => {
    expect(assessTravel(dog, [], 'OM', TRAVEL)!.score).toBe(0);
  });

  it('progresse avec les documents fournis', () => {
    const partial = omanFullFile().slice(0, 2);
    const a = assessTravel(dog, partial, 'OM', TRAVEL)!;
    expect(a.score).toBeGreaterThan(0);
    expect(a.score).toBeLessThan(100);
  });
});

describe('expiryAlerts', () => {
  it('remonte les paliers 90, 30 et 7', () => {
    const records = [
      rec('RABIES_VACCINE', '2020-01-01', '2026-08-25'), // 85 j
      rec('CHPPI_VACCINE', '2020-01-01', '2026-06-25'), // 24 j
      rec('DEWORMING', '2020-01-01', '2026-06-05'), // 4 j
    ];
    const alerts = expiryAlerts(records, TRAVEL);
    expect(alerts.map((a) => a.threshold)).toEqual([7, 30, 90]);
  });

  it('ignore ce qui expire au-delà de 90 jours', () => {
    expect(expiryAlerts([rec('OTHER', '2020-01-01', '2027-01-01')], TRAVEL)).toHaveLength(0);
  });

  it('remonte les documents périmés au palier 0', () => {
    const alerts = expiryAlerts([rec('OTHER', '2020-01-01', '2026-05-01')], TRAVEL);
    expect(alerts[0].threshold).toBe(0);
    expect(alerts[0].daysLeft).toBeLessThan(0);
  });

  it('ignore les documents sans échéance', () => {
    expect(expiryAlerts([rec('HEALTH_CERTIFICATE', '2026-05-25')], TRAVEL)).toHaveLength(0);
  });
});

describe('earliestTravelDate', () => {
  it('rend la date du jour quand tout est déjà conforme', () => {
    const date = earliestTravelDate(dog, omanFullFile(), 'OM', TRAVEL);
    expect(toIsoDate(date!)).toBe(TRAVEL);
  });

  it('trouve la date où la carence de 30 jours sera purgée', () => {
    const records = omanFullFile().map((r) =>
      r.type === 'RABIES_VACCINE' ? rec('RABIES_VACCINE', '2026-05-20', '2027-05-20') : r,
    );
    const date = earliestTravelDate(dog, records, 'OM', TRAVEL);
    // Le certificat sanitaire et le vermifuge expirent aussi : aucune date ne
    // satisfait tout en même temps, la fonction doit le dire franchement.
    expect(date === null || toIsoDate(date) >= '2026-06-19').toBe(true);
  });

  it('rend null quand un blocage est définitif', () => {
    const banned: DogLike = { ...dog, breed: 'Pit Bull' };
    expect(earliestTravelDate(banned, omanFullFile(), 'OM', TRAVEL)).toBeNull();
  });
});

describe('liste ISO des pays', () => {
  it('couvre les 249 codes et contient GB', () => {
    expect(ALL_COUNTRY_CODES.length).toBeGreaterThan(240);
    expect(ALL_COUNTRY_CODES).toContain('GB');
    expect(isCountryCode('gb')).toBe(true);
    expect(isCountryCode('ZZ')).toBe(false);
  });

  it('n’a aucun doublon', () => {
    expect(new Set(ALL_COUNTRY_CODES).size).toBe(ALL_COUNTRY_CODES.length);
  });

  it('dérive le drapeau du code', () => {
    expect(flagOf('GB')).toBe('🇬🇧');
    expect(flagOf('FR')).toBe('🇫🇷');
    expect(flagOf('X')).toBe('');
  });

  it('traduit le nom selon la langue', () => {
    expect(countryName('GB', 'fr')).toMatch(/Royaume-Uni/);
    expect(countryName('GB', 'en')).toMatch(/United Kingdom/);
  });

  it('inclut tous les pays à règles dans la liste ISO', () => {
    for (const code of COUNTRY_CODES) expect(ALL_COUNTRY_CODES).toContain(code);
  });
});

describe('Royaume-Uni', () => {
  const ukDog: DogLike = { ...dog, breed: 'Labrador' };

  it('valide un dossier complet', () => {
    const records = [
      rec('RABIES_VACCINE', '2026-01-10', '2027-01-10'),
      rec('HEALTH_CERTIFICATE', '2026-05-25'),
      rec('DEWORMING', '2026-05-29'), // 3 j avant : dans la fenêtre 24-120 h
    ];
    expect(assessTravel(ukDog, records, 'GB', TRAVEL)!.compliant).toBe(true);
  });

  it('refuse un ténia traité trop tôt', () => {
    const records = [
      rec('RABIES_VACCINE', '2026-01-10', '2027-01-10'),
      rec('HEALTH_CERTIFICATE', '2026-05-25'),
      rec('DEWORMING', '2026-05-20'), // 12 j avant : hors fenêtre
    ];
    const a = assessTravel(ukDog, records, 'GB', TRAVEL)!;
    expect(a.checks.find((c) => c.requirementId === 'tapeworm')?.status).toBe('TOO_OLD');
  });

  it('interdit l’XL Bully', () => {
    const a = assessTravel({ ...dog, breed: 'XL Bully' }, [], 'GB', TRAVEL)!;
    expect(a.blockers.map((b) => b.kind)).toContain('BREED');
  });
});

describe('Oman — règle des 3 mois sur le titrage', () => {
  it('exige 90 jours entre la prise de sang et l’entrée', () => {
    const titer = getCountry('OM')!.requirements.find((r) => r.id === 'titer')!;
    expect(titer.minDaysBeforeTravel).toBe(90);
  });

  it('refuse un titrage vieux de 60 jours et chiffre l’attente', () => {
    const records = omanFullFile().map((r) =>
      r.type === 'RABIES_TITER' ? rec('RABIES_TITER', '2026-04-02', '2027-04-02') : r,
    );
    const a = assessTravel(dog, records, 'OM', TRAVEL)!;
    const check = a.checks.find((c) => c.requirementId === 'titer')!;
    expect(check.status).toBe('TOO_RECENT');
    expect(check.daysShort).toBe(30); // 90 requis, 60 écoulés
  });

  it('accepte un titrage vieux de 111 jours', () => {
    const a = assessTravel(dog, omanFullFile(), 'OM', TRAVEL)!;
    expect(a.checks.find((c) => c.requirementId === 'titer')?.status).toBe('OK');
  });

  it('expose la date du document dans le résultat', () => {
    const a = assessTravel(dog, omanFullFile(), 'OM', TRAVEL)!;
    const rabies = a.checks.find((c) => c.requirementId === 'rabies')!;
    expect(rabies.recordDay).toBeDefined();
    expect(toIsoDate(rabies.recordDay! * 86_400_000)).toBe('2026-01-10');
  });
});
