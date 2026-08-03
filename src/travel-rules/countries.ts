import type { Locale } from '@/i18n/config';

// Liste ISO 3166-1 alpha-2 complète, pour les champs où l'on désigne un pays
// sans avoir besoin de ses règles d'importation (résidence, par exemple).
// Les noms viennent d'Intl : rien à traduire à la main, et ça suit la langue.
const ISO_CODES =
  'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ ' +
  'CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO ' +
  'FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE ' +
  'JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO ' +
  'MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW ' +
  'PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM ' +
  'TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW';

export const ALL_COUNTRY_CODES: string[] = ISO_CODES.split(' ');

export function isCountryCode(code: string): boolean {
  return ALL_COUNTRY_CODES.includes(code.toUpperCase());
}

/** Drapeau dérivé du code : deux indicateurs régionaux Unicode. */
export function flagOf(code: string): string {
  const upper = code.toUpperCase();
  if (upper.length !== 2) return '';
  return String.fromCodePoint(
    ...upper.split('').map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

const displayNames = new Map<Locale, Intl.DisplayNames>();

export function countryName(code: string, locale: Locale): string {
  let names = displayNames.get(locale);
  if (!names) {
    names = new Intl.DisplayNames([locale], { type: 'region' });
    displayNames.set(locale, names);
  }
  try {
    return names.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/** Liste triée alphabétiquement dans la langue courante. */
export function sortedCountries(locale: Locale): { code: string; name: string; flag: string }[] {
  return ALL_COUNTRY_CODES.map((code) => ({
    code,
    name: countryName(code, locale),
    flag: flagOf(code),
  })).sort((a, b) => a.name.localeCompare(b.name, locale));
}
