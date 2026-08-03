import type { CountryRules } from './types';

// France — entrée d'un chien, règlement UE 576/2013.
export const france: CountryRules = {
  code: 'FR',
  name: { fr: 'France', en: 'France' },
  flag: '🇫🇷',
  minAgeDays: 105,
  microchipRequired: true,
  euPassportRequired: true,
  bannedBreeds: ['pit bull', 'boerboel', 'tosa'],
  requirements: [
    {
      id: 'rabies',
      type: 'RABIES_VACCINE',
      label: { fr: 'Vaccination antirabique', en: 'Rabies vaccination' },
      mandatory: true,
      validityDays: 365,
      minDaysBeforeTravel: 21,
      minAgeDaysAtRecord: 84,
      detail: {
        fr: 'Valable 21 jours après la primo-vaccination. L’animal doit avoir 12 semaines révolues.',
        en: 'Valid 21 days after the first shot. The dog must be at least 12 weeks old.',
      },
    },
    {
      id: 'eu-passport',
      type: 'OTHER',
      label: { fr: 'Passeport européen pour animal', en: 'EU pet passport' },
      mandatory: true,
      detail: {
        fr: 'Délivré par un vétérinaire habilité, il porte le numéro de puce.',
        en: 'Issued by an authorised vet, it carries the microchip number.',
      },
    },
    {
      id: 'echinococcus',
      type: 'DEWORMING',
      label: { fr: 'Traitement contre Echinococcus', en: 'Echinococcus treatment' },
      mandatory: false,
      maxDaysBeforeTravel: 5,
      minDaysBeforeTravel: 1,
      detail: {
        fr: 'Exigé uniquement en provenance de certains pays. Entre 24 et 120 heures avant l’entrée.',
        en: 'Required only from certain countries. Between 24 and 120 hours before entry.',
      },
    },
  ],
  sources: ['https://agriculture.gouv.fr'],
};
