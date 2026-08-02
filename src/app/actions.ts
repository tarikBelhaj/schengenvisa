'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { isLocale, LOCALE_COOKIE, LOCALE_MAX_AGE } from '@/i18n/config';
import { getDict } from '@/i18n/server';
import { requireUserId } from '@/lib/auth';
import { toUtcDate } from '@/lib/dates';
import { prisma } from '@/lib/prisma';

export interface ActionState {
  error?: string;
}

/** Change la langue. Le cookie est lu par chaque page côté serveur. */
export async function setLocale(formData: FormData): Promise<void> {
  const value = formData.get('locale');
  if (!isLocale(value)) return;

  cookies().set(LOCALE_COOKIE, value, {
    maxAge: LOCALE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
  });
  // Toutes les pages rendent du texte traduit : on invalide l'arbre entier.
  revalidatePath('/', 'layout');
}

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date attendue au format AAAA-MM-JJ');
const optionalText = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => (v ? v : null));

// Les schémas sont construits par appel : leurs messages dépendent de la langue
// courante, qui n'est connue qu'au moment de la requête.
type Errors = ReturnType<typeof getDict>['errors'];

function personSchema(e: Errors) {
  return z.object({
    id: z.string().optional(),
    name: z.string().trim().min(1, e.nameRequired).max(120),
    nationality: optionalText,
    notes: optionalText,
  });
}

function tripSchema(e: Errors) {
  return z
    .object({
      id: z.string().optional(),
      personId: z.string().min(1),
      entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, e.dateFormat),
      exitDate: z.union([isoDate, z.literal('')]).optional(),
      status: z.enum(['PAST', 'PLANNED']),
      country: optionalText,
      note: optionalText,
    })
    .refine((v) => !v.exitDate || v.exitDate >= v.entryDate, {
      message: e.exitBeforeEntry,
      path: ['exitDate'],
    });
}

/** Le userId de la session, ou une redirection : aucune action sans session. */
async function currentUserId(): Promise<string> {
  const userId = await requireUserId();
  if (!userId) redirect('/login');
  return userId;
}

/** Vérifie que la personne appartient bien à l'utilisateur connecté. */
async function assertOwnsPerson(userId: string, personId: string): Promise<void> {
  const found = await prisma.person.findFirst({ where: { id: personId, userId }, select: { id: true } });
  if (!found) throw new Error(getDict().errors.personNotFound);
}

function firstError(error: z.ZodError, e: Errors): string {
  return error.issues[0]?.message ?? e.invalid;
}

// ---------------------------------------------------------------------------
// Personnes
// ---------------------------------------------------------------------------

export async function savePerson(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await currentUserId();

  const e = getDict().errors;
  const parsed = personSchema(e).safeParse({
    id: formData.get('id') || undefined,
    name: formData.get('name') ?? '',
    nationality: formData.get('nationality') ?? '',
    notes: formData.get('notes') ?? '',
  });
  if (!parsed.success) return { error: firstError(parsed.error, e) };

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

  const e = getDict().errors;
  const parsed = tripSchema(e).safeParse({
    id: formData.get('id') || undefined,
    personId: formData.get('personId') ?? '',
    entryDate: formData.get('entryDate') ?? '',
    exitDate: formData.get('exitDate') ?? '',
    status: formData.get('status') ?? 'PAST',
    country: formData.get('country') ?? '',
    note: formData.get('note') ?? '',
  });
  if (!parsed.success) return { error: firstError(parsed.error, e) };

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
    if (updated.count === 0) return { error: e.tripNotFound };
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
