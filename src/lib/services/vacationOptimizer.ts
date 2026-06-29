// src/lib/services/vacationOptimizer.ts
// Service for generating smart vacation suggestions (Brückentag-Optimizer)

import {
  addDays,
  differenceInCalendarDays,
  isAfter,
  isBefore,
  isSameDay,
  isWeekend,
  startOfDay,
  subDays,
  format,
} from 'date-fns';
import { de } from 'date-fns/locale';
import { getGermanHolidays, GermanState } from '@/lib/utils/holidays';

export type VacationSuggestionType = 'brueckentag' | 'kombination' | 'kette' | 'weihnachten';

export interface VacationSuggestion {
  id: string;
  startDate: string; // ISO date
  endDate: string;   // ISO date
  urlaubstage: number;
  freieTage: number;
  effizienz: number;
  feiertag: string;
  feiertagDatum: string; // ISO date of the holiday
  beschreibung: string;
  typ: VacationSuggestionType;
}

export interface VacationOptimizerOptions {
  state: GermanState;
  remainingDays: number;
  existingAbsences: { startDate: Date; endDate: Date }[];
  maxResults?: number;
}

const toISO = (date: Date) => {
  const d = startOfDay(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function dateKey(date: Date) {
  return toISO(date);
}

function isAfterOrEqual(date: Date, compare: Date) {
  return isSameDay(date, compare) || isAfter(date, compare);
}

function isBeforeOrEqual(date: Date, compare: Date) {
  return isSameDay(date, compare) || isBefore(date, compare);
}

function getTomorrow() {
  const today = startOfDay(new Date());
  return addDays(today, 1);
}

function daysBetweenInclusive(start: Date, end: Date) {
  return differenceInCalendarDays(end, start) + 1;
}

function clampToFuture(date: Date, from: Date) {
  return isBefore(date, from) ? from : date;
}

function getWorkingDaysBetween(start: Date, end: Date, holidays: Set<string>) {
  let current = startOfDay(start);
  const last = startOfDay(end);
  let count = 0;

  while (isBeforeOrEqual(current, last)) {
    const key = dateKey(current);
    if (!isWeekend(current) && !holidays.has(key)) {
      count += 1;
    }
    current = addDays(current, 1);
  }

  return count;
}

function buildAbsenceDateSet(absences: { startDate: Date; endDate: Date }[]) {
  const set = new Set<string>();
  absences.forEach((absence) => {
    let current = startOfDay(absence.startDate);
    const end = startOfDay(absence.endDate);
    while (isBeforeOrEqual(current, end)) {
      set.add(dateKey(current));
      current = addDays(current, 1);
    }
  });
  return set;
}

function hasOverlapWithAbsences(
  dateRange: { start: Date; end: Date },
  absenceSet: Set<string>
) {
  let current = startOfDay(dateRange.start);
  const end = startOfDay(dateRange.end);
  while (isBeforeOrEqual(current, end)) {
    if (absenceSet.has(dateKey(current))) {
      return true;
    }
    current = addDays(current, 1);
  }
  return false;
}

function buildFreeRangeFromVacationDays(vacationDays: Date[]) {
  if (vacationDays.length === 0) return null;

  const allDays = vacationDays.map((d) => startOfDay(d));
  const minDay = allDays.reduce((min, cur) => (isBefore(cur, min) ? cur : min), allDays[0]);
  const maxDay = allDays.reduce((max, cur) => (isAfter(cur, max) ? cur : max), allDays[0]);

  // Expand to include adjacent weekends
  let start = minDay;
  while (true) {
    const prev = subDays(start, 1);
    if (isWeekend(prev)) {
      start = prev;
      continue;
    }
    break;
  }

  let end = maxDay;
  while (true) {
    const next = addDays(end, 1);
    if (isWeekend(next)) {
      end = next;
      continue;
    }
    break;
  }

  // Only include days that are part of the free stretch (weekends + holidays)
  // This ensures we don't accidentally include unrelated weekends that are separated by workdays.
  // Since we only expand through adjacent weekends, this is safe.

  return { start, end };
}

export function getVacationSuggestions(options: VacationOptimizerOptions): VacationSuggestion[] {
  const { state, remainingDays, existingAbsences, maxResults = 10 } = options;

  const tomorrow = getTomorrow();
  const nowYear = tomorrow.getFullYear();

  // Collect holidays for current year and next year until March (3 months)
  const currentYear = nowYear;
  const nextYear = nowYear + 1;
  const maxDate = new Date(nextYear, 2, 31); // March 31st of next year

  const holidays = [
    ...getGermanHolidays(currentYear, state),
    ...getGermanHolidays(nextYear, state),
  ]
    .map((h) => ({ ...h, date: startOfDay(h.date) }))
    .filter((h) => isAfterOrEqual(h.date, tomorrow) && isBeforeOrEqual(h.date, maxDate));

  const holidaySet = new Set(holidays.map((h) => dateKey(h.date)));

  const absenceSet = buildAbsenceDateSet(existingAbsences);

  const suggestions: VacationSuggestion[] = [];

  const addSuggestion = (suggestion: VacationSuggestion) => {
    if (suggestion.urlaubstage <= 0) return;
    if (suggestion.urlaubstage > remainingDays) return;
    if (suggestion.freieTage < suggestion.urlaubstage) return;
    if (hasOverlapWithAbsences({ start: new Date(suggestion.startDate), end: new Date(suggestion.endDate) }, absenceSet)) {
      return;
    }
    suggestions.push(suggestion);
  };

  const formatDate = (date: Date) => format(date, 'EEEE, dd. MMMM yyyy', { locale: de });
  const formatShort = (date: Date) => format(date, 'EEE, dd. MMM', { locale: de });

  // --- A) Einzelne Brückentage ---
  holidays.forEach((holiday) => {
    const weekday = holiday.date.getDay();

    // Feiertag am Donnerstag -> Freitag frei
    if (weekday === 4) {
      const vacationDay = addDays(holiday.date, 1);
      if (isWeekend(vacationDay) || holidaySet.has(dateKey(vacationDay))) return;
      if (!isAfterOrEqual(vacationDay, tomorrow)) return;

      const freeRange = buildFreeRangeFromVacationDays([vacationDay, holiday.date]);
      if (!freeRange) return;

      const urlaubstage = 1;
      const freieTage = daysBetweenInclusive(freeRange.start, freeRange.end);
      const effizienz = freieTage / urlaubstage;

      addSuggestion({
        id: `brueckentag-${dateKey(holiday.date)}-fri`,
        startDate: toISO(freeRange.start),
        endDate: toISO(freeRange.end),
        urlaubstage,
        freieTage,
        effizienz,
        feiertag: holiday.name,
        feiertagDatum: toISO(holiday.date),
        beschreibung: `Nimm ${formatShort(vacationDay)} frei`,
        typ: 'brueckentag',
      });
    }

    // Feiertag am Dienstag -> Montag frei
    if (weekday === 2) {
      const vacationDay = subDays(holiday.date, 1);
      if (isWeekend(vacationDay) || holidaySet.has(dateKey(vacationDay))) return;
      if (!isAfterOrEqual(vacationDay, tomorrow)) return;

      const freeRange = buildFreeRangeFromVacationDays([vacationDay, holiday.date]);
      if (!freeRange) return;

      const urlaubstage = 1;
      const freieTage = daysBetweenInclusive(freeRange.start, freeRange.end);
      const effizienz = freieTage / urlaubstage;

      addSuggestion({
        id: `brueckentag-${dateKey(holiday.date)}-mon`,
        startDate: toISO(freeRange.start),
        endDate: toISO(freeRange.end),
        urlaubstage,
        freieTage,
        effizienz,
        feiertag: holiday.name,
        feiertagDatum: toISO(holiday.date),
        beschreibung: `Nimm ${formatShort(vacationDay)} frei`,
        typ: 'brueckentag',
      });
    }
  });

  // --- B) Kombinationsvorschläge ---
  holidays.forEach((holiday) => {
    const weekday = holiday.date.getDay();

    // Feiertag am Donnerstag -> Mo-Mi + Fr frei (4 Urlaubstage)
    if (weekday === 4) {
      const vacationDays = [
        subDays(holiday.date, 3), // Mo
        subDays(holiday.date, 2), // Di
        subDays(holiday.date, 1), // Mi
        addDays(holiday.date, 1), // Fr
      ];

      if (vacationDays.some((d) => isWeekend(d) || holidaySet.has(dateKey(d)))) return;
      if (vacationDays.some((d) => !isAfterOrEqual(d, tomorrow))) return;

      const freeRange = buildFreeRangeFromVacationDays([...vacationDays, holiday.date]);
      if (!freeRange) return;

      const urlaubstage = vacationDays.length;
      const freieTage = daysBetweenInclusive(freeRange.start, freeRange.end);
      const effizienz = freieTage / urlaubstage;

      addSuggestion({
        id: `kombination-${dateKey(holiday.date)}-thu`,
        startDate: toISO(freeRange.start),
        endDate: toISO(freeRange.end),
        urlaubstage,
        freieTage,
        effizienz,
        feiertag: holiday.name,
        feiertagDatum: toISO(holiday.date),
        beschreibung: `Nimm ${formatShort(vacationDays[0])}–${formatShort(vacationDays[3])} frei`,
        typ: 'kombination',
      });
    }

    // Feiertag am Mittwoch -> Mo+Di frei OR Do+Fr frei (jeweils 2 Urlaubstage)
    if (weekday === 3) {
      const optionA = [subDays(holiday.date, 2), subDays(holiday.date, 1)]; // Mo+Di
      const optionB = [addDays(holiday.date, 1), addDays(holiday.date, 2)]; // Do+Fr

      [optionA, optionB].forEach((vacationDays, index) => {
        if (vacationDays.some((d) => isWeekend(d) || holidaySet.has(dateKey(d)))) return;
        if (vacationDays.some((d) => !isAfterOrEqual(d, tomorrow))) return;

        const freeRange = buildFreeRangeFromVacationDays([...vacationDays, holiday.date]);
        if (!freeRange) return;

        const urlaubstage = vacationDays.length;
        const freieTage = daysBetweenInclusive(freeRange.start, freeRange.end);
        const effizienz = freieTage / urlaubstage;

        addSuggestion({
          id: `kombination-${dateKey(holiday.date)}-${index === 0 ? 'mo-di' : 'do-fr'}`,
          startDate: toISO(freeRange.start),
          endDate: toISO(freeRange.end),
          urlaubstage,
          freieTage,
          effizienz,
          feiertag: holiday.name,
          feiertagDatum: toISO(holiday.date),
          beschreibung: index === 0
            ? `Nimm ${formatShort(vacationDays[0])} & ${formatShort(vacationDays[1])} frei`
            : `Nimm ${formatShort(vacationDays[0])} & ${formatShort(vacationDays[1])} frei`,
          typ: 'kombination',
        });
      });
    }
  });

  // --- C) Kettenbildung (clusterbasiert, inkl. Weihnachten/Neujahr automatisch) ---
  const sortedHolidays = holidays.sort((a, b) => a.date.getTime() - b.date.getTime());

  const clusters: typeof sortedHolidays[] = [];
  let currentCluster: typeof sortedHolidays = [];

  sortedHolidays.forEach((holiday, index) => {
    if (currentCluster.length === 0) {
      currentCluster.push(holiday);
      return;
    }

    const previous = currentCluster[currentCluster.length - 1];
    const delta = differenceInCalendarDays(holiday.date, previous.date);

    if (delta <= 12) {
      currentCluster.push(holiday);
    } else {
      clusters.push(currentCluster);
      currentCluster = [holiday];
    }

    if (index === sortedHolidays.length - 1 && currentCluster.length > 0) {
      clusters.push(currentCluster);
    }
  });

  clusters.forEach((cluster) => {
    if (cluster.length < 2) return;

    const first = cluster[0];
    const last = cluster[cluster.length - 1];

    const clusterStart = first.date;
    const clusterEnd = last.date;

    let expandedStart = clusterStart;
    let expandedEnd = clusterEnd;

    if (clusterStart.getDay() === 1) {
      expandedStart = subDays(clusterStart, 2);
    }

    if (clusterEnd.getDay() === 5) {
      expandedEnd = addDays(clusterEnd, 2);
    }

    const minimalStart = addDays(clusterStart, 1);
    const minimalEnd = subDays(clusterEnd, 1);
    const minimalVacationDays = getWorkingDaysBetween(minimalStart, minimalEnd, holidaySet);
    const minimalFreeDays = daysBetweenInclusive(clusterStart, clusterEnd);
    const minimalEfficiency = minimalVacationDays > 0 ? minimalFreeDays / minimalVacationDays : 0;

    const maximalVacationDays = getWorkingDaysBetween(expandedStart, expandedEnd, holidaySet);
    const maximalFreeDays = daysBetweenInclusive(expandedStart, expandedEnd);
    const maximalEfficiency = maximalVacationDays > 0 ? maximalFreeDays / maximalVacationDays : 0;

    const possibleVariants = [] as Array<{
      id: string;
      start: Date;
      end: Date;
      urlaubstage: number;
      freieTage: number;
      effizienz: number;
      label: string;
    }>;

    if (
      minimalVacationDays > 0 &&
      minimalVacationDays <= remainingDays &&
      minimalVacationDays <= 8 &&
      isAfterOrEqual(minimalStart, tomorrow) &&
      !hasOverlapWithAbsences({ start: minimalStart, end: minimalEnd }, absenceSet)
    ) {
      possibleVariants.push({
        id: `kette-cluster-minimal-${dateKey(clusterStart)}-${dateKey(clusterEnd)}`,
        start: minimalStart,
        end: minimalEnd,
        urlaubstage: minimalVacationDays,
        freieTage: minimalFreeDays,
        effizienz: minimalEfficiency,
        label: `Kette: ${first.name} bis ${last.name} (minimal)`,
      });
    }

    if (
      maximalVacationDays > 0 &&
      maximalVacationDays <= remainingDays &&
      maximalVacationDays <= 8 &&
      isAfterOrEqual(expandedStart, tomorrow) &&
      !hasOverlapWithAbsences({ start: expandedStart, end: expandedEnd }, absenceSet)
    ) {
      possibleVariants.push({
        id: `kette-cluster-maximal-${dateKey(clusterStart)}-${dateKey(clusterEnd)}`,
        start: expandedStart,
        end: expandedEnd,
        urlaubstage: maximalVacationDays,
        freieTage: maximalFreeDays,
        effizienz: maximalEfficiency,
        label: `Kette: ${first.name} bis ${last.name} (maximal)`,
      });
    }

    if (possibleVariants.length === 0) return;

    let bestVariant = possibleVariants[0];
    if (possibleVariants.length === 2) {
      const [a, b] = possibleVariants;
      if (a.effizienz > b.effizienz) {
        bestVariant = a;
      } else if (b.effizienz > a.effizienz) {
        bestVariant = b;
      } else {
        bestVariant = a.freieTage >= b.freieTage ? a : b;
      }
    }

    addSuggestion({
      id: bestVariant.id,
      startDate: toISO(bestVariant.start),
      endDate: toISO(bestVariant.end),
      urlaubstage: bestVariant.urlaubstage,
      freieTage: bestVariant.freieTage,
      effizienz: bestVariant.effizienz,
      feiertag: `${first.name} … ${last.name}`,
      feiertagDatum: toISO(clusterStart),
      beschreibung: bestVariant.label,
      typ: 'kette',
    });
  });

  // Sort by efficiency descending
  const sorted = suggestions
    .sort((a, b) => b.effizienz - a.effizienz)
    .slice(0, maxResults);

  return sorted;
}
