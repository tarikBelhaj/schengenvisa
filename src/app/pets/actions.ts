'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { getDict } from '@/i18n/server';
import { requireUserId } from '@/lib/auth';
import { toUtcDate } from '@/lib/dates';
import { prisma } from '@/lib/prisma';
import { COUNTRY_CODES } from '@/travel-rules';

export interface ActionState {
  error?: string;
}

// ~700 Ko : les server actions plafonnent le corps de requête à 1 Mo.
// Non exporté : un fichier "use server" ne peut exporter que des fonctions async.
const MAX_ATTACHMENT_CHARS = 700_000;

const RECORD_TYPES = [
  'RABIES_VACCINE',
  'CHPPI_VACCINE',
  'LEPTOSPIROSIS_VACCINE',
  'BORDETELLA_VACCINE',
  'DEWORMING',
  'ANTIPARASITIC',
  'RABIES_TITER',
  'HEALTH_CERTIFICATE',
  'IMPORT_PERMIT',
  'OTHER',
] as const;

type Errors = ReturnType<typeof getDict>['errors'];

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

const optionalText = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => (v ? v : null));

const optionalDate = z
  .union([z.string().regex(isoDate), z.literal('')])
  .optional()
  .transform((v) => (v ? v : null));

function dogSchema(e: Errors) {
  return z.object({
    id: z.string().optional(),
    name: z.string().trim().min(1, e.nameRequired).max(120),
    breed: optionalText,
    sex: z
      .union([z.enum(['MALE', 'FEMALE']), z.literal('')])
      .optional()
      .transform((v) => (v ? v : null)),
    birthDate: optionalDate,
    microchip: optionalText,
    countryCode: z
      .string()
      .optional()
      .transform((v) => (v && COUNTRY_CODES.includes(v) ? v : null)),
    euPassport: optionalText,
    weightKg: z
      .union([z.string(), z.literal('')])
      .optional()
      .transform((v) => {
        if (!v) return null;
        const n = Number(v.replace(',', '.'));
        return Number.isFinite(n) && n > 0 && n < 200 ? n : null;
      }),
    color: optionalText,
    photo: z
      .string()
      .max(MAX_ATTACHMENT_CHARS, e.fileTooLarge)
      .refine((v) => v === '' || v.startsWith('data:image/'), e.invalid)
      .optional()
      .transform((v) => (v ? v : null)),
  });
}

function recordSchema(e: Errors) {
  return z
    .object({
      id: z.string().optional(),
      dogId: z.string().min(1),
      type: z.enum(RECORD_TYPES),
      date: z.string().regex(isoDate, e.dateFormat),
      expiresAt: optionalDate,
      label: optionalText,
      note: optionalText,
      fileName: optionalText,
      fileType: optionalText,
      fileData: z
        .string()
        .max(MAX_ATTACHMENT_CHARS, e.fileTooLarge)
        .optional()
        .transform((v) => (v ? v : null)),
    })
    .refine((v) => !v.expiresAt || v.expiresAt >= v.date, {
      message: e.expiryBeforeDate,
      path: ['expiresAt'],
    });
}

async function currentUserId(): Promise<string> {
  const userId = await requireUserId();
  if (!userId) redirect('/login');
  return userId;
}

async function assertOwnsDog(userId: string, dogId: string): Promise<void> {
  const found = await prisma.dog.findFirst({ where: { id: dogId, userId }, select: { id: true } });
  if (!found) throw new Error(getDict().errors.dogNotFound);
}

function firstError(error: z.ZodError, e: Errors): string {
  return error.issues[0]?.message ?? e.invalid;
}

export async function saveDog(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await currentUserId();
  const e = getDict().errors;

  const parsed = dogSchema(e).safeParse({
    id: formData.get('id') || undefined,
    name: formData.get('name') ?? '',
    breed: formData.get('breed') ?? '',
    sex: formData.get('sex') ?? '',
    birthDate: formData.get('birthDate') ?? '',
    microchip: formData.get('microchip') ?? '',
    countryCode: formData.get('countryCode') ?? '',
    euPassport: formData.get('euPassport') ?? '',
    weightKg: formData.get('weightKg') ?? '',
    color: formData.get('color') ?? '',
    photo: formData.get('photo') ?? '',
  });
  if (!parsed.success) return { error: firstError(parsed.error, e) };

  const { id, birthDate, ...rest } = parsed.data;
  const data = { ...rest, birthDate: birthDate ? toUtcDate(birthDate) : null };

  if (id) {
    await assertOwnsDog(userId, id);
    await prisma.dog.update({ where: { id }, data });
    revalidatePath(`/pets/${id}`);
  } else {
    await prisma.dog.create({ data: { ...data, userId } });
  }

  revalidatePath('/pets');
  return {};
}

export async function deleteDog(formData: FormData): Promise<void> {
  const userId = await currentUserId();
  const id = String(formData.get('id') ?? '');
  await assertOwnsDog(userId, id);

  // Cascade Prisma : les documents partent avec.
  await prisma.dog.delete({ where: { id } });
  revalidatePath('/pets');
  redirect('/pets');
}

export async function saveRecord(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await currentUserId();
  const e = getDict().errors;

  const parsed = recordSchema(e).safeParse({
    id: formData.get('id') || undefined,
    dogId: formData.get('dogId') ?? '',
    type: formData.get('type') ?? 'OTHER',
    date: formData.get('date') ?? '',
    expiresAt: formData.get('expiresAt') ?? '',
    label: formData.get('label') ?? '',
    note: formData.get('note') ?? '',
    fileName: formData.get('fileName') ?? '',
    fileType: formData.get('fileType') ?? '',
    fileData: formData.get('fileData') ?? '',
  });
  if (!parsed.success) return { error: firstError(parsed.error, e) };

  const { id, dogId, date, expiresAt, fileData, fileName, fileType, ...rest } = parsed.data;
  await assertOwnsDog(userId, dogId);

  const base = {
    ...rest,
    date: toUtcDate(date),
    expiresAt: expiresAt ? toUtcDate(expiresAt) : null,
  };

  if (id) {
    // Sans nouveau fichier, on conserve celui déjà stocké.
    const attachment = fileData ? { fileData, fileName, fileType } : {};
    const updated = await prisma.vetRecord.updateMany({
      where: { id, dogId },
      data: { ...base, ...attachment },
    });
    if (updated.count === 0) return { error: e.recordNotFound };
  } else {
    await prisma.vetRecord.create({
      data: { ...base, dogId, fileData, fileName, fileType },
    });
  }

  revalidatePath(`/pets/${dogId}`);
  revalidatePath('/pets');
  return {};
}

export async function deleteRecord(formData: FormData): Promise<void> {
  const userId = await currentUserId();
  const id = String(formData.get('id') ?? '');
  const dogId = String(formData.get('dogId') ?? '');
  await assertOwnsDog(userId, dogId);

  await prisma.vetRecord.deleteMany({ where: { id, dogId } });
  revalidatePath(`/pets/${dogId}`);
  revalidatePath('/pets');
}
