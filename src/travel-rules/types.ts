import type { Locale } from '@/i18n/config';

export type VetRecordType =
  | 'RABIES_VACCINE'
  | 'CHPPI_VACCINE'
  | 'LEPTOSPIROSIS_VACCINE'
  | 'BORDETELLA_VACCINE'
  | 'DEWORMING'
  | 'ANTIPARASITIC'
  | 'RABIES_TITER'
  | 'HEALTH_CERTIFICATE'
  | 'IMPORT_PERMIT'
  | 'OTHER';

/** Texte bilingue. Les fiches pays ne passent pas par les dictionnaires : leurs
 *  libellés sont propres au pays et vivent avec la règle. */
export type Text = Record<Locale, string>;

export interface Requirement {
  /** Stable : sert de clé de résultat et de test. */
  id: string;
  type: VetRecordType;
  label: Text;
  /** Obligatoire, ou simplement recommandé. */
  mandatory: boolean;
  /** Durée de validité du document, à défaut de date d'expiration saisie. */
  validityDays?: number;
  /** Doit avoir été réalisé au moins N jours avant le départ (délai de carence). */
  minDaysBeforeTravel?: number;
  /** Ne doit pas dater de plus de N jours au départ (certificat sanitaire…). */
  maxDaysBeforeTravel?: number;
  /** Exige qu'un autre requirement soit satisfait, et postérieur. */
  requiresAfter?: string;
  /** Âge minimum de l'animal au jour du document. */
  minAgeDaysAtRecord?: number;
  detail?: Text;
}

export interface CountryRules {
  /** ISO 3166-1 alpha-2. */
  code: string;
  name: Text;
  flag: string;
  /** Âge minimum à l'entrée. */
  minAgeDays?: number;
  /** Races interdites à l'importation, en minuscules sans accent. */
  bannedBreeds?: string[];
  /** Puce électronique obligatoire. */
  microchipRequired?: boolean;
  /** Passeport européen obligatoire. */
  euPassportRequired?: boolean;
  requirements: Requirement[];
  /** Règles spécifiques quand on arrive de certains pays. */
  originExceptions?: Record<string, { skipRequirementIds?: string[]; detail?: Text }>;
  sources?: string[];
}
