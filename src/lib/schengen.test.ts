import { describe, expect, it } from 'vitest';

import { inclusiveDays, toEpochDay, toIsoDate } from './dates';
import {
  daysPresentInWindow,
  historyClearDate,
  MAX_DAYS,
  daysRemaining,
  findFirstOverage,
  maxStayFromEntry,
  nextPlannedTrip,
  type TripLike,
} from './schengen';

const past = (entryDate: string, exitDate: string | null): TripLike => ({
  entryDate,
  exitDate,
  status: 'PAST',
});

const planned = (entryDate: string, exitDate: string | null): TripLike => ({
  entryDate,
  exitDate,
  status: 'PLANNED',
});

describe('dates UTC', () => {
  it('lit une chaîne ISO et un Date UTC de la même façon', () => {
    expect(toEpochDay('2025-01-10')).toBe(toEpochDay(new Date('2025-01-10T00:00:00Z')));
  });

  it("ignore l'heure portée par un Date", () => {
    expect(toEpochDay(new Date('2025-01-10T23:30:00Z'))).toBe(toEpochDay('2025-01-10'));
  });

  it('compte les bornes, y compris à travers un changement d\'heure', () => {
    // Dernier week-end de mars : +1h en Europe, sans effet sur le décompte.
    expect(inclusiveDays('2025-03-29', '2025-03-31')).toBe(3);
    expect(inclusiveDays('2025-01-10', '2025-01-10')).toBe(1);
  });
});

describe('daysPresentInWindow — séjour unique', () => {
  const trips = [past('2025-01-10', '2025-01-20')]; // 11 jours, bornes incluses

  it('compte le jour d\'entrée et le jour de sortie', () => {
    expect(daysPresentInWindow(trips, '2025-01-20')).toBe(11);
  });

  it('reste stable tant que la fenêtre couvre le séjour', () => {
    expect(daysPresentInWindow(trips, '2025-02-15')).toBe(11);
  });

  it('ne compte rien avant le séjour', () => {
    expect(daysPresentInWindow(trips, '2025-01-09')).toBe(0);
  });

  it('ne compte que les jours déjà écoulés au milieu du séjour', () => {
    expect(daysPresentInWindow(trips, '2025-01-14')).toBe(5);
  });

  it('laisse 79 jours de crédit', () => {
    expect(daysRemaining(trips, '2025-01-20')).toBe(79);
  });
});

describe('daysPresentInWindow — séjours multiples', () => {
  const trips = [
    past('2025-03-01', '2025-03-10'), // 10 jours
    past('2025-05-01', '2025-05-20'), // 20 jours
  ];

  it('additionne les séjours présents dans la fenêtre', () => {
    expect(daysPresentInWindow(trips, '2025-05-20')).toBe(30);
    expect(daysRemaining(trips, '2025-05-20')).toBe(60);
  });

  it('ignore le séjour qui n\'a pas encore commencé', () => {
    expect(daysPresentInWindow(trips, '2025-03-10')).toBe(10);
  });
});

describe('libération de la fenêtre glissante', () => {
  const trips = [past('2025-01-10', '2025-01-20')]; // 11 jours

  it('garde les 11 jours le dernier jour où l\'entrée est dans la fenêtre', () => {
    // 2025-01-10 + 179 jours = 2025-07-08 : la fenêtre commence pile à l'entrée.
    expect(daysPresentInWindow(trips, '2025-07-08')).toBe(11);
  });

  it('libère un jour dès le lendemain', () => {
    expect(daysPresentInWindow(trips, '2025-07-09')).toBe(10);
    expect(daysRemaining(trips, '2025-07-09')).toBe(80);
  });

  it('ne garde qu\'un jour quand seule la sortie est encore dans la fenêtre', () => {
    // 2025-01-20 + 179 = 2025-07-18
    expect(daysPresentInWindow(trips, '2025-07-18')).toBe(1);
  });

  it('a tout libéré une fois le séjour sorti de la fenêtre', () => {
    expect(daysPresentInWindow(trips, '2025-07-19')).toBe(0);
    expect(daysRemaining(trips, '2025-07-19')).toBe(90);
  });
});

