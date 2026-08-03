'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';

import { saveDog, type ActionState } from '@/app/pets/actions';
import PhotoInput from '@/components/PhotoInput';
import type { Dict } from '@/i18n/dictionaries';
import type { DogDTO } from '@/lib/petsData';
import { btnPrimary, input, label } from '@/lib/ui';
import { COUNTRIES, COUNTRY_CODES } from '@/travel-rules';

function SubmitButton({ children, saving }: { children: React.ReactNode; saving: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={btnPrimary}>
      {pending ? saving : children}
    </button>
  );
}

export default function DogForm({ dog, dict }: { dog?: DogDTO; dict: Dict }) {
  const [state, formAction] = useFormState<ActionState, FormData>(saveDog, {});
  const [name, setName] = useState(dog?.name ?? '');
  const t = dict.pets;

  return (
    <form action={formAction} className="space-y-4">
      {dog && <input type="hidden" name="id" value={dog.id} />}

      <PhotoInput name={name} dict={dict} initialPhoto={dog?.photo} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="dog-name">
            {t.name}
          </label>
          <input
            id="dog-name"
            className={`${input} mt-1.5`}
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.namePlaceholder}
          />
        </div>
        <div>
          <label className={label} htmlFor="dog-breed">
            {t.breed}
          </label>
          <input
            id="dog-breed"
            className={`${input} mt-1.5`}
            name="breed"
            defaultValue={dog?.breed ?? ''}
            placeholder={t.breedPlaceholder}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={label} htmlFor="dog-sex">
            {t.sex}
          </label>
          <select id="dog-sex" className={`${input} mt-1.5`} name="sex" defaultValue={dog?.sex ?? ''}>
            <option value="">—</option>
            <option value="MALE">{t.male}</option>
            <option value="FEMALE">{t.female}</option>
          </select>
        </div>
        <div>
          <label className={label} htmlFor="dog-birth">
            {t.birthDate}
          </label>
          <input
            id="dog-birth"
            type="date"
            className={`${input} mt-1.5`}
            name="birthDate"
            defaultValue={dog?.birthDate ?? ''}
          />
        </div>
        <div>
          <label className={label} htmlFor="dog-weight">
            {t.weight}
          </label>
          <input
            id="dog-weight"
            className={`${input} mt-1.5`}
            name="weightKg"
            inputMode="decimal"
            defaultValue={dog?.weightKg ?? ''}
            placeholder="24,5"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="dog-chip">
            {t.microchip}
          </label>
          <input
            id="dog-chip"
            className={`${input} mt-1.5`}
            name="microchip"
            defaultValue={dog?.microchip ?? ''}
            placeholder={t.microchipPlaceholder}
          />
        </div>
        <div>
          <label className={label} htmlFor="dog-passport">
            {t.euPassport}
          </label>
          <input
            id="dog-passport"
            className={`${input} mt-1.5`}
            name="euPassport"
            defaultValue={dog?.euPassport ?? ''}
            placeholder={t.euPassportPlaceholder}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="dog-country">
            {t.country}
          </label>
          <select
            id="dog-country"
            className={`${input} mt-1.5`}
            name="countryCode"
            defaultValue={dog?.countryCode ?? ''}
          >
            <option value="">—</option>
            {COUNTRY_CODES.map((code) => (
              <option key={code} value={code}>
                {COUNTRIES[code].flag} {COUNTRIES[code].name.fr}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="dog-color">
            {t.color}
          </label>
          <input
            id="dog-color"
            className={`${input} mt-1.5`}
            name="color"
            defaultValue={dog?.color ?? ''}
          />
        </div>
      </div>

      {state.error && (
        <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{state.error}</p>
      )}

      <SubmitButton saving={dict.common.saving}>
        {dog ? dict.common.update : t.addDog}
      </SubmitButton>
    </form>
  );
}
