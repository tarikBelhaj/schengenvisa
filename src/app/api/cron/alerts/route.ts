import { alertText, personAlert } from '@/lib/alerts';
import { todayUtc } from '@/lib/dates';
import { sendMail } from '@/lib/mailer';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Déclenché par Vercel Cron (voir vercel.json). Protégé par CRON_SECRET :
// sans lui, n'importe qui pourrait provoquer des envois.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = request.headers.get('authorization');
    if (header !== `Bearer ${secret}`) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  const today = todayUtc();
  const users = await prisma.user.findMany({
    where: { alertEmail: { not: null } },
    select: {
      id: true,
      alertEmail: true,
      persons: {
        select: {
          id: true,
          name: true,
          trips: { select: { entryDate: true, exitDate: true, status: true } },
        },
      },
    },
  });

  let sent = 0;
  let cleared = 0;
  const failures: string[] = [];

  for (const user of users) {
    for (const person of user.persons) {
      const alert = personAlert(person.trips, today);

      // La condition est retombée : on efface pour que le prochain
      // franchissement déclenche un nouvel envoi.
      const stale = await prisma.sentAlert.findMany({
        where: { personId: person.id, ...(alert ? { kind: { not: alert.kind } } : {}) },
        select: { id: true },
      });
      if (stale.length > 0) {
        await prisma.sentAlert.deleteMany({ where: { id: { in: stale.map((s) => s.id) } } });
        cleared += stale.length;
      }

      if (!alert) continue;

      const already = await prisma.sentAlert.findUnique({
        where: { personId_kind: { personId: person.id, kind: alert.kind } },
      });
      if (already) continue;

      const { subject, body } = alertText(person.name, alert);
      const result = await sendMail(user.alertEmail!, subject, body);

      if (!result.sent) {
        failures.push(result.reason ?? 'inconnu');
        continue;
      }

      await prisma.sentAlert.create({
        data: { userId: user.id, personId: person.id, kind: alert.kind, daysLeft: alert.daysLeft },
      });
      sent += 1;
    }
  }

  return Response.json({
    users: users.length,
    sent,
    cleared,
    failures: Array.from(new Set(failures)),
  });
}
