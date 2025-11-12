'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Calendar as CalendarIcon, Clock, Sparkles } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';

// ⭐ Holiday type (falls holidays.ts noch nicht existiert)
interface Holiday {
  date: Date;
  name: string;
  isNationalHoliday: boolean;
}

// ⭐ Funktion um Feiertage zu berechnen (vereinfachte Version)
function getUpcomingHolidays(state: string, days: number = 90): Holiday[] {
  const today = new Date();
  const currentYear = today.getFullYear();
  const nextYear = currentYear + 1;
  
  // Berechne Ostern (vereinfacht - nur für Demo)
  const easter = getEasterDate(currentYear);
  
  const allHolidays: Holiday[] = [
    // Bundesweite Feiertage
    { date: new Date(currentYear, 0, 1), name: 'Neujahr', isNationalHoliday: true },
    { date: new Date(currentYear, 4, 1), name: 'Tag der Arbeit', isNationalHoliday: true },
    { date: new Date(currentYear, 9, 3), name: 'Tag der Deutschen Einheit', isNationalHoliday: true },
    { date: new Date(currentYear, 11, 25), name: '1. Weihnachtsfeiertag', isNationalHoliday: true },
    { date: new Date(currentYear, 11, 26), name: '2. Weihnachtsfeiertag', isNationalHoliday: true },
    { date: new Date(nextYear, 0, 1), name: 'Neujahr', isNationalHoliday: true },
    
    // Regional (Bayern als Beispiel)
    ...(state === 'BY' ? [
      { date: new Date(currentYear, 0, 6), name: 'Heilige Drei Könige', isNationalHoliday: false },
      { date: new Date(currentYear, 10, 1), name: 'Allerheiligen', isNationalHoliday: false },
    ] : []),
  ];

  // Filter upcoming holidays (next 90 days)
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return allHolidays
    .filter(h => h.date > today && h.date < futureDate)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);
}

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

export default function UpcomingAbsences() {
  // Fetch user absences
  const { data: stats, isLoading: absencesLoading } = useQuery({
    queryKey: ['absences', 'stats'],
    queryFn: async () => {
      const response = await fetch('/api/absences/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  // Fetch company settings for state/bundesland
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['company', 'settings'],
    queryFn: async () => {
      const response = await fetch('/api/settings/company');
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    },
  });

  const upcomingAbsences = stats?.upcomingAbsences || [];
  const state = settings?.settings?.state || 'BY';
  
  // Get upcoming holidays based on company state
  const upcomingHolidays = getUpcomingHolidays(state, 90);

  const getAbsenceTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      vacation: 'Urlaub',
      sick: 'Krankheit',
      training: 'Fortbildung',
      parental: 'Elternzeit',
    };
    return types[type] || type;
  };

  const getAbsenceTypeVariant = (type: string): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      vacation: 'info',
      sick: 'danger',
      training: 'success',
      parental: 'warning',
    };
    return variants[type] || 'default';
  };

  const getDaysUntil = (date: string | Date) => {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const days = differenceInDays(targetDate, new Date());
    if (days === 0) return 'Heute';
    if (days === 1) return 'Morgen';
    if (days < 0) return 'Vorbei';
    return `In ${days} Tagen`;
  };

  if (absencesLoading || settingsLoading) {
    return (
      <Card>
        <Skeleton className="h-6 w-40 mb-2" />
        <Skeleton className="h-4 w-56 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary-600" />
              Kommende Abwesenheiten
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Deine Abwesenheiten & Feiertage
            </p>
          </div>
        </div>

        {/* User Absences */}
        {upcomingAbsences.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Deine genehmigten Abwesenheiten</h4>
            {upcomingAbsences.map((absence: any) => (
              <div
                key={absence._id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(absence.startDate), 'dd.MM.yyyy', { locale: de })}
                      {absence.startDate !== absence.endDate && (
                        <> - {format(new Date(absence.endDate), 'dd.MM.yyyy', { locale: de })}</>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {absence.totalDays} {absence.totalDays === 1 ? 'Tag' : 'Tage'}
                      {absence.isHalfDay && ' (Halbtag)'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getAbsenceTypeVariant(absence.type)}>
                    {getAbsenceTypeLabel(absence.type)}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {getDaysUntil(absence.startDate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Separator if both exist */}
        {upcomingAbsences.length > 0 && upcomingHolidays.length > 0 && (
          <Separator />
        )}

        {/* Upcoming Holidays */}
        {upcomingHolidays.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              Kommende Feiertage ({state})
            </h4>
            <div className="space-y-2">
              {upcomingHolidays.map((holiday, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-yellow-50 border border-yellow-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {holiday.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {format(holiday.date, 'EEEE, dd. MMMM', { locale: de })}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gray-700 bg-yellow-100 px-2 py-1 rounded">
                    {getDaysUntil(holiday.date)}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Feiertage basierend auf Bundesland: {state}
            </p>
          </div>
        )}

        {/* Empty State */}
        {upcomingAbsences.length === 0 && upcomingHolidays.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">Keine kommenden Abwesenheiten</p>
            <p className="text-sm mt-1">
              Klicke auf den + Button um einen Antrag zu stellen
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}