// src/lib/services/proactiveSuggestions.ts
// Proactive Engine für intelligente Urlaubsempfehlungen

import { 
  addDays, 
  addWeeks, 
  subWeeks, 
  startOfWeek, 
  endOfWeek, 
  isWithinInterval, 
  differenceInWeeks,
  isWeekend,
  eachDayOfInterval,
  format,
  startOfToday
} from 'date-fns';
import { de } from 'date-fns/locale';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Absence from '@/models/Absence';
import { getGermanHolidays, GermanState } from '@/lib/utils/holidays';
import { parseLocalDate, toLocalISO } from '@/lib/utils/localDate';
import { getCalendarEvents } from '@/lib/graph-client';

export interface SignalResult {
  active: boolean;
  weight: number;          // 0-1
  message: string;         // Deutscher Text für die UI
  data?: any;              // Signal-spezifische Daten
}

export interface ProactiveSuggestion {
  id: string;
  startDate: string;       // gesamter freier Zeitraum Start
  endDate: string;         // gesamter freier Zeitraum Ende
  vacationStart: string;   // Erster echter Urlaubstag (für Link)
  vacationEnd: string;     // Letzter echter Urlaubstag (für Link)
  urlaubstage: number;     // Wie viele Urlaubstage der User nehmen muss
  freieTage: number;       // Wie viele Tage frei insgesamt
  headline: string;        // "10 Tage frei über Ostern"
  reason: string;          // EINE flüssige, professionelle Empfehlung
  signals: {
    teamAvailable: SignalResult;
    holidayNearby: SignalResult;
    needsRecovery: SignalResult;
    calendarFree: SignalResult;
  };
  score: number;           // Interner Score (wird in UI versteckt)
  badges: string[];        // ["Team vollzählig", "Ostern", ...]
}

const WEIGHTS = {
  teamAvailable: 0.30,
  holidayNearby: 0.30,
  needsRecovery: 0.25,
  calendarFree: 0.15,
};

/**
 * Generiert EINE personalisierte Urlaubsempfehlung basierend auf 4 Signalen.
 */
