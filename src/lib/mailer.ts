// Envoi via Resend. Sans RESEND_API_KEY, on n'envoie rien et on le dit :
// mieux vaut un rapport explicite qu'un échec silencieux.
export interface MailResult {
  sent: boolean;
  reason?: string;
}

export async function sendMail(
  to: string,
  subject: string,
  text: string,
): Promise<MailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, reason: 'RESEND_API_KEY absente' };

  const from = process.env.ALERT_FROM ?? 'Schengen 90/180 <onboarding@resend.dev>';

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, text }),
  });

  if (!response.ok) {
    return { sent: false, reason: `Resend ${response.status}` };
  }
  return { sent: true };
}
