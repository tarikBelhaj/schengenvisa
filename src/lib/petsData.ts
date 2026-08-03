import { toIsoDate } from './dates';
import { prisma } from './prisma';
import type { VetRecordType } from '@/travel-rules/types';

export type DogSex = 'MALE' | 'FEMALE';

// Dates en "YYYY-MM-DD" et non en Date : sérialisable, et pas de fuseau.
export interface VetRecordDTO {
  id: string;
  type: VetRecordType;
  date: string;
  expiresAt: string | null;
  note: string | null;
  label: string | null;
  fileName: string | null;
  fileType: string | null;
  /** Présence seule : le contenu n'est chargé que sur demande. */
  hasFile: boolean;
}

export interface DogDTO {
  id: string;
  name: string;
  breed: string | null;
  sex: DogSex | null;
  birthDate: string | null;
  microchip: string | null;
  photo: string | null;
  countryCode: string | null;
  euPassport: string | null;
  weightKg: number | null;
  color: string | null;
  records: VetRecordDTO[];
}

// fileData est volontairement absent : une liste de chiens tirerait sinon
// plusieurs Mo de pièces jointes inutiles.
const recordSelect = {
  id: true,
  type: true,
  date: true,
  expiresAt: true,
  note: true,
  label: true,
  fileName: true,
  fileType: true,
} as const;

const dogSelect = {
  id: true,
  name: true,
  breed: true,
  sex: true,
  birthDate: true,
  microchip: true,
  photo: true,
  countryCode: true,
  euPassport: true,
  weightKg: true,
  color: true,
} as const;

type RecordRow = {
  id: string;
  type: VetRecordType;
  date: Date;
  expiresAt: Date | null;
  note: string | null;
  label: string | null;
  fileName: string | null;
  fileType: string | null;
};

function toRecordDTO(row: RecordRow): VetRecordDTO {
  return {
    id: row.id,
    type: row.type,
    date: toIsoDate(row.date),
    expiresAt: row.expiresAt ? toIsoDate(row.expiresAt) : null,
    note: row.note,
    label: row.label,
    fileName: row.fileName,
    fileType: row.fileType,
    hasFile: row.fileName !== null,
  };
}

type DogRow = {
  id: string;
  name: string;
  breed: string | null;
  sex: DogSex | null;
  birthDate: Date | null;
  microchip: string | null;
  photo: string | null;
  countryCode: string | null;
  euPassport: string | null;
  weightKg: number | null;
  color: string | null;
  records: RecordRow[];
};

function toDogDTO(row: DogRow): DogDTO {
  return {
    ...row,
    birthDate: row.birthDate ? toIsoDate(row.birthDate) : null,
    records: row.records.map(toRecordDTO),
  };
}

export async function listDogs(userId: string): Promise<DogDTO[]> {
  const dogs = await prisma.dog.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
    select: { ...dogSelect, records: { select: recordSelect, orderBy: { date: 'desc' } } },
  });

  return dogs.map(toDogDTO);
}

/** Le userId dans le where : un identifiant deviné ne renvoie rien. */
export async function getDog(userId: string, dogId: string): Promise<DogDTO | null> {
  const dog = await prisma.dog.findFirst({
    where: { id: dogId, userId },
    select: { ...dogSelect, records: { select: recordSelect, orderBy: { date: 'desc' } } },
  });

  if (!dog) return null;
  return toDogDTO(dog);
}

/** Contenu d'une pièce jointe, à condition qu'elle appartienne à l'utilisateur. */
export async function getAttachment(
  userId: string,
  recordId: string,
): Promise<{ fileName: string; fileType: string; fileData: string } | null> {
  const record = await prisma.vetRecord.findFirst({
    where: { id: recordId, dog: { userId } },
    select: { fileName: true, fileType: true, fileData: true },
  });

  if (!record?.fileData || !record.fileName || !record.fileType) return null;
  return { fileName: record.fileName, fileType: record.fileType, fileData: record.fileData };
}