export async function getProactiveSuggestion(
  userId: string,
  userEmail: string,
  department: string,
  state: GermanState,
  remainingDays: number
): Promise<ProactiveSuggestion | null> {
  await connectDB();
  const today = startOfToday();

  console.log('[SmartSuggestions] Input:', { userId, userEmail, department, state, remainingDays });


  // 1. SIGNAL — Team-Verfügbarkeit (30%)
  const teamAvailable = await checkTeamAvailability(department, today);

  // 2. SIGNAL — Feiertage in der Nähe (30%)
  const holidayNearby = checkHolidayNearby(state, today);

  // 3. SIGNAL — Erholungsbedarf (25%)
  const needsRecovery = await checkRecoveryNeed(userEmail, today);

  // 4. SIGNAL — Kalender-Dichte (15%)
  const calendarFree = await checkCalendarDensity(userId, userEmail, today);

  console.log('[SmartSuggestions] Signal 1 (Team):', teamAvailable);
  console.log('[SmartSuggestions] Signal 2 (Holiday):', holidayNearby);
  console.log('[SmartSuggestions] Signal 3 (Recovery):', needsRecovery);
  console.log('[SmartSuggestions] Signal 4 (Calendar):', calendarFree);


  // SCORE BERECHNEN
  let totalScore = 0;
  if (teamAvailable.active) totalScore += teamAvailable.weight * 100;
  if (holidayNearby.active) totalScore += holidayNearby.weight * 100;
  if (needsRecovery.active) totalScore += needsRecovery.weight * 100;
  if (calendarFree.active) totalScore += calendarFree.weight * 100;

  // Wenn kein Signal aktiv → kein Vorschlag
  if (totalScore === 0) {
    console.log('[SmartSuggestions] Score:', totalScore, 'Suggestion: null (no active signals)');
    return null;
  }


  // ZEITRAUM BESTIMMEN
  let start: Date;
  let end: Date;

  if (holidayNearby.active && holidayNearby.data?.range) {
    // Basis: Feiertag / Brückentag
    start = holidayNearby.data.range.start;
    end = holidayNearby.data.range.end;
  } else if (teamAvailable.active && teamAvailable.data?.weekStart) {
    // Basis: Woche wo Team vollzählig ist
    start = teamAvailable.data.weekStart;
    end = teamAvailable.data.weekEnd;
  } else if (calendarFree.active && calendarFree.data?.weekStart) {
    // Basis: Woche mit wenig Terminen
    start = calendarFree.data.weekStart;
    end = calendarFree.data.weekEnd;
  } else {
    // Fallback: Nächstes Wochenende + 1 Tag
    start = addDays(today, (12 - today.getDay()) % 7); // Nächster Freitag oder Montag
    end = addDays(start, 0);
  }

  // URLAUBSTAGE BERECHNEN (Arbeitstage)
  const range = eachDayOfInterval({ start, end });
  const holidaysInPeriod = getGermanHolidays(start.getFullYear(), state);
  
  const workDaysInRange = range.filter(d => {
    if (isWeekend(d)) return false;
    const isPublicHoliday = holidaysInPeriod.some(h => 
      format(h.date, 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd')
    );
    return !isPublicHoliday;
  });

  const urlaubstage = workDaysInRange.length;
  const freieTage = range.length;

  // Erster und letzter echter Urlaubstag für den Link
  const vacationStart = workDaysInRange.length > 0 ? workDaysInRange[0] : start;
  const vacationEnd = workDaysInRange.length > 0 ? workDaysInRange[workDaysInRange.length - 1] : end;

  // Prüfen ob Resturlaub reicht
  if (urlaubstage > remainingDays || urlaubstage < 1) {
    console.log('[SmartSuggestions] REJECTED: remainingDays =', remainingDays, 'urlaubstage needed =', urlaubstage);
    return null;
  }


  // HEADLINE & PROFESSIONELLER TEXT
  let headline = "";
  let reason = "";

  if (holidayNearby.active) {
    headline = `${freieTage} Tage frei über ${holidayNearby.data?.badge || 'die Feiertage'}`;
    reason = `${holidayNearby.data?.badge || 'Die Feiertage'} bieten dir die perfekte Gelegenheit: Mit nur ${urlaubstage} Urlaubstagen hast du ${freieTage} freie Tage am Stück. `;
    if (teamAvailable.active) reason += "Dein Team ist vollzählig ";
    if (teamAvailable.active && calendarFree.active) reason += "und ";
    if (calendarFree.active) reason += "dein Kalender ist frei ";
    if (teamAvailable.active || calendarFree.active) reason += "— idealer Zeitpunkt.";
  } else {
    headline = `${freieTage} Tage Auszeit im ${format(start, 'MMMM', { locale: de })}`;
    reason = `Gute Nachrichten für deine nächste Auszeit: `;
    if (teamAvailable.active) reason += "Dein Team ist vollzählig ";
    if (teamAvailable.active && calendarFree.active) reason += "und ";
    if (calendarFree.active) reason += "dein Kalender ist entspannt ";
    reason += "— perfekt für eine kurze Pause.";
    
    if (needsRecovery.active && reason.length < 100) {
      reason += ` Du warst seit über 6 Wochen nicht mehr im Urlaub, Zeit für neue Energie!`;
    }
  }

  const badges = [];
  if (teamAvailable.active) badges.push("Team vollzählig");
  if (holidayNearby.active) badges.push(holidayNearby.data?.badge || "Feiertag");
  if (needsRecovery.active) {
      // Wochen aus data holen falls vorhanden, sonst generic
      badges.push("Erholung nötig");
  }
  if (calendarFree.active) badges.push("Kalender frei");

  const suggestion: ProactiveSuggestion = {
    id: `ps-${toLocalISO(start)}`,
    startDate: toLocalISO(start),
    endDate: toLocalISO(end),
    vacationStart: toLocalISO(vacationStart),
    vacationEnd: toLocalISO(vacationEnd),
    urlaubstage,
    freieTage,
    headline,
    reason,
    signals: {
      teamAvailable,
      holidayNearby,
      needsRecovery,
      calendarFree
    },
    score: Math.round(totalScore),
    badges: Array.from(new Set(badges)) // Dubletten vermeiden
  };

  console.log('[SmartSuggestions] Score:', Math.round(totalScore), 'Suggestion: generated');
  return suggestion;
}


/**
 * Signal 1: Prüft Team-Verfügbarkeit der nächsten 4 Wochen.
 */
async function checkTeamAvailability(department: string, today: Date): Promise<SignalResult> {
  const result: SignalResult = { active: false, weight: WEIGHTS.teamAvailable, message: '' };
  
  try {
    const team = await User.find({ department, isActive: true }).select('email');
    const teamSize = team.length;
    if (teamSize === 0) return result;

    const startDate = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });
    const endDate = endOfWeek(addWeeks(today, 4), { weekStartsOn: 1 });

    const absences = await Absence.find({
      status: 'approved',
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
      userEmail: { $in: team.map(u => u.email) }
    });

    // Prüfe jede der 4 Wochen
    for (let i = 1; i <= 4; i++) {
      const wStart = startOfWeek(addWeeks(today, i), { weekStartsOn: 1 });
      const wEnd = endOfWeek(wStart, { weekStartsOn: 1 });
      const weekNum = format(wStart, 'I');

      const absentEmails = new Set(
        absences
          .filter(a => isWithinInterval(a.startDate, { start: wStart, end: wEnd }) || 
                       isWithinInterval(a.endDate, { start: wStart, end: wEnd }))
          .map(a => a.userEmail)
      );

      const availableCount = teamSize - absentEmails.size;
      const availabilityRate = availableCount / teamSize;

      if (availabilityRate >= 0.8) {
        result.active = true;
        result.message = availabilityRate === 1 
          ? `Dein Team ist in KW ${weekNum} vollzählig` 
          : `Dein Team ist in KW ${weekNum} fast vollzählig (${availableCount}/${teamSize})`;
        result.data = { weekStart: wStart, weekEnd: wEnd, badge: `${availableCount}/${teamSize} da` };
        return result; 
      }
    }
  } catch (e) {
    console.error('Error in checkTeamAvailability:', e);
  }
  return result;
}

