'use client';

import { useRef, useState } from 'react';

import type { Dict } from '@/i18n/dictionaries';

const MAX_CHARS = 700_000;
const IMAGE_MAX_SIZE = 1400;

// Les images sont recompressées, les PDF passent tels quels. La limite tient au
// plafond de 1 Mo sur le corps d'une server action.
function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read'));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

function compressImage(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error('decode'));
    img.onload = () => {
      const scale = Math.min(1, IMAGE_MAX_SIZE / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('canvas'));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.78));
    };
    img.src = dataUrl;
  });
}

interface AttachmentInputProps {
  dict: Dict;
  existingName?: string | null;
}

export default function AttachmentInput({ dict, existingName }: AttachmentInputProps) {
  const [name, setName] = useState<string | null>(existingName ?? null);
  const [data, setData] = useState('');
  const [type, setType] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const t = dict.pets;

  async function onPick(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      let payload = await readFile(file);
      if (file.type.startsWith('image/')) payload = await compressImage(payload);

      if (payload.length > MAX_CHARS) {
        setError(dict.errors.fileTooLarge);
        return;
      }
      setData(payload);
      setType(file.type || 'application/octet-stream');
      setName(file.name);
    } catch {
      setError(dict.errors.invalid);
    }
  }

  return (
    <div>
      <p className="text-sm text-slate-500">
        {t.attachment} <span className="text-slate-400">{dict.common.optional}</span>
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-full border border-brand-100 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-600"
        >
          {name ? t.attachmentReplace : t.attachmentAdd}
        </button>
        {name && <span className="truncate text-sm text-slate-500">{name}</span>}
      </div>

      <p className="mt-1.5 text-xs text-slate-400">{t.attachmentHint}</p>
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}

      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0])}
      />
      {/* Vides si l'utilisateur ne change pas le fichier : le serveur conserve l'existant. */}
      <input type="hidden" name="fileData" value={data} />
      <input type="hidden" name="fileName" value={data ? (name ?? '') : ''} />
      <input type="hidden" name="fileType" value={data ? type : ''} />
    </div>
  );
}
