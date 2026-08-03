import { prisma } from './prisma';
import { toIsoDate } from './dates';
import type { TripStatus } from './schengen';

// Dates en "YYYY-MM-DD" et non en Date : sérialisable, et pas de fuseau.
export interface TripDTO {
  id: string;
  entryDate: string;
  exitDate: string | null;
  status: TripStatus;
  country: string | null;
  note: string | null;
}

export interface PersonDTO {
  id: string;
  name: string;
  nationality: string | null;
  notes: string | null;
  photo: string | null;
  trips: TripDTO[];
}

const tripSelect = {
  id: true,
  entryDate: true,
  exitDate: true,
  status: true,
  country: true,
  note: true,
} as const;

type TripRow = {
  id: string;
  entryDate: Date;
  exitDate: Date | null;
  status: TripStatus;
  country: string | null;
  note: string | null;
};

function toTripDTO(trip: TripRow): TripDTO {
  return {
    id: trip.id,
    entryDate: toIsoDate(trip.entryDate),
    exitDate: trip.exitDate ? toIsoDate(trip.exitDate) : null,
    status: trip.status,
    country: trip.country,
    note: trip.note,
  };
}

/** Toutes les personnes suivies par cet utilisateur. */
export async function listPersons(userId: string): Promise<PersonDTO[]> {
  const persons = await prisma.person.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      nationality: true,
      notes: true,
      photo: true,
      trips: { select: tripSelect, orderBy: { entryDate: 'asc' } },
    },
  });

  return persons.map((p) => ({ ...p, trips: p.trips.map(toTripDTO) }));
}

/**
 * Une personne, à condition qu'elle appartienne à cet utilisateur.
 * Le `userId` fait partie du where : un id deviné ne donne rien.
 */
export async function getPerson(userId: string, personId: string): Promise<PersonDTO | null> {
  const person = await prisma.person.findFirst({
    where: { id: personId, userId },
    select: {
      id: true,
      name: true,
      nationality: true,
      notes: true,
      photo: true,
      trips: { select: tripSelect, orderBy: { entryDate: 'asc' } },
    },
  });

  if (!person) return null;
  return { ...person, trips: person.trips.map(toTripDTO) };
}
