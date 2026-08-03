import type { Dict } from '@/i18n/dictionaries';
import type { VetRecordType } from '@/travel-rules/types';

// Volontairement hors de tout module 'use client' : les composants serveur
// l'appellent pendant le rendu, ce qui est impossible avec un export client.
export const VET_RECORD_TYPES: VetRecordType[] = [
  'RABIES_VACCINE',
  'RABIES_TITER',
  'CHPPI_VACCINE',
  'LEPTOSPIROSIS_VACCINE',
  'BORDETELLA_VACCINE',
  'DEWORMING',
  'ANTIPARASITIC',
  'HEALTH_CERTIFICATE',
  'IMPORT_PERMIT',
  'OTHER',
];

export function typeLabel(dict: Dict, type: VetRecordType): string {
  return dict.pets[`type${type}` as keyof Dict['pets']] ?? type;
}
