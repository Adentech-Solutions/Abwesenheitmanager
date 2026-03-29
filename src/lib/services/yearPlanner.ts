import {
  addDays,
  eachDayOfInterval,
  endOfYear,
  isWeekend,
  startOfDay,
  startOfYear,
} from 'date-fns';
import { getGermanHolidays, type GermanState } from '@/lib/utils/holidays';
import { getSchulferien } from '@/lib/utils/schulferien';
import { parseLocalDate, toLocalISO } from '@/lib/utils/localDate';

export interface PlannerCriteria {
  priorities: string[];
  mainVacation: {
    months: number[];
    days: number;
  } | null;
  remainingStrategy: string[];
  takeBridgeDays: boolean;
  considerSchoolHolidays: boolean;
}

export interface PlannedDay {
  date: string;
  type: 'urlaub' | 'feiertag' | 'wochenende' | 'schulferien' | 'arbeitstag';
  reason?: string;
  category: 'brueckentag' | 'haupturlaub' | 'kurzurlaub' | 'weihnachten' | 'none';
}

export interface YearPlanBlock {
  startDate: string;
  endDate: string;
  totalDays: number;
  urlaubstage: number;
  reason: string;
}

export interface YearPlan {
  days: PlannedDay[];
  urlaubstageGeplant: number;
  urlaubstageUebrig: number;
  feiertage: number;
  freieTagGesamt: number;
  blocks: YearPlanBlock[];
}

const DEFAULT_CRITERIA: PlannerCriteria = {
  priorities: [],
  mainVacation: null,
  remainingStrategy: ['christmas', 'longWeekends', 'recoveryGaps', 'schoolHolidays'],
  takeBridgeDays: false,
  considerSchoolHolidays: false,
};

function lte(a: Date, b: Date): boolean {
  return a.getTime() <= b.getTime();
}

function buildHolidaySet(year: number, state: GermanState): Set<string> {
  const set = new Set<string>();
  for (const h of getGermanHolidays(year, state)) {
    set.add(toLocalISO(startOfDay(h.date)));
  }
  return set;
}

function buildSchoolSet(year: number, state: GermanState): Set<string> {
  const set = new Set<string>();
  for (const s of getSchulferien(year, state)) {
    const a = parseLocalDate(s.startDate);
    const b = parseLocalDate(s.endDate);
    let c = startOfDay(a);
    const end = startOfDay(b);
    while (lte(c, end)) {
      if (c.getFullYear() === year) set.add(toLocalISO(c));
      c = addDays(c, 1);
    }
  }
  return set;
}

function buildAbsenceSet(
  year: number,
  existingAbsences: { startDate: Date; endDate: Date }[]
): Set<string> {
  const set = new Set<string>();
  const yStart = startOfYear(new Date(year, 0, 1));
  const yEnd = endOfYear(new Date(year, 0, 1));
  for (const a of existingAbsences) {
    let c = startOfDay(a.startDate);
    const e = startOfDay(a.endDate);
    while (lte(c, e)) {
      if (c.getTime() >= yStart.getTime() && c.getTime() <= yEnd.getTime()) set.add(toLocalISO(c));
      c = addDays(c, 1);
    }
  }
  return set;
}

function isWorkingDay(d: Date, holidaySet: Set<string>): boolean {
  if (isWeekend(d)) return false;
  return !holidaySet.has(toLocalISO(startOfDay(d)));
}

function bridgeVacationDayForHoliday(holidayDate: Date, holidaySet: Set<string>): Date | null {
  const h = startOfDay(holidayDate);
  const wd = h.getDay();
  let vDay: Date | null = null;
  if (wd === 1) vDay = addDays(h, -3);
  else if (wd === 2) vDay = addDays(h, -1);
  else if (wd === 4) vDay = addDays(h, 1);
  else if (wd === 5) vDay = addDays(h, 3);
  if (!vDay) return null;
  if (isWeekend(vDay) || holidaySet.has(toLocalISO(vDay))) return null;
  return vDay;
}

function collectBridgeDays(year: number, state: GermanState): Date[] {
  const holidaySet = buildHolidaySet(year, state);
  const out: Date[] = [];
  for (const hol of getGermanHolidays(year, state)) {
    const v = bridgeVacationDayForHoliday(hol.date, holidaySet);
    if (v && v.getFullYear() === year) out.push(startOfDay(v));
  }
  return out;
}

