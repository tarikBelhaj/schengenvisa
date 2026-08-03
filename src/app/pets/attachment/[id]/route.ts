import { requireUserId } from '@/lib/auth';
import { getAttachment } from '@/lib/petsData';

export const dynamic = 'force-dynamic';

// Sert une pièce jointe stockée en data URL. L'appartenance est vérifiée par la
// requête elle-même : un identifiant deviné ne renvoie rien.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const attachment = await getAttachment(userId, params.id);
  if (!attachment) return new Response('Not found', { status: 404 });

  const comma = attachment.fileData.indexOf(',');
  if (comma < 0) return new Response('Not found', { status: 404 });

  const bytes = Buffer.from(attachment.fileData.slice(comma + 1), 'base64');

  return new Response(bytes, {
    headers: {
      'Content-Type': attachment.fileType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(attachment.fileName)}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
