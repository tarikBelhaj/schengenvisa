import type { CountryRules } from './types';

// Oman — import d'un chien de compagnie depuis l'Union européenne.
// Le permis d'importation du ministère de l'Agriculture conditionne tout le reste.
export const oman: CountryRules = {
  code: 'OM',
  name: { fr: 'Oman', en: 'Oman' },
  flag: '🇴🇲',
  minAgeDays: 120,
  microchipRequired: true,
  bannedBreeds: [
    'pit bull',
    'american staffordshire terrier',
    'staffordshire bull terrier',
    'tosa',
    'dogo argentino',
    'fila brasileiro',
    'boerboel',
  ],
  requirements: [
    {
      id: 'rabies',
      type: 'RABIES_VACCINE',
      label: { fr: 'Vaccination antirabique', en: 'Rabies vaccination' },
      mandatory: true,
      validityDays: 365,
      minDaysBeforeTravel: 30,
      minAgeDaysAtRecord: 90,
      detail: {
        fr: 'Au moins 30 jours avant le départ, et l’animal doit avoir 3 mois révolus lors de l’injection.',
        en: 'At least 30 days before departure, and the dog must be over 3 months old at injection.',
      },
    },
    {
      id: 'titer',
      type: 'RABIES_TITER',
      label: { fr: 'Titrage antirabique (RNATT/FAVN)', en: 'Rabies titer test (RNATT/FAVN)' },
      mandatory: true,
      validityDays: 365,
      minDaysBeforeTravel: 21,
      requiresAfter: 'rabies',
      detail: {
        fr: 'Prise de sang postérieure à la vaccination, réalisée dans un laboratoire agréé. Résultat ≥ 0,5 UI/ml.',
        en: 'Blood sample taken after vaccination, in an approved laboratory. Result ≥ 0.5 IU/ml.',
      },
    },
    {
      id: 'import-permit',
      type: 'IMPORT_PERMIT',
      label: { fr: 'Permis d’importation omanais', en: 'Omani import permit' },
      mandatory: true,
      validityDays: 30,
      detail: {
        fr: 'À demander au ministère de l’Agriculture, de la Pêche et des Ressources en eau avant le départ.',
        en: 'Request from the Ministry of Agriculture, Fisheries and Water Resources before departure.',
      },
    },
    {
      id: 'health-certificate',
      type: 'HEALTH_CERTIFICATE',
      label: { fr: 'Certificat sanitaire officiel', en: 'Official health certificate' },
      mandatory: true,
      maxDaysBeforeTravel: 10,
      detail: {
        fr: 'Délivré par un vétérinaire officiel dans les 10 jours précédant le vol.',
        en: 'Issued by an official veterinarian within 10 days before the flight.',
      },
    },
    {
      id: 'deworming',
      type: 'DEWORMING',
      label: { fr: 'Vermifuge', en: 'Deworming' },
      mandatory: true,
      maxDaysBeforeTravel: 14,
      detail: {
        fr: 'Traitement interne et externe dans les 14 jours précédant le départ.',
        en: 'Internal and external treatment within 14 days before departure.',
      },
    },
    {
      id: 'chppi',
      type: 'CHPPI_VACCINE',
      label: { fr: 'Vaccin CHPPI', en: 'CHPPI vaccine' },
      mandatory: false,
      validityDays: 365,
      detail: {
        fr: 'Non exigé à l’entrée mais réclamé par la plupart des compagnies aériennes.',
        en: 'Not required at entry but requested by most airlines.',
      },
    },
  ],
  sources: ['https://www.maf.gov.om'],
};
