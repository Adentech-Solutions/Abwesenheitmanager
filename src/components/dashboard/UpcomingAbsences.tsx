'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/Button';
import { CalendarDays, Calendar as CalendarIcon, Clock, Sparkles, Info, Plus } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary-600" />
          Kommende Abwesenheiten
        </CardTitle>
        <p className="text-sm text-gray-500 font-medium">
          Deine Abwesenheiten & Feiertage
        </p>
      </CardHeader>

      <CardContent className="space-y-6 pt-4">
        {/* User Absences */}
        {upcomingAbsences.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-widest px-1">Deine Anträge</h4>
            <div className="space-y-3">
              {upcomingAbsences.map((absence: any, index: number) => (
                <div
                  key={absence._id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white hover:border-primary-100 hover:bg-primary-50/10 transition-all group animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-both",
                    `delay-[${index * 100}ms]`
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-primary-50 transition-colors">
                      <CalendarIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 leading-tight">
                        {format(new Date(absence.startDate), 'dd. MMM', { locale: de })}
                        {absence.startDate !== absence.endDate && (
                          <span className="text-gray-400 font-normal mx-1">—</span>
                        )}
                        {absence.startDate !== absence.endDate && (
                          format(new Date(absence.endDate), 'dd. MMM', { locale: de })
                        )}
                      </p>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">
                        {absence.totalDays} {absence.totalDays === 1 ? 'Tag' : 'Tage'}
                        {absence.isHalfDay && ' • Halbtag'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={getAbsenceTypeVariant(absence.type)} className="shadow-none px-2.5">
                      {getAbsenceTypeLabel(absence.type)}
                    </Badge>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight min-w-[60px] text-right">
                      {getDaysUntil(absence.startDate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Separator if both exist */}
        {upcomingAbsences.length > 0 && upcomingHolidays.length > 0 && (
          <Separator className="bg-gray-100" />
        )}

        {/* Upcoming Holidays */}
        {upcomingHolidays.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-widest px-1 flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Feiertage ({state})
            </h4>
            <div className="grid gap-2">
              {upcomingHolidays.map((holiday, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50/50 border border-amber-100/50 hover:bg-amber-50 transition-colors animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-both delay-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-9 w-9 rounded-lg bg-amber-100/50 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-amber-900 leading-tight">
                        {holiday.name}
                      </p>
                      <p className="text-xs text-amber-700/70 font-medium">
                        {format(holiday.date, 'EEEE, dd. MMMM', { locale: de })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold border-amber-200 text-amber-700 bg-white/50">
                    {getDaysUntil(holiday.date)}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 px-1 opacity-60">
              <Info className="h-3 w-3 text-gray-400" />
              <p className="text-[11px] font-medium text-gray-500">
                Basierend auf Bundesland: {state}
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {upcomingAbsences.length === 0 && upcomingHolidays.length === 0 && (
          <div className="text-center py-12 px-6">
            <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="h-8 w-8 text-gray-300" />
            </div>
            <h4 className="text-sm font-bold text-gray-900">Keine kommenden Events</h4>
            <p className="text-xs text-gray-500 mt-2 max-w-[200px] mx-auto leading-relaxed font-medium">
              Aktuell stehen keine Abwesenheiten oder Feiertage an.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-6 rounded-xl font-bold h-9 bg-white shadow-sm">
              <Link href="/absences/new" className="flex items-center gap-2">
                <Plus className="h-3.5 w-3.5" />
                Neuer Antrag
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}