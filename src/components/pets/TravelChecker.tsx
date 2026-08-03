'use client';

import { useMemo, useState } from 'react';

import { fmt, type Locale } from '@/i18n/config';
import type { Dict } from '@/i18n/dictionaries';
import { formatDate, fromEpochDay, toIsoDate, todayUtc } from '@/lib/dates';
import { assessTravel, earliestTravelDate, type Check, type DogLike } from '@/lib/pets';
import type { DogDTO } from '@/lib/petsData';
import { input, label } from '@/lib/ui';
import { COUNTRIES, COUNTRY_CODES, sortedCountries } from '@/travel-rules';

function checkMessage(check: Check, dict: Dict, locale: Locale, countryCode: string): string {
  const requirement = COUNTRIES[countryCode]?.requirements.find(
    (r) => r.id === check.requirementId,
  );
  const label = requirement?.label[locale] ?? check.requirementId;
  const t = dict.pets;

  switch (check.status) {
    case 'OK':
      return fmt(t.checkOk, { label });
    case 'MISSING':
      return fmt(t.checkMissing, { label });
    case 'EXPIRED':
    case 'EXPIRES_BEFORE_TRAVEL':
      return fmt(t.checkExpired, { label });
    case 'TOO_RECENT':
      return fmt(t.checkTooRecent, { label, n: check.daysShort ?? 0 });
    case 'TOO_OLD':
      return fmt(t.checkTooOld, { label });
    case 'ORDER_INVALID':
      return fmt(t.checkOrderInvalid, { label });
    case 'AGE_INVALID':
      return fmt(t.checkAgeInvalid, { label });
  }
}

function ScoreRing({ score, size = 128 }: { score: number; size?: number }) {
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const tone =
    score === 100
      ? { from: '#10b981', to: '#34d399', text: 'text-emerald-600' }
      : score >= 60
        ? { from: '#1a58d6', to: '#22cfee', text: 'text-brand-600' }
        : { from: '#f59e0b', to: '#fbbf24', text: 'text-amber-600' };

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`score-${tone.from.slice(1)}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={tone.from} />
            <stop offset="100%" stopColor={tone.to} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2ecfb" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#score-${tone.from.slice(1)})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-3xl font-semibold tabular-nums ${tone.text}`}>{score}%</span>
      </div>
    </div>
  );
}

interface TravelCheckerProps {
  dog: DogDTO;
  dict: Dict;
  locale: Locale;
}