/**
 * Signal 2: Prüft Feiertage der nächsten 21 Tage und berechnet Brückentage.
 */
function checkHolidayNearby(state: GermanState, today: Date): SignalResult {
  const result: SignalResult = { active: false, weight: WEIGHTS.holidayNearby, message: '' };
  const holidays = getGermanHolidays(today.getFullYear(), state);
  const next21Days = addDays(today, 21);

  const foundHoliday = holidays.find(h => 
    isAfter(h.date, today) && isBefore(h.date, next21Days)
  );

  if (!foundHoliday) return result;

  const hDate = foundHoliday.date;
  const dayOfWeek = hDate.getDay(); // 0=So, 1=Mo, ... 4=Do, 5=Fr, 6=Sa

  // Brückentag-Logik (NEU: Dynamische Block-Erweiterung)
  
  const isFreeDay = (d: Date) => {
    if (isWeekend(d)) return true;
    return holidays.some(h => format(h.date, 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd'));
  };

  const expandFreeBlock = (baseDate: Date) => {
    let start = baseDate;
    let end = baseDate;
    while (isFreeDay(addDays(start, -1))) start = addDays(start, -1);
    while (isFreeDay(addDays(end, 1))) end = addDays(end, 1);
    return { start, end };
  };

  const baseBlock = expandFreeBlock(hDate);
  const blockLength = eachDayOfInterval(baseBlock).length;
  const lastDayOfBlock = baseBlock.end;
  const dayOfWeekLast = lastDayOfBlock.getDay();

  let suggestedRange: { start: Date; end: Date } | null = null;

  // Strategie: Wenn der Block 1-4 Tage lang ist, hänge Arbeitstage an
  if (blockLength >= 1) {
    if (dayOfWeekLast === 1) { // Block endet am Montag (z.B. Ostermontag)
      // Nimm Di-Fr frei -> Bis Sonntag danach (10 Tage am Stück)
      suggestedRange = { start: baseBlock.start, end: endOfWeek(addDays(lastDayOfBlock, 4), { weekStartsOn: 1 }) };
    } else if (dayOfWeekLast === 4) { // Block endet am Donnerstag (Feiertag)
      // Nimm Freitag frei -> Bis Sonntag (4 Tage am Stück)
      suggestedRange = { start: baseBlock.start, end: endOfWeek(lastDayOfBlock, { weekStartsOn: 1 }) };
    } else if (dayOfWeekLast === 2) { // Block endet am Dienstag (Feiertag)
      // Nimm Montag davor frei -> Ab Samstag davor (4 Tage am Stück)
      suggestedRange = { start: startOfWeek(baseBlock.start, { weekStartsOn: 1 }), end: baseBlock.end };
    } else if (dayOfWeekLast === 5) { // Block endet am Freitag (Feiertag / Karfreitag)
      // Nimm Montag danach frei -> Bis Sonntag danach (4 Tage am Stück)
      suggestedRange = { start: baseBlock.start, end: endOfWeek(addDays(lastDayOfBlock, 3), { weekStartsOn: 1 }) };
    } else {
      // Standard: Einfach nächsten Arbeitstag dazu
      suggestedRange = { start: baseBlock.start, end: addDays(lastDayOfBlock, 1) };
    }
  }

  if (suggestedRange) {
    const totalDays = eachDayOfInterval(suggestedRange).length;
    result.active = true;
    result.message = `${foundHoliday.name} — nutze den Zeitraum für ${totalDays} Tage am Stück frei`;
    result.data = { range: suggestedRange, badge: foundHoliday.name };
  }

  return result;
}

/**
 * Signal 3: Prüft Erholungsbedarf (> 6 Wochen ohne Urlaub).
 */
async function checkRecoveryNeed(userEmail: string, today: Date): Promise<SignalResult> {
  const result: SignalResult = { active: false, weight: WEIGHTS.needsRecovery, message: '' };
  
  try {
    const lastVacation = await Absence.findOne({
      userEmail,
      type: 'vacation',
      status: 'approved',
      endDate: { $lt: today }
    }).sort({ endDate: -1 });

    if (!lastVacation) {
        // Nie Urlaub gehabt? Sicher active.
        result.active = true;
        result.message = "Du hast noch keinen Urlaub in diesem System eingetragen. Gönn dir mal was!";
        return result;
    }

    const weeks = differenceInWeeks(today, lastVacation.endDate);
    if (weeks > 6) {
      result.active = true;
      result.message = `Du warst seit ${weeks} Wochen nicht mehr im Urlaub`;
    }
  } catch (e) {
    console.error('Error in checkRecoveryNeed:', e);
  }
  return result;
}

/**
 * Signal 4: Prüft Kalender-Dichte (Meeting-Intensität).
 */
async function checkCalendarDensity(userId: string, userEmail: string, today: Date): Promise<SignalResult> {
  const result: SignalResult = { active: false, weight: WEIGHTS.calendarFree, message: '' };
  
  try {
    const start = toLocalISO(addWeeks(today, 1));
    const end = toLocalISO(addWeeks(today, 4));
    const domain = userEmail.split('@')[1];

    const events = await getCalendarEvents(userId, `${start}T00:00:00Z`, `${end}T23:59:59Z`);
    if (!events || events.length === 0) {
      // Keine Events = Leer = Gut
      result.active = true;
      result.message = "Dein Kalender sieht in den nächsten Wochen sehr entspannt aus";
      result.data = { weekStart: addWeeks(today, 1), weekEnd: endOfWeek(addWeeks(today, 1), { weekStartsOn: 1 }) };
      return result;
    }

    // Filtere relevante Meetings
    const relevantEvents = events.filter((ev: any) => {
      // Rule 1: showAs busy
      if (ev.showAs !== 'busy') return false;
      // Rule 2: sensitivity normal
      if (ev.sensitivity !== 'normal') return false;
      
      // Rule 3: External OR > 3 attendees
      const isExternal = ev.attendees?.some((att: any) => 
        att.emailAddress?.address && !att.emailAddress.address.includes(domain)
      );
      const isLarge = (ev.attendees?.length || 0) > 3;

      return isExternal || isLarge;
    });

    // Gruppiere nach Woche
    for (let i = 1; i <= 4; i++) {
        const wStart = startOfWeek(addWeeks(today, i), { weekStartsOn: 1 });
        const wEnd = endOfWeek(wStart, { weekStartsOn: 1 });
        
        const weekEvents = relevantEvents.filter((ev: any) => {
            const evStart = new Date(ev.start?.dateTime);
            return evStart >= wStart && evStart <= wEnd;
        });

        // Weniger als 2 relevante Meetings pro Tag (Durchschnitt)
        if (weekEvents.length < 10) { // 2 pro Tag * 5 Tage
            result.active = true;
            result.message = `In KW ${format(wStart, 'I')} hast du kaum wichtige Termine`;
            result.data = { weekStart: wStart, weekEnd: wEnd };
            return result;
        }
    }

  } catch (e) {
    // Fail silently - Signal 4 is optional
    console.error('Signal 4 (Calendar) failed:', e);
  }
  return result;
}

function isAfter(date: Date, compare: Date): boolean {
  return date.getTime() > compare.getTime();
}

function isBefore(date: Date, compare: Date): boolean {
  return date.getTime() < compare.getTime();
}
