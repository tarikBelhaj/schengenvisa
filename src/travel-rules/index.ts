import { france } from './france';
import { japan } from './japan';
import { oman } from './oman';
import type { CountryRules } from './types';
import { usa } from './usa';

// Registre des pays. Ajouter un pays = créer son fichier et l'inscrire ici.
export const COUNTRIES: Record<string, CountryRules> = {
  FR: france,
  OM: oman,
  US: usa,
  JP: japan,
};

export const COUNTRY_CODES = Object.keys(COUNTRIES);

export function getCountry(code: string): CountryRules | null {
  return COUNTRIES[code.toUpperCase()] ?? null;
}

export type { CountryRules, Requirement, VetRecordType } from './types';