export default function TravelChecker({ dog, dict, locale }: TravelCheckerProps) {
  const t = dict.pets;
  const [from, setFrom] = useState(dog.countryCode ?? 'FR');
  const [to, setTo] = useState(() => COUNTRY_CODES.find((c) => c !== (dog.countryCode ?? 'FR')) ?? 'OM');
  const [date, setDate] = useState(() => toIsoDate(todayUtc()));

  const dogLike: DogLike = useMemo(
    () => ({
      breed: dog.breed,
      birthDate: dog.birthDate,
      microchip: dog.microchip,
      euPassport: dog.euPassport,
    }),
    [dog.breed, dog.birthDate, dog.microchip, dog.euPassport],
  );

  const assessment = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    return assessTravel(dogLike, dog.records, to, date, from);
  }, [dogLike, dog.records, to, date, from]);

  const earliest = useMemo(() => {
    if (!assessment || assessment.compliant) return null;
    return earliestTravelDate(dogLike, dog.records, to, date);
  }, [assessment, dogLike, dog.records, to, date]);

  // Le vaccin antirabique est la pierre angulaire : sa date conditionne le
  // titrage, donc la date de départ possible.
  const rabiesCheck = assessment?.checks.find(
    (c) => c.type === 'RABIES_VACCINE' && c.recordDay != null,
  );
  const needsTiter = assessment?.checks.some((c) => c.type === 'RABIES_TITER');

  const blockerMessage = (kind: string, detail?: string) => {
    switch (kind) {
      case 'AGE':
        return fmt(t.blockerAge, { n: detail ?? '?' });
      case 'BREED':
        return fmt(t.blockerBreed, { breed: detail ?? '' });
      case 'MICROCHIP':
        return t.blockerMicrochip;
      default:
        return t.blockerPassport;
    }
  };

  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-card">
      <div className="border-b border-brand-50 px-6 py-5">
        <h2 className="text-base font-semibold text-slate-800">{t.travelTitle}</h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <label className={label} htmlFor="travel-from">
              {t.travelFrom}
            </label>
            <select
              id="travel-from"
              className={`${input} mt-1.5`}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            >
              {sortedCountries(locale).map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="travel-to">
              {t.travelTo}
            </label>
            <select
              id="travel-to"
              className={`${input} mt-1.5`}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            >
              {COUNTRY_CODES.map((code) => (
                <option key={code} value={code}>
                  {COUNTRIES[code].flag} {COUNTRIES[code].name[locale]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="travel-date">
              {t.travelDate}
            </label>
            <input
              id="travel-date"
              type="date"
              className={`${input} mt-1.5`}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {assessment && (
        <>
          <div className="flex flex-col items-center gap-6 px-6 py-7 sm:flex-row">
            <ScoreRing score={assessment.score} />

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold ${
                  assessment.compliant
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-700'
                }`}
              >
                {assessment.compliant ? `✅ ${t.compliant}` : `❌ ${t.notCompliant}`}
              </span>

              <p className="mt-3 text-xs uppercase tracking-widest text-slate-400">{t.scoreLabel}</p>

              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                {assessment.compliant
                  ? t.allGood
                  : assessment.remainingSteps === 1
                    ? t.stepsLeftOne
                    : fmt(t.stepsLeft, { n: assessment.remainingSteps })}
              </p>

              {!assessment.compliant && (
                <p className="mt-2 text-sm text-slate-500">
                  {t.impossibleToday}{' '}
                  {earliest
                    ? fmt(t.earliest, { date: formatDate(earliest, locale) })
                    : t.earliestNone}
                </p>
              )}
            </div>
          </div>

          {rabiesCheck && (
            <div className="mx-6 mb-4 rounded-2xl bg-brand-50 px-4 py-3">
              <p className="text-sm font-semibold text-brand-800">
                {fmt(t.titerRabiesDate, {
                  date: formatDate(fromEpochDay(rabiesCheck.recordDay!), locale),
                })}
              </p>
            </div>
          )}

          {needsTiter && (
            <details className="mx-6 mb-4 rounded-2xl bg-slate-50 px-4 py-3">
              <summary className="cursor-pointer list-none text-sm font-semibold text-slate-700">
                ℹ️ {t.titerTitle}
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{t.titerBody}</p>
              {to === 'OM' && (
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{t.titerOman}</p>
              )}
            </details>
          )}

          <div className="space-y-2 px-6 pb-6">
            {assessment.blockers.map((blocker) => (
              <p
                key={blocker.kind}
                className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
              >
                {blockerMessage(blocker.kind, blocker.detail)}
              </p>
            ))}

            {assessment.checks.map((check) => {
              const ok = check.status === 'OK';
              const requirement = COUNTRIES[to]?.requirements.find(
                (r) => r.id === check.requirementId,
              );
              return (
                <div
                  key={check.requirementId}
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    ok
                      ? 'bg-emerald-50/70 text-emerald-800'
                      : check.mandatory
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-slate-50 text-slate-500'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="shrink-0">{ok ? '✅' : check.mandatory ? '❌' : '•'}</span>
                    <div className="min-w-0">
                      <p className="font-medium">{checkMessage(check, dict, locale, to)}</p>
                      {check.recordDay != null && (
                        <p className="mt-0.5 text-xs opacity-75">
                          {fmt(t.docDated, {
                            date: formatDate(fromEpochDay(check.recordDay), locale),
                          })}
                          {check.expiryDay != null && (
                            <>
                              {' · '}
                              {fmt(t.docUntil, {
                                date: formatDate(fromEpochDay(check.expiryDay), locale),
                              })}
                            </>
                          )}
                        </p>
                      )}
                      {!ok && requirement?.detail && (
                        <p className="mt-1 text-xs opacity-80">{requirement.detail[locale]}</p>
                      )}
                      {!check.mandatory && (
                        <p className="mt-1 text-xs uppercase tracking-wide opacity-70">
                          {t.recommended}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
