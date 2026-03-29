// src/lib/services/vacationOptimizer.ts
// Smart vacation suggestion engine (Brückentag-Optimizer)

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

// ---------- Types ----------

export type VacationSuggestionType = 'brueckentag' | 'kombination' | 'cluster';

export interface VacationSuggestion {
  id: string;
  startDate: string;
  endDate: string;
  urlaubstage: number;
  freieTage: number;
  effizienz: number;
  sterne: number;
  feiertag: string;
  beschreibung: string;
  typ: VacationSuggestionType;
  urlaubstageDetails: string[];
  feiertageImZeitraum: string[];
}

export interface VacationOptimizerOptions {
  state: GermanState;
  remainingDays: number;
  existingAbsences: { startDate: Date; endDate: Date }[];
  maxResults?: number;
}

// ---------- Utilities ----------

function toLocalISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function gte(a: Date, b: Date) { return isSameDay(a, b) || isAfter(a, b); }
function lte(a: Date, b: Date) { return isSameDay(a, b) || isBefore(a, b); }

function daysInclusive(start: Date, end: Date) {
  return differenceInCalendarDays(end, start) + 1;
}

function fmtShort(date: Date) {
  return format(date, 'EEEEEE dd. MMM', { locale: de });
}

function stars(eff: number): number {
  if (eff >= 3.5) return 5;
  if (eff >= 2.5) return 4;
  if (eff >= 2.0) return 3;
  if (eff >= 1.5) return 2;
  return 1;
}

function buildAbsenceSet(absences: { startDate: Date; endDate: Date }[]) {
  const s = new Set<string>();
  for (const a of absences) {
    let c = startOfDay(a.startDate);
    const e = startOfDay(a.endDate);
    while (lte(c, e)) { s.add(toLocalISO(c)); c = addDays(c, 1); }
  }
  return s;
}

function overlaps(start: Date, end: Date, absSet: Set<string>) {
  let c = startOfDay(start);
  const e = startOfDay(end);
  while (lte(c, e)) {
    if (absSet.has(toLocalISO(c))) return true;
    c = addDays(c, 1);
  }
  return false;
}

function workingDaysBetweenExclusive(a: Date, b: Date, hSet: Set<string>) {
  const start = addDays(a, 1);
  const end = subDays(b, 1);
  if (isAfter(start, end)) return 0;
  let count = 0;
  let c = startOfDay(start);
  while (lte(c, end)) {
    if (!isWeekend(c) && !hSet.has(toLocalISO(c))) count++;
    c = addDays(c, 1);
  }
  return count;
}

function getVacDaysInRange(start: Date, end: Date, hSet: Set<string>): Date[] {
  const result: Date[] = [];
  let c = startOfDay(start);
  while (lte(c, end)) {
    if (!isWeekend(c) && !hSet.has(toLocalISO(c))) result.push(c);
    c = addDays(c, 1);
  }
  return result;
}

function expandWeekends(start: Date, end: Date) {
  let s = startOfDay(start);
  let e = startOfDay(end);
  while (isWeekend(subDays(s, 1))) s = subDays(s, 1);
  while (isWeekend(addDays(e, 1))) e = addDays(e, 1);
  return { start: s, end: e };
}

// ---------- Main ----------

