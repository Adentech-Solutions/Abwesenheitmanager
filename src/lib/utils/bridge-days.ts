import { addDays, isWeekend, isSameDay } from 'date-fns';
import { getGermanHolidays } from './date';

export interface BridgeDay {
  date: Date;
  reason: string;
  savingDays: number;
}

export function detectBridgeDays(year: number): BridgeDay[] {
  const holidays = getGermanHolidays(year);
  const bridgeDays: BridgeDay[] = [];

  holidays.forEach((holiday) => {
    // Check day before holiday
    const dayBefore = addDays(holiday, -1);
    if (!isWeekend(dayBefore) && !isHoliday(dayBefore, holidays)) {
      bridgeDays.push({
        date: dayBefore,
        reason: `Brückentag vor Feiertag (${holiday.toLocaleDateString('de-DE')})`,
        savingDays: calculateSavingDays(dayBefore, holiday),
      });
    }

    // Check day after holiday
    const dayAfter = addDays(holiday, 1);
    if (!isWeekend(dayAfter) && !isHoliday(dayAfter, holidays)) {
      bridgeDays.push({
        date: dayAfter,
        reason: `Brückentag nach Feiertag (${holiday.toLocaleDateString('de-DE')})`,
        savingDays: calculateSavingDays(holiday, dayAfter),
      });
    }
  });

  return bridgeDays;
}

function isHoliday(date: Date, holidays: Date[]): boolean {
  return holidays.some((holiday) => isSameDay(holiday, date));
}

function calculateSavingDays(start: Date, end: Date): number {
  let current = start;
  let savings = 0;

  while (current <= end) {
    if (isWeekend(current)) {
      savings++;
    }
    current = addDays(current, 1);
  }

  return savings;
}

export function suggestOptimalVacationPeriods(
  year: number,
  availableDays: number
): Array<{ startDate: Date; endDate: Date; totalDays: number; reason: string }> {
  const bridgeDays = detectBridgeDays(year);
  const suggestions: Array<{ startDate: Date; endDate: Date; totalDays: number; reason: string }> = [];

  // Sort bridge days by saving potential
  bridgeDays.sort((a, b) => b.savingDays - a.savingDays);

  // Suggest taking bridge days
  bridgeDays.slice(0, 3).forEach((bridge) => {
    suggestions.push({
      startDate: bridge.date,
      endDate: bridge.date,
      totalDays: 1,
      reason: `${bridge.reason} - Spart ${bridge.savingDays} Wochenendtage!`,
    });
  });

  return suggestions;
}
