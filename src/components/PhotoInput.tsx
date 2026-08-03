'use client';

import { useRef, useState } from 'react';

import type { Dict } from '@/i18n/dictionaries';

import Avatar from './Avatar';

const MAX_SIZE = 256;

// Recadrage carré centré puis compression JPEG. On envoie une vignette de
// quelques dizaines de Ko, jamais l'original du téléphone.
function resize(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode'));
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = MAX_SIZE;
        canvas.height = MAX_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('canvas'));
        ctx.drawImage(
          img,
          (img.width - side) / 2,
          (img.height - side) / 2,
          side,
          side,
          0,
          0,
          MAX_SIZE,
          MAX_SIZE,
        );
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

interface PhotoInputProps {
  name: string;
  dict: Dict;
  initialPhoto?: string | null;
}

export default function PhotoInput({ name, dict, initialPhoto }: PhotoInputProps) {
  const [photo, setPhoto] = useState<string | null>(initialPhoto ?? null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const t = dict.personForm;

  async function onPick(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError(t.photoNotImage);
      return;
    }
    try {
      setPhoto(await resize(file));
      setError(null);
    } catch {
      setError(t.photoFailed);
    }
  }

  return (
    <div>
      <p className="text-sm text-slate-500">
        {t.photo} <span className="text-slate-400">{dict.common.optional}</span>
      </p>

      <div className="mt-2 flex items-center gap-4">
        <Avatar name={name || '?'} photo={photo} size={64} />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-full border border-brand-100 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-600"
          >
            {photo ? t.photoChange : t.photoAdd}
          </button>

          {photo && (
            <button
              type="button"
              onClick={() => {
                setPhoto(null);
                if (fileRef.current) fileRef.current.value = '';
              }}
              className="rounded-full px-4 py-2 text-sm text-slate-400 transition hover:text-rose-600"
            >
              {dict.common.delete}
            </button>
          )}
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0])}
      />
      {/* La valeur réellement soumise : la vignette, ou vide pour effacer. */}
      <input type="hidden" name="photo" value={photo ?? ''} />
    </div>
  );
}
