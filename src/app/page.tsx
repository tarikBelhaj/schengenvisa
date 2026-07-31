import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';

const points = [
  {
    title: 'Fenêtre glissante, pas le calendrier',
    body: "Sur toute période de 180 jours, 90 jours de présence maximum. Chaque jour qui passe libère du crédit — l'app le recalcule à chaque date.",
  },
  {
    title: 'Passés et planifiés au même endroit',
    body: 'Les séjours à venir comptent dans le calcul. Un voyage prévu qui provoquerait un dépassement est signalé avant le départ.',
  },
  {
    title: 'La question qui compte',
    body: "« Si j'entre le 1er décembre, jusqu'à quand puis-je rester ? » Le simulateur avance jour par jour et donne la date de sortie maximale.",
  },
];

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-widest text-indigo-600">Schengen</p>
      <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
        90 jours sur 180, calculés correctement.
      </h1>
      <p className="mt-4 text-balance text-lg text-slate-600">
        Un suivi des séjours dans l&apos;espace Schengen pour vous et vos proches, avec le calcul
        en fenêtre glissante que les compteurs approximatifs se contentent d&apos;estimer.
      </p>

      <Link
        href="/login"
        className="mt-8 inline-flex w-fit rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
      >
        Se connecter
      </Link>

      <dl className="mt-16 grid gap-8 sm:grid-cols-3">
        {points.map((point) => (
          <div key={point.title}>
            <dt className="text-sm font-semibold text-slate-900">{point.title}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-slate-600">{point.body}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-16 text-xs text-slate-400">
        Outil de suivi personnel. Ne remplace pas l&apos;avis d&apos;une autorité consulaire.
      </p>
    </main>
  );
}
