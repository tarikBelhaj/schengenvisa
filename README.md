# Schengen 90/180

Suivi des séjours dans l'espace Schengen, en fenêtre glissante, pour soi et ses
proches. Chaque compte Google ne voit que ses propres données.

Next.js 14 (App Router) · TypeScript · Tailwind · Prisma · PostgreSQL · NextAuth · FR/EN

## La règle

90 jours de présence maximum sur toute période de 180 jours consécutifs. La
fenêtre glisse : chaque jour qui passe fait sortir un jour ancien, ce qui libère
du crédit.

D'où le piège du calcul naïf : après 40 jours en janvier–février, `90 − 40 = 50`
est faux. Une entrée le 1er juin permet 90 jours pleins, parce que l'historique
sort de la fenêtre pendant le séjour. Cas couvert par les tests.

Conventions retenues :

- fenêtre = `[ref − 179, ref]`, 180 jours bornes incluses
- entrée et sortie comptent toutes les deux
- les séjours planifiés comptent comme les passés
- `exitDate` vide = séjour en cours, borné à la date de référence
- les chevauchements ne comptent leurs jours communs qu'une fois

## Installation

Il faut une base PostgreSQL ([Neon](https://neon.tech) ou
[Supabase](https://supabase.com) en tier gratuit) et un client OAuth Google.

```bash
cp .env.example .env      # puis remplir
npm install
npx prisma migrate deploy
npm run db:seed           # optionnel
npm run dev
```

URI de redirection à déclarer côté Google :
`<NEXTAUTH_URL>/api/auth/callback/google`

### Variables

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | connexion applicative (poolée en production) |
| `DIRECT_URL` | connexion directe, pour les migrations |
| `NEXTAUTH_URL` | URL du site |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | identifiants OAuth |
| `ALLOWED_EMAILS` | liste blanche `a@x.com,b@y.com`. Vide = tout compte Google |
| `SEED_USER_EMAIL` | compte auquel rattacher les données de démo |

## Scripts

| | |
| --- | --- |
| `npm run dev` | serveur de développement |
| `npm run build` | `prisma generate` puis build |
| `npm test` | tests du calcul 90/180 |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | jeu de démonstration |
| `npm run db:studio` | explorateur Prisma |

## Structure

```
prisma/          schema, migrations, seed
src/lib/
  dates.ts       dates UTC en numéros de jour
  schengen.ts    le calcul
  auth.ts        NextAuth + liste blanche
  data.ts        requêtes cloisonnées par userId
src/i18n/        dictionnaires FR/EN
src/app/         landing, login, dashboard, person/[id], actions
src/components/  Gauge, WindowBar, Timeline, Simulator, formulaires
```

### API de calcul

```ts
daysPresentInWindow(trips, ref)   // jours consommés dans la fenêtre
daysRemaining(trips, ref)         // 90 − consommés, négatif si dépassement
maxStayFromEntry(trips, entry)    // { maxExitDate, allowedDays, daysUsedAtEntry }
findFirstOverage(trips, ref)      // premier jour de dépassement, ou null
nextPlannedTrip(trips, ref)       // prochain séjour à venir
```

Fonctions pures, sans dépendance : le simulateur les exécute côté client.

## Cloisonnement

Le `userId` de session entre dans le `where` de chaque lecture, et chaque
écriture vérifie la propriété de la personne au préalable. `ALLOWED_EMAILS`
filtre en amont qui peut se connecter.

## Déploiement

Vercel. Renseigner les variables ci-dessus, `NEXTAUTH_URL` valant l'URL de
production, `DATABASE_URL` la connexion poolée. Ajouter l'URI de redirection de
production côté Google. Le build lance `prisma generate`.

## Limites

Le calcul suit la règle générale 90/180 et ne tient pas compte des visas long
séjour, titres de séjour ou accords bilatéraux. Ne remplace pas l'avis d'une
autorité consulaire.
