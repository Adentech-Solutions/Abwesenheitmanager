// src/lib/utils/holidays.ts
// German Public Holidays by Federal State

import { format, addDays, isBefore, isAfter, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';

export type GermanState = 
  | 'BW' // Baden-Württemberg
  | 'BY' // Bayern
  | 'BE' // Berlin
  | 'BB' // Brandenburg
  | 'HB' // Bremen
  | 'HH' // Hamburg
  | 'HE' // Hessen
  | 'MV' // Mecklenburg-Vorpommern
  | 'NI' // Niedersachsen
  | 'NW' // Nordrhein-Westfalen
  | 'RP' // Rheinland-Pfalz
  | 'SL' // Saarland
  | 'SN' // Sachsen
  | 'ST' // Sachsen-Anhalt
  | 'SH' // Schleswig-Holstein
  | 'TH'; // Thüringen

export const GERMAN_STATES: { code: GermanState; name: string }[] = [
  { code: 'BW', name: 'Baden-Württemberg' },
  { code: 'BY', name: 'Bayern' },
  { code: 'BE', name: 'Berlin' },
  { code: 'BB', name: 'Brandenburg' },
  { code: 'HB', name: 'Bremen' },
  { code: 'HH', name: 'Hamburg' },
  { code: 'HE', name: 'Hessen' },
  { code: 'MV', name: 'Mecklenburg-Vorpommern' },
  { code: 'NI', name: 'Niedersachsen' },
  { code: 'NW', name: 'Nordrhein-Westfalen' },
  { code: 'RP', name: 'Rheinland-Pfalz' },
  { code: 'SL', name: 'Saarland' },
  { code: 'SN', name: 'Sachsen' },
  { code: 'ST', name: 'Sachsen-Anhalt' },
  { code: 'SH', name: 'Schleswig-Holstein' },
  { code: 'TH', name: 'Thüringen' },
];

export interface Holiday {
  date: Date;
  name: string;
  states: GermanState[] | 'all';
  isNationalHoliday: boolean;
}

/**
 * Calculate Easter Sunday for a given year (Gauss algorithm)
 */
function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month, day);
}

/**
 * Get all German holidays for a specific year and state
 */
export function getGermanHolidays(year: number, state?: GermanState): Holiday[] {
  const easter = getEasterDate(year);
  
  const holidays: Holiday[] = [
    // Bundesweite Feiertage
    {
      date: new Date(year, 0, 1),
      name: 'Neujahr',
      states: 'all',
      isNationalHoliday: true,
    },
    {
      date: addDays(easter, -2),
      name: 'Karfreitag',
      states: 'all',
      isNationalHoliday: true,
    },
    {
      date: addDays(easter, 1),
      name: 'Ostermontag',
      states: 'all',
      isNationalHoliday: true,
    },
    {
      date: new Date(year, 4, 1),
      name: 'Tag der Arbeit',
      states: 'all',
      isNationalHoliday: true,
    },
    {
      date: addDays(easter, 39),
      name: 'Christi Himmelfahrt',
      states: 'all',
      isNationalHoliday: true,
    },
    {
      date: addDays(easter, 50),
      name: 'Pfingstmontag',
      states: 'all',
      isNationalHoliday: true,
    },
    {
      date: new Date(year, 9, 3),
      name: 'Tag der Deutschen Einheit',
      states: 'all',
      isNationalHoliday: true,
    },
    {
      date: new Date(year, 11, 25),
      name: '1. Weihnachtsfeiertag',
      states: 'all',
      isNationalHoliday: true,
    },
    {
      date: new Date(year, 11, 26),
      name: '2. Weihnachtsfeiertag',
      states: 'all',
      isNationalHoliday: true,
    },

    // Regionale Feiertage
    {
      date: new Date(year, 0, 6),
      name: 'Heilige Drei Könige',
      states: ['BW', 'BY', 'ST'],
      isNationalHoliday: false,
    },
    {
      date: new Date(year, 2, 8),
      name: 'Internationaler Frauentag',
      states: ['BE', 'MV'],
      isNationalHoliday: false,
    },
    {
      date: addDays(easter, 60),
      name: 'Fronleichnam',
      states: ['BW', 'BY', 'HE', 'NW', 'RP', 'SL'],
      isNationalHoliday: false,
    },
    {
      date: new Date(year, 7, 8),
      name: 'Augsburger Friedensfest',
      states: ['BY'], // Nur in Augsburg
      isNationalHoliday: false,
    },
    {
      date: new Date(year, 7, 15),
      name: 'Mariä Himmelfahrt',
      states: ['SL'],
      isNationalHoliday: false,
    },
    {
      date: new Date(year, 8, 20),
      name: 'Weltkindertag',
      states: ['TH'],
      isNationalHoliday: false,
    },
    {
      date: new Date(year, 9, 31),
      name: 'Reformationstag',
      states: ['BB', 'HB', 'HH', 'MV', 'NI', 'SN', 'ST', 'SH', 'TH'],
      isNationalHoliday: false,
    },
    {
      date: new Date(year, 10, 1),
      name: 'Allerheiligen',
      states: ['BW', 'BY', 'NW', 'RP', 'SL'],
      isNationalHoliday: false,
    },
    {
      date: new Date(year, 10, 18),
      name: 'Buß- und Bettag',
      states: ['SN'],
      isNationalHoliday: false,
    },
  ];

  // Filter by state if provided
  if (state) {
    return holidays.filter(
      (holiday) => holiday.states === 'all' || holiday.states.includes(state)
    );
  }

  return holidays;
}

/**
 * Get upcoming holidays (next X days)
 */
export function getUpcomingHolidays(state?: GermanState, days: number = 90): Holiday[] {
  const today = startOfDay(new Date());
  const futureDate = addDays(today, days);
  const currentYear = today.getFullYear();
  const nextYear = currentYear + 1;

  // Get holidays for current and next year
  const allHolidays = [
    ...getGermanHolidays(currentYear, state),
    ...getGermanHolidays(nextYear, state),
  ];

  // Filter upcoming holidays
  return allHolidays
    .filter((holiday) => {
      const holidayStart = startOfDay(holiday.date);
      return (isAfter(holidayStart, today) || holidayStart.getTime() === today.getTime()) 
        && isBefore(holidayStart, futureDate);
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Check if a date is a holiday
 */
export function isHoliday(date: Date, state?: GermanState): Holiday | null {
  const year = date.getFullYear();
  const holidays = getGermanHolidays(year, state);
  const checkDate = startOfDay(date);

  const holiday = holidays.find((h) => {
    const holidayDate = startOfDay(h.date);
    return holidayDate.getTime() === checkDate.getTime();
  });

  return holiday || null;
}

/**
 * Get days until next holiday
 */
export function getDaysUntilNextHoliday(state?: GermanState): { holiday: Holiday; days: number } | null {
  const upcoming = getUpcomingHolidays(state, 365);
  if (upcoming.length === 0) return null;

  const nextHoliday = upcoming[0];
  const today = startOfDay(new Date());
  const holidayDate = startOfDay(nextHoliday.date);
  const days = Math.ceil((holidayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return { holiday: nextHoliday, days };
}

/**
 * Format holiday for display
 */
export function formatHolidayDate(holiday: Holiday): string {
  return format(holiday.date, 'EEEE, dd. MMMM yyyy', { locale: de });
}

/**
 * Get holiday count for a year and state
 */
export function getHolidayCount(year: number, state?: GermanState): number {
  return getGermanHolidays(year, state).length;
}
