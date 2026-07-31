# Schengen 90/180

Suivi de la règle Schengen des 90 jours sur 180, en **fenêtre glissante**, pour
soi et ses proches. Chaque compte Google ne voit que ses propres personnes et
séjours.

Next.js 14 (App Router) · TypeScript · Tailwind · Prisma · PostgreSQL · NextAuth (Google).

---

## La règle, et pourquoi le calcul naïf se trompe

Un ressortissant soumis à la règle ne peut pas passer plus de **90 jours** dans
l'espace Schengen sur **toute période de 180 jours consécutifs**. Ce n'est pas
un quota annuel ni un compteur qui se remet à zéro : la fenêtre glisse. Chaque
jour qui passe fait sortir un jour ancien par la gauche, ce qui **libère du
crédit**.

Conséquence concrète, et c'est tout l'intérêt de l'app : après 40 jours passés
en janvier–février, un calcul naïf annonce « il vous reste 50 jours ». En
réalité, une entrée le 1er juin permet de rester **90 jours pleins** — parce que
les 40 jours de janvier sortent de la fenêtre pendant le séjour. Ce cas est
couvert par un test (`src/lib/schengen.test.ts`).

Conventions retenues :

- fenêtre = `[referenceDate − 179, referenceDate]`, soit 180 jours bornes incluses ;
- un séjour compte **le jour d'entrée et le jour de sortie** ;
- les séjours **planifiés comptent comme les passés** ;
- `exitDate` vide = séjour en cours, borné à la date de référence ;
- deux séjours qui se chevauchent ne comptent leurs jours communs qu'une fois.

---

## Démarrage

### 1. Une base PostgreSQL

Un tier gratuit suffit largement pour une dizaine d'utilisateurs :