function findMainVacationWindow(
  year: number,
  months: number[],
  targetWorkingVacationDays: number,
  holidaySet: Set<string>,
  reserved: Set<string>
): { dates: Date[] } | null {
  let best: { dates: Date[] } | null = null;
  let bestScore = -1;

  // We iterate through all allowed months and try starting a vacation on every day
  for (const month of months) {
    const monthEnd = new Date(year, month + 1, 0);
    for (let startD = 1; startD <= monthEnd.getDate(); startD++) {
      const start = startOfDay(new Date(year, month, startD));
      if (!isWorkingDay(start, holidaySet)) continue;
      if (reserved.has(toLocalISO(start))) continue;

      const vacDates: Date[] = [];
      let d = start;
      // Allow the vacation to cross into the next month if that month is also in our allowed list
      // Or even if it's not, usually a "main vacation" can cross boundaries.
      // But we restrict it to the current year.
      while (vacDates.length < targetWorkingVacationDays && d.getFullYear() === year) {
        const iso = toLocalISO(d);
        if (reserved.has(iso)) break;
        if (isWeekend(d)) {
          d = addDays(d, 1);
          continue;
        }
        if (holidaySet.has(iso)) {
          d = addDays(d, 1);
          continue;
        }
        vacDates.push(startOfDay(d));
        d = addDays(d, 1);
      }

      if (vacDates.length < targetWorkingVacationDays) continue;

      const end = vacDates[vacDates.length - 1];
      const touchesWeekend =
        isWeekend(addDays(vacDates[0], -1)) || isWeekend(addDays(end, 1));

      // Higher score for touching weekends, slightly lower score for being later in the year
      // to break ties or prefer earlier windows if exactly same efficiency.
      const score = (touchesWeekend ? 1000 : 0) - vacDates.length;

      if (score > bestScore) {
        bestScore = score;
        best = { dates: vacDates };
      }
    }
  }
  return best;
}

function applyStrategyChristmas(
  year: number,
  holidaySet: Set<string>,
  blocked: Set<string>,
  newUrlaub: Set<string>,
  budget: { left: number }
): void {
  const yearEnd = endOfYear(new Date(year, 0, 1));
  let d = parseLocalDate(`${year}-12-24`);
  while (lte(d, yearEnd)) {
    const iso = toLocalISO(d);
    if (
      !isWeekend(d) &&
      !holidaySet.has(iso) &&
      !blocked.has(iso) &&
      !newUrlaub.has(iso) &&
      budget.left > 0
    ) {
      newUrlaub.add(iso);
      budget.left -= 1;
    }
    d = addDays(d, 1);
  }
}

function applyLongWeekends(
  year: number,
  holidaySet: Set<string>,
  blocked: Set<string>,
  newUrlaub: Set<string>,
  budget: { left: number }
): void {
  const yStart = startOfYear(new Date(year, 0, 1));
  const yEnd = endOfYear(new Date(year, 0, 1));
  let d = yStart;
  const ordered: string[] = [];
  while (lte(d, yEnd)) {
    const iso = toLocalISO(d);
    if (
      isWorkingDay(d, holidaySet) &&
      !blocked.has(iso) &&
      !newUrlaub.has(iso) &&
      (d.getDay() === 1 || d.getDay() === 5)
    ) {
      ordered.push(iso);
    }
    d = addDays(d, 1);
  }
  for (const iso of ordered) {
    if (budget.left <= 0) break;
    newUrlaub.add(iso);
    budget.left -= 1;
  }
}

function applyRecoveryGaps(
  year: number,
  holidaySet: Set<string>,
  blocked: Set<string>,
  newUrlaub: Set<string>,
  budget: { left: number }
): void {
  if (budget.left <= 0) return;
  const checkpoints = [90, 180, 270];
  const yStart = startOfYear(new Date(year, 0, 1));
  for (const dayOfYear of checkpoints) {
    if (budget.left <= 0) break;
    let d = addDays(yStart, dayOfYear);
    if (d.getFullYear() !== year) continue;
    while (lte(d, endOfYear(new Date(year, 0, 1))) && !isWorkingDay(d, holidaySet)) {
      d = addDays(d, 1);
    }
    const iso = toLocalISO(d);
    if (!blocked.has(iso) && !newUrlaub.has(iso) && isWorkingDay(d, holidaySet)) {
      newUrlaub.add(iso);
      budget.left -= 1;
    }
  }
}

