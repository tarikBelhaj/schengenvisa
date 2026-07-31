'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { requireUserId } from '@/lib/auth';
import { toUtcDate } from '@/lib/dates';
import { prisma } from '@/lib/prisma';

export interface ActionState {
  error?: string;
}

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date attendue au format AAAA-MM-JJ');
const optionalText = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => (v ? v : null));

const personSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, 'Le nom est obligatoire').max(120),
  nationality: optionalText,
  notes: optionalText,
});

const tripSchema = z
  .object({
    id: z.string().optional(),
    personId: z.string().min(1),
    entryDate: isoDate,
    exitDate: z.union([isoDate, z.literal('')]).optional(),
    status: z.enum(['PAST', 'PLANNED']),
    country: optionalText,
    note: optionalText,
  })
  .refine((v) => !v.exitDate || v.exitDate >= v.entryDate, {
    message: 'La date de sortie doit suivre la date d\'entrée',
    path: ['exitDate'],
  });

/** Le userId de la session, ou une redirection : aucune action sans session. */
async function currentUserId(): Promise<string> {
  const userId = await requireUserId();
  if (!userId) redirect('/login');
  return userId;
}

/** Vérifie que la personne appartient bien à l'utilisateur connecté. */
async function assertOwnsPerson(userId: string, personId: string): Promise<void> {
  const found = await prisma.person.findFirst({ where: { id: personId, userId }, select: { id: true } });
  if (!found) throw new Error('Personne introuvable');
}

function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Données invalides';
}

// ---------------------------------------------------------------------------
// Personnes
// ---------------------------------------------------------------------------

export async function savePerson(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await currentUserId();

  const parsed = personSchema.safeParse({
    id: formData.get('id') || undefined,
    name: formData.get('name') ?? '',
    nationality: formData.get('nationality') ?? '',
    notes: formData.get('notes') ?? '',
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const { id, ...data } = parsed.data;

  if (id) {
    await assertOwnsPerson(userId, id);
    await prisma.person.update({ where: { id }, data });
    revalidatePath(`/person/${id}`);
  } else {
    await prisma.person.create({ data: { ...data, userId } });
  }

  revalidatePath('/dashboard');
  return {};
}

export async function deletePerson(formData: FormData): Promise<void> {
  const userId = await currentUserId();
  const id = String(formData.get('id') ?? '');
  await assertOwnsPerson(userId, id);

  // onDelete: Cascade côté Prisma supprime les séjours associés.
  await prisma.person.delete({ where: { id } });
  revalidatePath('/dashboard');
  redirect('/dashboard');
}

// ---------------------------------------------------------------------------
// Séjours
// ---------------------------------------------------------------------------

export async function saveTrip(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await currentUserId();

  const parsed = tripSchema.safeParse({
    id: formData.get('id') || undefined,
    personId: formData.get('personId') ?? '',
    entryDate: formData.get('entryDate') ?? '',
    exitDate: formData.get('exitDate') ?? '',
    status: formData.get('status') ?? 'PAST',
    country: formData.get('country') ?? '',
    note: formData.get('note') ?? '',
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const { id, personId, entryDate, exitDate, ...rest } = parsed.data;
  await assertOwnsPerson(userId, personId);

  const data = {
    ...rest,
    entryDate: toUtcDate(entryDate),
    // Champ vide = séjour en cours, sortie inconnue.
    exitDate: exitDate ? toUtcDate(exitDate) : null,
  };

  if (id) {
    // Le personId du where garantit qu'on n'édite pas le séjour d'un autre.
    const updated = await prisma.trip.updateMany({ where: { id, personId }, data });
    if (updated.count === 0) return { error: 'Séjour introuvable' };
  } else {
    await prisma.trip.create({ data: { ...data, personId } });
  }

  revalidatePath(`/person/${personId}`);
  revalidatePath('/dashboard');
  return {};
}

export async function deleteTrip(formData: FormData): Promise<void> {
  const userId = await currentUserId();
  const id = String(formData.get('id') ?? '');
  const personId = String(formData.get('personId') ?? '');
  await assertOwnsPerson(userId, personId);

  await prisma.trip.deleteMany({ where: { id, personId } });
  revalidatePath(`/person/${personId}`);
  revalidatePath('/dashboard');
}
