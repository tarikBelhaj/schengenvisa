import type { CountryRules } from './types';

// États-Unis — règles CDC en vigueur depuis août 2024.
export const usa: CountryRules = {
  code: 'US',
  name: { fr: 'États-Unis', en: 'United States' },
  flag: '🇺🇸',
  minAgeDays: 180,
  microchipRequired: true,
  requirements: [
    {
      id: 'rabies',
      type: 'RABIES_VACCINE',
      label: { fr: 'Vaccination antirabique', en: 'Rabies vaccination' },
      mandatory: true,
      validityDays: 365,
      minDaysBeforeTravel: 28,
      minAgeDaysAtRecord: 84,
    },
    {
      id: 'cdc-form',
      type: 'IMPORT_PERMIT',
      label: { fr: 'Formulaire CDC Dog Import', en: 'CDC Dog Import Form' },
      mandatory: true,
      maxDaysBeforeTravel: 180,
      detail: {
        fr: 'Reçu à présenter à l’arrivée, obtenu en ligne auprès du CDC.',
        en: 'Receipt shown on arrival, obtained online from the CDC.',
      },
    },
    {
      id: 'health-certificate',
      type: 'HEALTH_CERTIFICATE',
      label: { fr: 'Certificat vétérinaire', en: 'Veterinary certificate' },
      mandatory: true,
      maxDaysBeforeTravel: 30,
    },
  ],
  sources: ['https://www.cdc.gov/importation'],
};