describe('voyage planifié', () => {
  const trips = [past('2025-06-01', '2025-06-10'), planned('2025-12-01', '2025-12-10')];

  it('compte le séjour planifié quand la fenêtre l\'atteint', () => {
    expect(daysPresentInWindow(trips, '2025-12-10')).toBe(10); // le séjour de juin est sorti
  });

  it('ne compte pas encore un séjour futur', () => {
    expect(daysPresentInWindow([planned('2025-12-01', '2025-12-10')], '2025-11-01')).toBe(0);
  });

  it('au 1er novembre, seul le séjour de juin compte', () => {
    // 2025-06-01 + 179 = 2025-11-27 : juin est encore dans la fenêtre, pas décembre.
    expect(daysPresentInWindow(trips, '2025-11-01')).toBe(10);
  });

  it('compte le planifié à égalité avec le passé quand les deux sont dans la fenêtre', () => {
    const proches = [past('2025-06-01', '2025-06-10'), planned('2025-07-01', '2025-07-10')];
    expect(daysPresentInWindow(proches, '2025-07-10')).toBe(20);
  });
});

describe('séjour en cours (exitDate null)', () => {
  const trips = [past('2025-06-01', null)];

  it('court jusqu\'à la date de référence', () => {
    expect(daysPresentInWindow(trips, '2025-06-10')).toBe(10);
  });

  it('ne compte rien avant l\'entrée', () => {
    expect(daysPresentInWindow(trips, '2025-05-20')).toBe(0);
  });
});

describe('chevauchements', () => {
  it('ne compte qu\'une fois les jours communs à deux séjours', () => {
    const trips = [past('2025-03-01', '2025-03-10'), past('2025-03-05', '2025-03-15')];
    expect(daysPresentInWindow(trips, '2025-03-20')).toBe(15); // union 1→15, pas 10+11
  });

  it('absorbe un doublon exact', () => {
    const trips = [past('2025-03-01', '2025-03-10'), past('2025-03-01', '2025-03-10')];
    expect(daysPresentInWindow(trips, '2025-03-20')).toBe(10);
  });

  it('absorbe un séjour entièrement inclus dans un autre', () => {
    const trips = [past('2025-03-01', '2025-03-31'), past('2025-03-10', '2025-03-12')];
    expect(daysPresentInWindow(trips, '2025-03-31')).toBe(31);
  });

  it('gère un séjour en cours qui chevauche un séjour enregistré', () => {
    const trips = [past('2025-03-01', '2025-03-10'), past('2025-03-08', null)];
    expect(daysPresentInWindow(trips, '2025-03-15')).toBe(15);
  });
});

describe('dépassement', () => {
  const trips = [past('2025-01-01', '2025-04-30')]; // 120 jours

  it('rend un crédit négatif', () => {
    expect(daysPresentInWindow(trips, '2025-04-30')).toBe(120);
    expect(daysRemaining(trips, '2025-04-30')).toBe(-30);
  });

  it('situe le premier jour de dépassement au 91e jour', () => {
    const overage = findFirstOverage(trips, '2025-04-30');
    expect(overage).not.toBeNull();
    expect(toIsoDate(overage!.date)).toBe('2025-04-01'); // 31 + 28 + 31 = 90 jours au 31 mars
    expect(overage!.daysPresent).toBe(91);
  });

  it('détecte le dépassement provoqué par un séjour planifié', () => {
    const mixte = [
      past('2025-06-01', '2025-08-14'), // 75 jours
      planned('2025-09-01', '2025-09-30'), // +30 → dépassement en cours de route
    ];
    const overage = findFirstOverage(mixte, '2025-07-01');
    expect(toIsoDate(overage!.date)).toBe('2025-09-16'); // 75 + 16 = 91
    expect(overage!.daysPresent).toBe(91);
  });

  it('ne signale rien quand tout tient dans les 90 jours', () => {
    const ok = [past('2025-06-01', '2025-07-30'), planned('2025-09-01', '2025-09-20')];
    expect(findFirstOverage(ok, '2025-07-01')).toBeNull();
  });
});

