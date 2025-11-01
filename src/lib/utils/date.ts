import { 
  format, 
  differenceInDays, 
  isWeekend, 
  addDays, 
  isSameDay,
  parseISO,
  startOfDay,
  endOfDay
} from 'date-fns';
import { de } from 'date-fns/locale';

export function calculateWorkingDays(startDate: Date, endDate: Date, isHalfDay: boolean = false): number {
  let days = 0;
  let currentDate = startOfDay(startDate);
  const end = startOfDay(endDate);

  while (currentDate <= end) {
    if (!isWeekend(currentDate)) {
      days++;
    }
    currentDate = addDays(currentDate, 1);
  }

  return isHalfDay ? 0.5 : days;
}

export function formatDate(date: Date | string, formatStr: string = 'dd.MM.yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: de });
}

export function formatDateRange(startDate: Date | string, endDate: Date | string): string {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;

  if (isSameDay(start, end)) {
    return formatDate(start);
  }

  return `${formatDate(start)} - ${formatDate(end)}`;
}

export function isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
  const checkDate = startOfDay(date);
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);

  return checkDate >= start && checkDate <= end;
}

export function getGermanHolidays(year: number): Date[] {
  // German public holidays (simplified - can be extended)
  return [
    new Date(year, 0, 1),   // Neujahr
    new Date(year, 4, 1),   // Tag der Arbeit
    new Date(year, 9, 3),   // Tag der Deutschen Einheit
    new Date(year, 11, 25), // 1. Weihnachtstag
    new Date(year, 11, 26), // 2. Weihnachtstag
  ];
}

export function toISODateString(date: Date): string {
  return date.toISOString().split('T')[0];
}