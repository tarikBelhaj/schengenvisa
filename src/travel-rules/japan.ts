import type { CountryRules } from './types';

// Japon — la notification préalable de 40 jours est le point bloquant.
export const japan: CountryRules = {
  code: 'JP',
  name: { fr: 'Japon', en: 'Japan' },
  flag: '🇯🇵',
  minAgeDays: 270,
  microchipRequired: true,
  requirements: [
    {
      id: 'rabies',
      type: 'RABIES_VACCINE',
      label: { fr: 'Vaccination antirabique (2 injections)', en: 'Rabies vaccination (2 shots)' },
      mandatory: true,
      validityDays: 365,
      minDaysBeforeTravel: 180,
      minAgeDaysAtRecord: 91,
      detail: {
        fr: 'Deux injections espacées d’au moins 30 jours, après la pose de la puce.',
        en: 'Two shots at least 30 days apart, after microchipping.',
      },
    },
    {
      id: 'titer',
      type: 'RABIES_TITER',
      label: { fr: 'Titrage antirabique', en: 'Rabies titer test' },
      mandatory: true,
      validityDays: 730,
      minDaysBeforeTravel: 180,
      requiresAfter: 'rabies',
      detail: {
        fr: 'Attente obligatoire de 180 jours entre la prise de sang et l’arrivée.',
        en: 'Mandatory 180-day wait between blood sampling and arrival.',
      },
    },
    {
      id: 'advance-notice',
      type: 'IMPORT_PERMIT',
      label: { fr: 'Notification préalable', en: 'Advance notification' },
      mandatory: true,
      minDaysBeforeTravel: 40,
      detail: {
        fr: 'À déposer auprès de la Animal Quarantine Service au moins 40 jours avant l’arrivée.',
        en: 'Filed with the Animal Quarantine Service at least 40 days before arrival.',
      },
    },
    {
      id: 'health-certificate',
      type: 'HEALTH_CERTIFICATE',
      label: { fr: 'Certificat sanitaire officiel', en: 'Official health certificate' },
      mandatory: true,
      maxDaysBeforeTravel: 10,
    },
  ],
  sources: ['https://www.maff.go.jp/aqs'],
};
