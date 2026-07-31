/**
 * Jeu de démonstration : un utilisateur, deux personnes, des séjours passés et
 * planifiés — dont un qui provoque volontairement un dépassement, pour voir
 * l'alerte et le drapeau rouge fonctionner.
 *
 * Les dates sont relatives à aujourd'hui : le seed reste parlant quelle que
 * soit la date à laquelle on le lance.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MS_PER_DAY = 86_400_000;
const TODAY = Math.floor(Date.now() / MS_PER_DAY);

/** Date à minuit UTC, décalée de `offset` jours par rapport à aujourd'hui. */
function day(offset: number): Date {
  return new Date((TODAY + offset) * MS_PER_DAY);
}

async function main() {
  const email = process.env.SEED_USER_EMAIL;
  if (!email) {
    throw new Error(
      'SEED_USER_EMAIL manquant. Renseignez votre adresse Google dans .env : ' +
        'le compte créé ici sera rattaché à votre première connexion.',
    );
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: 'Compte de démonstration' },
  });

  // Idempotent : on repart d'une base propre pour cet utilisateur.
  await prisma.person.deleteMany({ where: { userId: user.id } });

  await prisma.person.create({
    data: {
      userId: user.id,
      name: 'Yasmine Haddad',
      nationality: 'Tunisienne',
      notes: 'Visa de circulation, séjours familiaux.',
      trips: {
        create: [
          {
            entryDate: day(-200),
            exitDate: day(-170),
            status: 'PAST',
            country: 'France',
            note: 'Sorti de la fenêtre de 180 jours',
          },
          {
            entryDate: day(-60),
            exitDate: day(-40),
            status: 'PAST',
            country: 'Espagne',
          },
          {
            entryDate: day(20),
            exitDate: day(50),
            status: 'PLANNED',
            country: 'France',
            note: 'Séjour prévu, tient dans le quota',
          },
        ],
      },
    },
  });

  await prisma.person.create({
    data: {
      userId: user.id,
      name: 'Karim Belhadj',
      nationality: 'Marocaine',
      notes: 'Dossier à surveiller — le séjour prévu dépasse le quota.',
      trips: {
        create: [
          {
            entryDate: day(-120),
            exitDate: day(-60),
            status: 'PAST',
            country: 'France',
            note: '61 jours, encore dans la fenêtre',
          },
          {
            entryDate: day(10),
            exitDate: day(55),
            status: 'PLANNED',
            country: 'Italie',
            note: 'Provoque un dépassement en cours de séjour',
          },
        ],
      },
    },
  });

  console.log(`Seed OK — 2 personnes créées pour ${email}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
