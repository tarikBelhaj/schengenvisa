import { cookies } from 'next/headers';

import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from './config';
import { dictionaries, type Dict } from './dictionaries';

export function getLocale(): Locale {
  const value = cookies().get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function getDict(): Dict {
  return dictionaries[getLocale()];
}

export function getI18n(): { locale: Locale; dict: Dict } {
  const locale = getLocale();
  return { locale, dict: dictionaries[locale] };
}