describe('maxStayFromEntry', () => {
  it('autorise 90 jours pleins sans historique', () => {
    const r = maxStayFromEntry([], '2025-12-01');
    expect(r.allowedDays).toBe(90);
    expect(toIsoDate(r.maxExitDate!)).toBe('2026-02-28');
    expect(r.daysUsedAtEntry).toBe(0);
  });

  it('cas central : entrée le 1er décembre après 30 jours en novembre', () => {
    const trips = [past('2025-11-01', '2025-11-30')]; // 30 jours
    const r = maxStayFromEntry(trips, '2025-12-01');
    // Novembre reste dans la fenêtre pendant toute la simulation → 90 − 30 = 60.
    expect(r.daysUsedAtEntry).toBe(30);
    expect(r.allowedDays).toBe(60);
    expect(toIsoDate(r.maxExitDate!)).toBe('2026-01-29');
  });

  it('profite de la libération de la fenêtre pendant le séjour', () => {
    const trips = [past('2025-01-01', '2025-02-09')]; // 40 jours
    const r = maxStayFromEntry(trips, '2025-06-01');
    // Un calcul naïf donnerait 90 − 40 = 50 jours. Mais l'historique sort de la
    // fenêtre pendant le séjour, ce qui rend les 90 jours pleins possibles.
    expect(r.daysUsedAtEntry).toBe(40);
    expect(r.allowedDays).toBe(90);
    expect(toIsoDate(r.maxExitDate!)).toBe('2025-08-29'); // 1er juin + 89 jours
  });

  it('refuse l\'entrée quand le quota est déjà épuisé', () => {
    const trips = [past('2025-09-01', '2025-11-29')]; // exactement 90 jours
    const r = maxStayFromEntry(trips, '2025-11-30');
    expect(r.daysUsedAtEntry).toBe(90);
    expect(r.allowedDays).toBe(0);
    expect(r.maxExitDate).toBeNull();
  });

  it('tient compte des séjours planifiés déjà enregistrés', () => {
    const trips = [planned('2025-12-20', '2025-12-31')]; // 12 jours qui chevauchent la simulation
    const r = maxStayFromEntry(trips, '2025-12-01');
    // Les jours planifiés tombent dans la simulation : l'union ne les compte
    // qu'une fois, le séjour simulé reste plafonné à 90 jours.
    expect(r.allowedDays).toBe(90);
    expect(toIsoDate(r.maxExitDate!)).toBe('2026-02-28');
  });

  it('ne dépasse jamais 90 jours sur toute la durée simulée', () => {
    const trips = [past('2025-01-01', '2025-02-09')];
    const r = maxStayFromEntry(trips, '2025-06-01');
    const simule = [...trips, { entryDate: '2025-06-01', exitDate: r.maxExitDate! }];
    expect(findFirstOverage(simule, '2025-06-01')).toBeNull();
  });
});

describe('nextPlannedTrip', () => {
  const trips = [
    past('2025-01-01', '2025-01-10'),
    planned('2025-12-01', '2025-12-10'),
    planned('2025-09-01', '2025-09-10'),
  ];

  it('rend le prochain séjour planifié à venir', () => {
    expect(nextPlannedTrip(trips, '2025-07-01')?.entryDate).toBe('2025-09-01');
  });

  it('ignore les séjours planifiés déjà commencés', () => {
    expect(nextPlannedTrip(trips, '2025-10-01')?.entryDate).toBe('2025-12-01');
  });

  it('rend null quand il n\'y a plus rien de planifié', () => {
    expect(nextPlannedTrip(trips, '2026-01-01')).toBeNull();
  });
});

describe('historyClearDate', () => {
  // Le cas réel : deux séjours en été, entrée planifiée le 1er décembre.
  const trips = [past('2026-06-21', '2026-07-17'), past('2026-07-21', '2026-08-10')];

  it('compte 48 jours consommés au jour de l’entrée', () => {
    expect(daysPresentInWindow(trips, '2026-12-01')).toBe(48);
  });

  it('rend la date de sortie du dernier jour de la fenêtre', () => {
    // 2026-08-10 est le dernier jour compté ; il sort 180 jours plus tard.
    expect(toIsoDate(historyClearDate(trips, '2026-12-01')!)).toBe('2027-02-06');
  });

  it('autorise 90 jours pleins alors qu’un décompte simple en donnerait 42', () => {
    const r = maxStayFromEntry(trips, '2026-12-01');
    expect(r.daysUsedAtEntry).toBe(48);
    expect(MAX_DAYS - r.daysUsedAtEntry).toBe(42);
    expect(r.allowedDays).toBe(90);
    expect(toIsoDate(r.maxExitDate!)).toBe('2027-02-28');
  });

  it('rend null quand rien n’est compté dans la fenêtre', () => {
    expect(historyClearDate(trips, '2028-01-01')).toBeNull();
  });
});

describe('explication affichée sur un séjour planifié', () => {
  const others = [past('2026-06-21', '2026-07-17'), past('2026-07-21', '2026-08-10')];
  const planned = { entryDate: '2026-12-01', exitDate: '2026-12-31', status: 'PLANNED' as const };

  it('ne compte pas le séjour courant dans la consommation antérieure', () => {
    // Sur tous les séjours, le jour d'entrée du séjour planifié compte pour 1.
    expect(daysPresentInWindow([...others, planned], '2026-12-01')).toBe(49);
    // Sur les autres seulement, le chiffre à afficher.
    expect(daysPresentInWindow(others, '2026-12-01')).toBe(48);
  });
});
