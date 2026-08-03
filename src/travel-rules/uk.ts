import type { CountryRules } from './types';

// Royaume-Uni — règles post-Brexit. Le traitement contre le ténia est le point
// que les voyageurs oublient le plus souvent : sa fenêtre est étroite.
export const uk: CountryRules = {
  code: 'GB',
  name: { fr: 'Royaume-Uni', en: 'United Kingdom' },
  flag: '🇬🇧',
  minAgeDays: 105,
  microchipRequired: true,
  bannedBreeds: ['pit bull terrier', 'tosa', 'dogo argentino', 'fila brasileiro', 'xl bully'],
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
        fr: 'La puce doit être posée avant l’injection, sinon la vaccination est invalide.',
        en: 'The microchip must be implanted before the shot, otherwise the vaccination is void.',
      },
    },
    {
      id: 'ahc',
      type: 'HEALTH_CERTIFICATE',
      label: { fr: 'Animal Health Certificate', en: 'Animal Health Certificate' },
      mandatory: true,
      maxDaysBeforeTravel: 10,
      detail: {
        fr: 'Délivré par un vétérinaire officiel dans les 10 jours précédant l’entrée. Valable 4 mois pour les déplacements internes.',
        en: 'Issued by an official vet within 10 days before entry. Valid 4 months for onward travel.',
      },
    },
    {
      id: 'tapeworm',
      type: 'DEWORMING',
      label: { fr: 'Traitement contre le ténia (Echinococcus)', en: 'Tapeworm treatment (Echinococcus)' },
      mandatory: true,
      minDaysBeforeTravel: 1,
      maxDaysBeforeTravel: 5,
      detail: {
        fr: 'Entre 24 et 120 heures avant l’arrivée, praziquantel, consigné par le vétérinaire.',
        en: 'Between 24 and 120 hours before arrival, praziquantel, recorded by the vet.',
      },
    },
  ],
  sources: ['https://www.gov.uk/bring-pet-to-great-britain'],
};