function applySchoolHolidaySprinkle(
  year: number,
  state: GermanState,
  holidaySet: Set<string>,
  schoolSet: Set<string>,
  blocked: Set<string>,
  newUrlaub: Set<string>,
  budget: { left: number }
): void {
  for (const s of getSchulferien(year, state)) {
    if (budget.left <= 0) break;
    let d = startOfDay(parseLocalDate(s.startDate));
    const end = startOfDay(parseLocalDate(s.endDate));
    while (lte(d, end)) {
      if (d.getFullYear() !== year) {
        d = addDays(d, 1);
        continue;
      }
      const iso = toLocalISO(d);
      if (
        isWorkingDay(d, holidaySet) &&
        schoolSet.has(iso) &&
        !blocked.has(iso) &&
        !newUrlaub.has(iso) &&
        budget.left > 0
      ) {
        newUrlaub.add(iso);
        budget.left -= 1;
      }
      d = addDays(d, 1);
    }
  }
}

function buildFreeBlocks(
  days: PlannedDay[],
  holidaySet: Set<string>,
  newUrlaub: Set<string>,
  absExisting: Set<string>,
  considerSchool: boolean
): YearPlanBlock[] {
  const blocks: YearPlanBlock[] = [];
  let i = 0;
  while (i < days.length) {
    const iso = days[i].date;
    const d = parseLocalDate(iso);
    const isFree =
      isWeekend(d) ||
      holidaySet.has(iso) ||
      newUrlaub.has(iso) ||
      absExisting.has(iso) ||
      (considerSchool && days[i].type === 'schulferien');
    if (!isFree) {
      i += 1;
      continue;
    }
    const startIdx = i;
    let urlaubInBlock = 0;
    while (i < days.length) {
      const iso2 = days[i].date;
      const d2 = parseLocalDate(iso2);
      const free2 =
        isWeekend(d2) ||
        holidaySet.has(iso2) ||
        newUrlaub.has(iso2) ||
        absExisting.has(iso2) ||
        (considerSchool && days[i].type === 'schulferien');
      if (!free2) break;
      if (days[i].type === 'urlaub') urlaubInBlock += 1;
      i += 1;
    }
    const startIso = days[startIdx].date;
    const endIso = days[i - 1].date;
    const totalDays = i - startIdx;
    let reason = 'Freier Block';
    if (days[startIdx].reason?.includes('Haupturlaub')) reason = 'Haupturlaub';
    else if (startIso >= `${days[startIdx].date.slice(0, 4)}-12-24`) reason = 'Weihnachten / Jahreswechsel';
    blocks.push({
      startDate: startIso,
      endDate: endIso,
      totalDays,
      urlaubstage: urlaubInBlock,
      reason,
    });
  }
  return blocks;
}

