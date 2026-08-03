import { addDays, diffDays, toEpochDay, todayUtc, type DateInput } from './dates';
import { getCountry } from '@/travel-rules';
import type { CountryRules, Requirement, VetRecordType } from '@/travel-rules/types';

export const EXPIRY_ALERT_DAYS = [90, 30, 7] as const;

/** Un VetRecord Prisma satisfait ce type. */
export interface RecordLike {
  id?: string;
  type: VetRecordType;
  date: DateInput;
  expiresAt?: DateInput | null;
}

export interface DogLike {
  breed?: string | null;
  birthDate?: DateInput | null;
  microchip?: string | null;
  euPassport?: string | null;
}

export type DocStatus = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'NO_EXPIRY';

/** Normalise une race pour la comparer aux listes d'interdiction. */
export function normalizeBreed(breed: string): string {
  return breed
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Échéance effective d'un document : la date saisie si elle existe, sinon
 * celle déduite de la durée de validité de l'exigence.
 */
export function effectiveExpiry(
  record: RecordLike,
  validityDays?: number,
): number | null {
  if (record.expiresAt != null) return toEpochDay(record.expiresAt);
  if (validityDays != null) return toEpochDay(record.date) + validityDays;
  return null;
}

export function docStatus(
  expiryDay: number | null,
  referenceDate: DateInput = todayUtc(),
  soonWithinDays = 30,
): DocStatus {
  if (expiryDay == null) return 'NO_EXPIRY';
  const ref = toEpochDay(referenceDate);
  if (expiryDay < ref) return 'EXPIRED';
  if (expiryDay - ref <= soonWithinDays) return 'EXPIRING_SOON';
  return 'VALID';
}

export type CheckStatus =
  | 'OK'
  | 'MISSING'
  | 'EXPIRED'
  | 'EXPIRES_BEFORE_TRAVEL'
  | 'TOO_RECENT'
  | 'TOO_OLD'
  | 'ORDER_INVALID'
  | 'AGE_INVALID';

export interface Check {
  requirementId: string;
  type: VetRecordType;
  mandatory: boolean;
  status: CheckStatus;
  /** Le document retenu, le plus récent du bon type. */
  recordId?: string;
  /** Date du document retenu, en numéro de jour UTC. */
  recordDay?: number;
  expiryDay: number | null;
  /** Jours manquants avant que la condition soit remplie, si applicable. */
  daysShort?: number;
}

export interface Blocker {
  kind: 'AGE' | 'BREED' | 'MICROCHIP' | 'EU_PASSPORT';
  detail?: string;
}

export interface TravelAssessment {
  country: CountryRules;
  /** Toutes les exigences obligatoires sont satisfaites et rien ne bloque. */
  compliant: boolean;
  /** 0 à 100, part des exigences obligatoires satisfaites, blocages inclus. */
  score: number;
  checks: Check[];
  blockers: Blocker[];
  /** Nombre d'exigences obligatoires non satisfaites. */
  remainingSteps: number;
}

function latestRecord(records: readonly RecordLike[], type: VetRecordType): RecordLike | null {
  let best: RecordLike | null = null;
  for (const record of records) {
    if (record.type !== type) continue;
    if (!best || toEpochDay(record.date) > toEpochDay(best.date)) best = record;
  }
  return best;
}

function evaluateRequirement(
  requirement: Requirement,
  records: readonly RecordLike[],
  dog: DogLike,
  travelDay: number,
  satisfied: Set<string>,
  used: Map<string, RecordLike>,
): Check {
  const base = {
    requirementId: requirement.id,
    type: requirement.type,
    mandatory: requirement.mandatory,
  };

  const record = latestRecord(records, requirement.type);
  if (!record) return { ...base, status: 'MISSING', expiryDay: null };

  const recordDay = toEpochDay(record.date);
  const expiryDay = effectiveExpiry(record, requirement.validityDays);
  const result = { ...base, recordId: record.id, recordDay, expiryDay };

  // Ordre imposé : le titrage doit suivre la vaccination, par exemple.
  if (requirement.requiresAfter) {
    const previous = used.get(requirement.requiresAfter);
    if (!satisfied.has(requirement.requiresAfter) || !previous) {
      return { ...result, status: 'ORDER_INVALID' };
    }
    if (recordDay < toEpochDay(previous.date)) {
      return { ...result, status: 'ORDER_INVALID' };
    }
  }

  if (requirement.minAgeDaysAtRecord != null && dog.birthDate != null) {
    const ageAtRecord = diffDays(dog.birthDate, record.date);
    if (ageAtRecord < requirement.minAgeDaysAtRecord) {
      return { ...result, status: 'AGE_INVALID' };
    }
  }

  // Déjà périmé au jour de référence.
  if (expiryDay != null && expiryDay < travelDay) {
    return { ...result, status: 'EXPIRED' };
  }

  // Carence : le document doit dater d'au moins N jours.
  if (requirement.minDaysBeforeTravel != null) {
    const elapsed = travelDay - recordDay;
    if (elapsed < requirement.minDaysBeforeTravel) {
      return {
        ...result,
        status: 'TOO_RECENT',
        daysShort: requirement.minDaysBeforeTravel - elapsed,
      };
    }
  }

  // Fraîcheur : le document ne doit pas être trop ancien au départ.
  if (requirement.maxDaysBeforeTravel != null) {
    const elapsed = travelDay - recordDay;
    if (elapsed > requirement.maxDaysBeforeTravel) {
      return { ...result, status: 'TOO_OLD' };
    }
  }

  return { ...result, status: 'OK' };
}

/**
 * Évalue un chien contre les règles d'un pays de destination.
 *
 * `travelDate` par défaut aujourd'hui : la question posée est « puis-je partir
 * maintenant ? ». En la déplaçant, on répond à « puis-je partir le X ? ».
 */
export function assessTravel(
  dog: DogLike,
  records: readonly RecordLike[],
  destinationCode: string,
  travelDate: DateInput = todayUtc(),
  originCode?: string,
): TravelAssessment | null {
  const country = getCountry(destinationCode);
  if (!country) return null;

  const travelDay = toEpochDay(travelDate);
  const blockers: Blocker[] = [];

  if (country.minAgeDays != null && dog.birthDate != null) {
    const age = travelDay - toEpochDay(dog.birthDate);
    if (age < country.minAgeDays) {
      blockers.push({ kind: 'AGE', detail: String(country.minAgeDays - age) });
    }
  }

  if (country.bannedBreeds?.length && dog.breed) {
    const breed = normalizeBreed(dog.breed);
    if (country.bannedBreeds.some((banned) => breed.includes(banned))) {
      blockers.push({ kind: 'BREED', detail: dog.breed });
    }
  }

  if (country.microchipRequired && !dog.microchip) blockers.push({ kind: 'MICROCHIP' });
  if (country.euPassportRequired && !dog.euPassport) blockers.push({ kind: 'EU_PASSPORT' });

  const skipped = new Set(
    (originCode && country.originExceptions?.[originCode.toUpperCase()]?.skipRequirementIds) ?? [],
  );

  const checks: Check[] = [];
  const satisfied = new Set<string>();
  const used = new Map<string, RecordLike>();

  for (const requirement of country.requirements) {
    if (skipped.has(requirement.id)) continue;
    const record = latestRecord(records, requirement.type);
    if (record) used.set(requirement.id, record);
    const check = evaluateRequirement(requirement, records, dog, travelDay, satisfied, used);
    if (check.status === 'OK') satisfied.add(requirement.id);
    checks.push(check);
  }

  const mandatory = checks.filter((c) => c.mandatory);
  const okCount = mandatory.filter((c) => c.status === 'OK').length;
  const totalUnits = mandatory.length + blockers.length;
  const score = totalUnits === 0 ? 100 : Math.round((okCount / totalUnits) * 100);

  return {
    country,
    compliant: blockers.length === 0 && okCount === mandatory.length,
    score,
    checks,
    blockers,
    remainingSteps: mandatory.length - okCount + blockers.length,
  };
}

export interface ExpiryAlert {
  recordId?: string;
  type: VetRecordType;
  expiryDay: number;
  daysLeft: number;
  /** Le palier franchi : 90, 30 ou 7. */
  threshold: number;
}

/**
 * Documents qui arrivent à échéance, regroupés par palier d'alerte.
 * Un document déjà périmé remonte avec `daysLeft` négatif et le palier 0.
 */
export function expiryAlerts(
  records: readonly RecordLike[],
  referenceDate: DateInput = todayUtc(),
): ExpiryAlert[] {
  const ref = toEpochDay(referenceDate);
  const alerts: ExpiryAlert[] = [];

  for (const record of records) {
    const expiryDay = effectiveExpiry(record);
    if (expiryDay == null) continue;

    const daysLeft = expiryDay - ref;
    if (daysLeft < 0) {
      alerts.push({ recordId: record.id, type: record.type, expiryDay, daysLeft, threshold: 0 });
      continue;
    }

    const threshold = EXPIRY_ALERT_DAYS.filter((d) => daysLeft <= d).pop();
    if (threshold != null) {
      alerts.push({ recordId: record.id, type: record.type, expiryDay, daysLeft, threshold });
    }
  }

  return alerts.sort((a, b) => a.daysLeft - b.daysLeft);
}

/** Date à laquelle le voyage devient possible, si elle existe sous un an. */
export function earliestTravelDate(
  dog: DogLike,
  records: readonly RecordLike[],
  destinationCode: string,
  from: DateInput = todayUtc(),
): Date | null {
  for (let offset = 0; offset <= 365; offset++) {
    const day = addDays(from, offset);
    const assessment = assessTravel(dog, records, destinationCode, day);
    if (assessment?.compliant) return day;
  }
  return null;
}