export function getVacationSuggestions(options: VacationOptimizerOptions): VacationSuggestion[] {
  const { state, remainingDays, existingAbsences, maxResults = 10 } = options;

  const tomorrow = addDays(startOfDay(new Date()), 1);
  const year = tomorrow.getFullYear();
  const maxDate = new Date(year + 1, 2, 31);

  const holidays = [
    ...getGermanHolidays(year, state),
    ...getGermanHolidays(year + 1, state),
  ]
    .map(h => ({ ...h, date: startOfDay(h.date) }))
    .filter(h => gte(h.date, tomorrow) && lte(h.date, maxDate))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const hSet = new Set(holidays.map(h => toLocalISO(h.date)));
  const absSet = buildAbsenceSet(existingAbsences);
  const suggestions: VacationSuggestion[] = [];
  const coveredDates = new Map<string, number>();

  function tryAdd(s: VacationSuggestion, vacDays: Date[], freeStart: Date, freeEnd: Date): boolean {
    if (s.urlaubstage <= 0 || s.urlaubstage > remainingDays) return false;
    if (s.freieTage < s.urlaubstage || s.effizienz < 1.5) return false;
    if (vacDays.some(d => !gte(d, tomorrow))) return false;
    if (overlaps(freeStart, freeEnd, absSet)) return false;
    suggestions.push(s);
    return true;
  }

  // ---- KATEGORIE 1: BRÜCKENTAGE (1 Tag → 4 frei) ----

  for (const h of holidays) {
    const wd = h.date.getDay();
    let vDay: Date | null = null;
    let fStart: Date;
    let fEnd: Date;

    if (wd === 1) {        // Mo: Fr davor frei
      vDay = subDays(h.date, 3);
      fStart = vDay; fEnd = h.date;
    } else if (wd === 2) { // Di: Mo frei
      vDay = subDays(h.date, 1);
      fStart = subDays(vDay, 2); fEnd = h.date;
    } else if (wd === 4) { // Do: Fr frei
      vDay = addDays(h.date, 1);
      fStart = h.date; fEnd = addDays(vDay, 2);
    } else if (wd === 5) { // Fr: Mo danach frei
      vDay = addDays(h.date, 3);
      fStart = h.date; fEnd = vDay;
    }

    if (!vDay) continue;
    if (isWeekend(vDay) || hSet.has(toLocalISO(vDay))) continue;

    const sug: VacationSuggestion = {
      id: `brueckentag-${toLocalISO(h.date)}`,
      startDate: toLocalISO(fStart!), endDate: toLocalISO(fEnd!),
      urlaubstage: 1, freieTage: 4, effizienz: 4.0, sterne: 5,
      feiertag: h.name,
      beschreibung: `Nimm ${fmtShort(vDay)} frei`,
      typ: 'brueckentag',
      urlaubstageDetails: [fmtShort(vDay)],
      feiertageImZeitraum: [`${fmtShort(h.date)} – ${h.name}`],
    };

    if (tryAdd(sug, [vDay], fStart!, fEnd!)) {
      coveredDates.set(toLocalISO(h.date), 4.0);
    }
  }

  // ---- KATEGORIE 2: VERLÄNGERTE WOCHE ----

  for (const h of holidays) {
    const wd = h.date.getDay();

    if (wd === 3) {
      // Mittwoch: 2 Optionen je 2 Urlaubstage → 5 Tage
      const opts: Array<{ vd: Date[]; s: Date; e: Date; label: string }> = [
        { vd: [subDays(h.date, 2), subDays(h.date, 1)], s: subDays(h.date, 4), e: h.date, label: 'A' },
        { vd: [addDays(h.date, 1), addDays(h.date, 2)], s: h.date, e: addDays(h.date, 4), label: 'B' },
      ];
      for (const o of opts) {
        if (o.vd.some(d => isWeekend(d) || hSet.has(toLocalISO(d)))) continue;
        const eff = daysInclusive(o.s, o.e) / o.vd.length;
        tryAdd({
          id: `kombination-${toLocalISO(h.date)}-${o.label}`,
          startDate: toLocalISO(o.s), endDate: toLocalISO(o.e),
          urlaubstage: o.vd.length, freieTage: daysInclusive(o.s, o.e),
          effizienz: eff, sterne: stars(eff),
          feiertag: h.name,
          beschreibung: `Nimm ${o.vd.map(fmtShort).join(' + ')} frei`,
          typ: 'kombination',
          urlaubstageDetails: o.vd.map(fmtShort),
          feiertageImZeitraum: [`${fmtShort(h.date)} – ${h.name}`],
        }, o.vd, o.s, o.e);
      }
      continue;
    }

    // Mo/Di/Do/Fr: 4 Urlaubstage → 9 Tage
    let vDays: Date[];
    let fS: Date;
    let fE: Date;

    if (wd === 1) {
      vDays = [addDays(h.date, 1), addDays(h.date, 2), addDays(h.date, 3), addDays(h.date, 4)];
      fS = subDays(h.date, 2); fE = addDays(h.date, 6);
    } else if (wd === 2) {
      vDays = [subDays(h.date, 1), addDays(h.date, 1), addDays(h.date, 2), addDays(h.date, 3)];
      fS = subDays(h.date, 3); fE = addDays(h.date, 5);
    } else if (wd === 4) {
      vDays = [subDays(h.date, 3), subDays(h.date, 2), subDays(h.date, 1), addDays(h.date, 1)];
      fS = subDays(h.date, 5); fE = addDays(h.date, 3);
    } else if (wd === 5) {
      vDays = [subDays(h.date, 4), subDays(h.date, 3), subDays(h.date, 2), subDays(h.date, 1)];
      fS = subDays(h.date, 6); fE = addDays(h.date, 2);
    } else {
      continue;
    }

    if (vDays.some(d => isWeekend(d) || hSet.has(toLocalISO(d)))) continue;

    const freieTage = daysInclusive(fS, fE);
    const eff = freieTage / vDays.length;

    tryAdd({
      id: `kombination-${toLocalISO(h.date)}`,
      startDate: toLocalISO(fS), endDate: toLocalISO(fE),
      urlaubstage: vDays.length, freieTage, effizienz: eff, sterne: stars(eff),
      feiertag: h.name,
      beschreibung: `Nimm ${fmtShort(vDays[0])}–${fmtShort(vDays[vDays.length - 1])} frei`,
      typ: 'kombination',
      urlaubstageDetails: vDays.map(fmtShort),
      feiertageImZeitraum: [`${fmtShort(h.date)} – ${h.name}`],
    }, vDays, fS, fE);
  }

  // ---- KATEGORIE 3: FEIERTAGS-CLUSTER ----

  const clusters: (typeof holidays)[] = [];
  let cur: typeof holidays = [];

  for (const h of holidays) {
    if (cur.length === 0) { cur.push(h); continue; }
    const gap = workingDaysBetweenExclusive(cur[cur.length - 1].date, h.date, hSet);
    if (gap <= 5) { cur.push(h); } else { clusters.push(cur); cur = [h]; }
  }
  if (cur.length > 0) clusters.push(cur);

  console.log('[VacationOptimizer] Clusters found:', clusters.map(c => ({
    holidays: c.map(h => `${toLocalISO(h.date)} ${h.name}`),
    count: c.length,
  })));

  for (const cluster of clusters) {
    if (cluster.length < 2) continue;

    const first = cluster[0];
    const last = cluster[cluster.length - 1];
    const { start: eS, end: eE } = expandWeekends(first.date, last.date);

    const vacDays = getVacDaysInRange(eS, eE, hSet);

    console.log(`[VacationOptimizer] Cluster ${first.name}–${last.name}:`, {
      expanded: `${toLocalISO(eS)} to ${toLocalISO(eE)}`,
      vacDaysNeeded: vacDays.length,
      freieTage: daysInclusive(eS, eE),
      remainingDays,
    });

    if (vacDays.length === 0 || vacDays.length > 6 || vacDays.length > remainingDays) continue;

    const freieTage = daysInclusive(eS, eE);
    const eff = freieTage / vacDays.length;

    if (overlaps(eS, eE, absSet)) continue;
    if (vacDays.some(d => !gte(d, tomorrow))) continue;

    const feiertageImZeitraum = cluster.map(h => `${fmtShort(h.date)} – ${h.name}`);

    tryAdd({
      id: `cluster-${toLocalISO(first.date)}-${toLocalISO(last.date)}`,
      startDate: toLocalISO(eS), endDate: toLocalISO(eE),
      urlaubstage: vacDays.length, freieTage, effizienz: eff, sterne: stars(eff),
      feiertag: cluster.map(h => h.name).join(', '),
      beschreibung: `${first.name} bis ${last.name}: nimm ${vacDays.map(d => format(d, 'dd. MMM', { locale: de })).join(', ')} frei`,
      typ: 'cluster',
      urlaubstageDetails: vacDays.map(fmtShort),
      feiertageImZeitraum,
    }, vacDays, eS, eE);
  }

  // ---- FILTER SUBSETS (DEDUPLIKATION) ----
  // Wenn ein Cluster [A, B, C] gefunden wurde, entferne isolierte Brückentage für [A] oder [B].
  // Das verhindert, dass Brückentage den Cluster verdrängen (da Brückentage meist 5 Sterne haben).
  const deduplicated: VacationSuggestion[] = [];
  for (let i = 0; i < suggestions.length; i++) {
    const sug = suggestions[i];
    const isSubset = suggestions.some((other, j) => {
      if (i === j) return false;
      // other muss mehr Feiertage abdecken als sug, ODER bei gleicher Anzahl mehr freie Tage bringen
      const coversAll = sug.feiertageImZeitraum.every(f => other.feiertageImZeitraum.includes(f));
      if (!coversAll) return false;
      
      // Wenn other alle Feiertage von sug abdeckt:
      if (other.feiertageImZeitraum.length > sug.feiertageImZeitraum.length) return true; // Other ist echter Superset (z.B. Cluster vs Brückentag)
      
      // Gleich viele Feiertage: Behalte das mit mehr freien Tagen (oder bei Gleichstand besserer Effizienz)
      if (other.freieTage > sug.freieTage) return true;
      if (other.freieTage === sug.freieTage && other.effizienz > sug.effizienz) return true;
      if (other.freieTage === sug.freieTage && other.effizienz === sug.effizienz && i > j) return true; // Tie-breaker

      return false;
    });

    if (!isSubset) {
      deduplicated.push(sug);
    }
  }

  // ---- Smart Score Sorting ----
  // Mathematische Effizienz allein reicht nicht, da "1 Urlaubstag -> 4 freie Tage" (4.0) 
  // einen gigantischen 13-Tage-Cluster (Effizienz 2.16) nach unten drücken würde.
  // Wir nutzen einen Smart Score: (Freie Tage * Effizienz), um große Blöcke massiv zu bevorzugen!

  return deduplicated
    .filter(s => s.sterne >= 2)
    .map(s => ({ ...s, smartScore: s.freieTage * s.effizienz }))
    .sort((a, b) => {
      const diff = b.smartScore - a.smartScore;
      if (Math.abs(diff) > 0.1) return diff;
      return a.startDate.localeCompare(b.startDate);
    })
    .map(({ smartScore, ...s }) => s) // Cleanup internal property
    .slice(0, maxResults);
}