export function generateYearPlan(
  year: number,
  state: GermanState,
  totalDays: number,
  existingAbsences: { startDate: Date; endDate: Date }[],
  criteria: PlannerCriteria
): YearPlan {
  const c = { ...DEFAULT_CRITERIA, ...criteria };
  const holidaySet = buildHolidaySet(year, state);
  const schoolSet = buildSchoolSet(year, state);
  const absSet = buildAbsenceSet(year, existingAbsences);

  const interval = eachDayOfInterval({
    start: startOfYear(new Date(year, 0, 1)),
    end: endOfYear(new Date(year, 0, 1)),
  });

  const days: PlannedDay[] = interval.map((d) => {
    const iso = toLocalISO(d);
    let type: PlannedDay['type'] = 'arbeitstag';
    let reason: string | undefined;
    const category: PlannedDay['category'] = 'none';

    if (isWeekend(d)) {
      type = 'wochenende';
    } else if (holidaySet.has(iso)) {
      type = 'feiertag';
    } else if (c.considerSchoolHolidays && schoolSet.has(iso)) {
      type = 'schulferien';
      reason = 'Schulferien';
    }

    if (absSet.has(iso)) {
      type = 'urlaub';
      reason = 'Bereits verplant';
    }

    return { date: iso, type, reason, category };
  });

  const blocked = new Set(absSet);
  const newUrlaub = new Set<string>();
  const budget = { left: Math.max(0, totalDays) };

  const tryTake = (iso: string, reason: string, cat: PlannedDay['category']): boolean => {
    if (budget.left <= 0) return false;
    const d = parseLocalDate(iso);
    if (isWeekend(d) || holidaySet.has(iso)) return false;
    if (blocked.has(iso)) return false;
    if (newUrlaub.has(iso)) return false;
    newUrlaub.add(iso);
    budget.left -= 1;
    const idx = days.findIndex((x) => x.date === iso);
    if (idx >= 0) {
      days[idx] = { date: iso, type: 'urlaub', reason, category: cat };
    }
    return true;
  };

  const useBridges = c.takeBridgeDays || c.priorities.includes('maxDays');
  if (useBridges) {
    for (const bd of collectBridgeDays(year, state)) {
      const iso = toLocalISO(bd);
      tryTake(iso, 'Brückentag', 'brueckentag');
    }
  }

  if (c.mainVacation && c.mainVacation.days >= 3 && c.mainVacation.days <= 21) {
    const reserved = new Set([...blocked, ...newUrlaub]);
    const win = findMainVacationWindow(
      year,
      c.mainVacation.months,
      c.mainVacation.days,
      holidaySet,
      reserved
    );
    if (win) {
      for (const vd of win.dates) {
        tryTake(toLocalISO(vd), 'Haupturlaub', 'haupturlaub');
      }
    }
  }

  const strategies = c.remainingStrategy.length
    ? c.remainingStrategy
    : DEFAULT_CRITERIA.remainingStrategy;

  for (const s of strategies) {
    if (budget.left <= 0) break;
    if (s === 'christmas') {
      applyStrategyChristmas(year, holidaySet, blocked, newUrlaub, budget);
    } else if (s === 'longWeekends') {
      applyLongWeekends(year, holidaySet, blocked, newUrlaub, budget);
    } else if (s === 'recoveryGaps') {
      applyRecoveryGaps(year, holidaySet, blocked, newUrlaub, budget);
    } else if (s === 'schoolHolidays' && c.considerSchoolHolidays) {
      applySchoolHolidaySprinkle(year, state, holidaySet, schoolSet, blocked, newUrlaub, budget);
    }
  }

  for (const iso of newUrlaub) {
    const idx = days.findIndex((x) => x.date === iso);
    if (idx < 0) continue;
    const d = parseLocalDate(iso);
    if (isWeekend(d) || holidaySet.has(iso)) continue;
    if (absSet.has(iso)) continue;
    const cur = days[idx];
    if (cur.reason === 'Brückentag' || cur.reason === 'Haupturlaub') continue;
    const isWeihnacht = d.getMonth() === 11 && d.getDate() >= 24;
    days[idx] = {
      date: iso,
      type: 'urlaub',
      reason: isWeihnacht ? 'Weihnachten' : cur.reason || 'Urlaub',
      category: isWeihnacht ? 'weihnachten' : cur.category !== 'none' ? cur.category : 'kurzurlaub',
    };
  }

  let urlaubCount = 0;
  let feiertage = 0;
  let freie = 0;
  for (const day of days) {
    if (day.type === 'urlaub') urlaubCount += 1;
    if (day.type === 'feiertag') feiertage += 1;
    if (
      day.type === 'wochenende' ||
      day.type === 'feiertag' ||
      day.type === 'urlaub' ||
      day.type === 'schulferien'
    ) {
      freie += 1;
    }
  }

  const newPlannedCount = [...newUrlaub].filter((iso) => !absSet.has(iso)).length;
  const blocks = buildFreeBlocks(days, holidaySet, newUrlaub, absSet, c.considerSchoolHolidays);

  return {
    days,
    urlaubstageGeplant: urlaubCount,
    urlaubstageUebrig: Math.max(0, totalDays - newPlannedCount),
    feiertage,
    freieTagGesamt: freie,
    blocks,
  };
}