- **[Neon](https://neon.tech)** — `DATABASE_URL` = l'URL *poolée* (`-pooler` dans
  le nom d'hôte), `DIRECT_URL` = l'URL directe.
- **[Supabase](https://supabase.com)** — `DATABASE_URL` = port `6543` (pooler),
  `DIRECT_URL` = port `5432`.

Les migrations Prisma ne passent pas par le pooler : d'où les deux variables.

### 2. Identifiants Google OAuth

[console.cloud.google.com](https://console.cloud.google.com) → *API et services*
→ *Identifiants* → **ID client OAuth** (type « Application Web »).

URI de redirection autorisée :

```
http://localhost:3000/api/auth/callback/google            # en local
https://<votre-app>.vercel.app/api/auth/callback/google   # en production
```

### 3. Variables d'environnement

Copiez `.env.example` vers `.env` et remplissez-le :

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | Connexion applicative (poolée) |
| `DIRECT_URL` | Connexion directe, pour les migrations |
| `NEXTAUTH_URL` | `http://localhost:3000` en local, l'URL du déploiement en prod |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Identifiants OAuth |
| `ALLOWED_EMAILS` | *Optionnel.* Liste blanche `a@x.com,b@y.com`. Vide = tout compte Google |
| `SEED_USER_EMAIL` | Adresse Google du compte créé par le seed |

`ALLOWED_EMAILS` est la manière la plus simple de garder l'app privée : toute
adresse absente de la liste se voit refuser la connexion.

### 4. Installer, migrer, démarrer

```bash
npm install
npx prisma migrate dev     # applique prisma/migrations/0_init
npm run db:seed            # 2 personnes de démonstration (optionnel)
npm run dev                # http://localhost:3000
```

Sur une base **déjà créée** (Neon/Supabase en prod), utilisez plutôt :

```bash
npx prisma migrate deploy
```

---

## Scripts

| Commande | Effet |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` | `prisma generate` puis build de production |
| `npm test` | Tests Vitest du calcul 90/180 |
| `npm run test:watch` | Tests en continu |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | Jeu de démonstration |
| `npm run db:studio` | Explorateur de base Prisma |

---

## Le seed

`npm run db:seed` crée un `User` portant l'adresse `SEED_USER_EMAIL`, puis deux
personnes. À votre première connexion avec **ce même compte Google**, la session
se rattache à cet utilisateur et les données de démonstration apparaissent.

- **Yasmine Haddad** — un séjour sorti de la fenêtre, un séjour récent, un séjour
  planifié qui tient dans le quota.
- **Karim Belhadj** — 61 jours encore dans la fenêtre plus un séjour planifié de
  46 jours : **dépassement volontaire**, pour voir l'alerte et le drapeau rouge.

Le seed est idempotent : il supprime les personnes existantes de cet utilisateur
avant de recréer le jeu. Les dates sont relatives au jour où on le lance.

---

## Structure

```
prisma/
  schema.prisma            User · Person · Trip (+ tables NextAuth)
  migrations/0_init/       migration initiale
  seed.ts
src/
  lib/
    dates.ts               dates pures UTC (numéros de jour, zéro fuseau)
    schengen.ts            LE calcul — daysPresentInWindow, maxStayFromEntry…
    schengen.test.ts       37 tests
    auth.ts                NextAuth + liste blanche
    data.ts                requêtes cloisonnées par userId
    prisma.ts
  app/
    page.tsx               landing
    login/                 connexion Google
    dashboard/             liste des personnes + statuts
    person/[id]/           fiche : jauge, timeline, simulateur
    actions.ts             server actions (CRUD personnes et séjours)
  components/
    Gauge.tsx  Timeline.tsx  Simulator.tsx  TripForm.tsx  PersonForm.tsx
```

### L'API de calcul

```ts
daysPresentInWindow(trips, referenceDate)  // jours consommés dans la fenêtre
daysRemaining(trips, referenceDate)        // 90 − consommés (négatif = dépassement)
maxStayFromEntry(trips, entryDate)         // { maxExitDate, allowedDays, daysUsedAtEntry }
findFirstOverage(trips, referenceDate)     // premier jour de dépassement, ou null
nextPlannedTrip(trips, referenceDate)      // prochain séjour à venir
```

`maxStayFromEntry` répond à la question centrale — « si j'entre le 1er décembre,
jusqu'à quand puis-je rester ? ». Elle avance jour par jour depuis l'entrée et
**recalcule la fenêtre à chaque date**, en comptant les jours simulés plus tous
les séjours enregistrés. C'est ce recalcul pas à pas qui capte la libération de
crédit décrite plus haut.

Toutes ces fonctions sont pures : le simulateur les exécute dans le navigateur,
la réponse est instantanée.

---

## Cloisonnement des données

- Chaque `Person` porte un `userId`. Toute lecture le met dans le `where`
  (`src/lib/data.ts`) : un identifiant deviné ne renvoie rien.
- Chaque écriture passe par `assertOwnsPerson` avant de toucher la base, et les
  mises à jour de séjours filtrent sur `personId` (`src/app/actions.ts`).
- La liste blanche `ALLOWED_EMAILS` filtre en amont qui peut se connecter.

---

## Déploiement Vercel

1. Poussez le dépôt sur GitHub, puis importez-le sur Vercel.
2. Renseignez les variables d'environnement du tableau ci-dessus.
   `NEXTAUTH_URL` doit valoir l'URL de production.
3. Ajoutez l'URI de redirection de production dans la console Google.
4. Le build lance `prisma generate` (scripts `postinstall` et `build`).
5. Appliquez les migrations une fois : `npx prisma migrate deploy` avec le
   `DATABASE_URL` de production.

---

## Limites

Outil de suivi personnel. Le calcul suit la règle générale 90/180 et **ne tient
pas compte** des visas long séjour, titres de séjour, accords bilatéraux ni des
statuts particuliers qui suspendent ou remplacent la règle. Ne remplace pas
l'avis d'une autorité consulaire.
