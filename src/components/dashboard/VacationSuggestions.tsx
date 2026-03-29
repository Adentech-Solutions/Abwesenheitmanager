'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, Sparkles, ChevronDown, Plus, Star } from 'lucide-react';
import { format, addDays, eachDayOfInterval, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { getGermanHolidays } from '@/lib/utils/holidays';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useVacationBalance } from '@/hooks/useVacationBalance';

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

type VacationSuggestion = {
  id: string;
  startDate: string;
  endDate: string;
  urlaubstage: number;
  freieTage: number;
  effizienz: number;
  sterne: number;
  feiertag: string;
  beschreibung: string;
  typ: 'brueckentag' | 'kombination' | 'cluster';
  urlaubstageDetails: string[];
  feiertageImZeitraum: string[];
};

const typeLabel: Record<VacationSuggestion['typ'], string> = {
  brueckentag: 'Brückentag',
  kombination: 'Verlängerte Woche',
  cluster: 'Feiertags-Cluster',
};

const typeVariant: Record<VacationSuggestion['typ'], 'default' | 'success' | 'warning' | 'info' | 'secondary'> = {
  brueckentag: 'info',
  kombination: 'success',
  cluster: 'warning',
};

interface DayInfo {
  date: Date;
  isVacation: boolean;
  isHoliday: boolean;
  isWeekend: boolean;
  holidayName?: string;
}

function analyzeSuggestionDays(suggestion: VacationSuggestion): {
  days: DayInfo[];
  breakdown: { vacationDays: number; holidayDays: number; weekendDays: number; totalFreeDays: number };
} {
  const startDate = startOfDay(parseLocalDate(suggestion.startDate));
  const endDate = startOfDay(parseLocalDate(suggestion.endDate));

  const calendarStart = startOfDay(addDays(startDate, -7));
  const calendarEnd = startOfDay(addDays(endDate, 7));
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const yearStart = calendarStart.getFullYear();
  const yearEnd = calendarEnd.getFullYear();
  const allHolidaysInRange = [
    ...getGermanHolidays(yearStart),
    ...(yearEnd !== yearStart ? getGermanHolidays(yearEnd) : []),
  ]
    .filter(h => {
      const hTime = startOfDay(h.date).getTime();
      return hTime >= calendarStart.getTime() && hTime <= calendarEnd.getTime();
    })
    .reduce<Record<string, string>>((acc, h) => {
      acc[format(startOfDay(h.date), 'yyyy-MM-dd')] = h.name;
      return acc;
    }, {});

  const days: DayInfo[] = calendarDays.map(date => {
    const d = startOfDay(date);
    const dateStr = format(d, 'yyyy-MM-dd');
    const isHol = Boolean(allHolidaysInRange[dateStr]);
    const dayOfWeek = d.getDay();
    const isWE = dayOfWeek === 0 || dayOfWeek === 6;
    const inSuggestion = d.getTime() >= startDate.getTime() && d.getTime() <= endDate.getTime();
    const isVac = inSuggestion && !isWE && !isHol;
    return { date: d, isVacation: isVac, isHoliday: isHol, isWeekend: isWE, holidayName: isHol ? allHolidaysInRange[dateStr] : undefined };
  });

  const inRange = days.filter(d => d.date.getTime() >= startDate.getTime() && d.date.getTime() <= endDate.getTime());
  const vacationDays = inRange.filter(d => d.isVacation).length;
  const holidayDays = inRange.filter(d => d.isHoliday).length;
  const weekendDays = inRange.filter(d => d.isWeekend && !d.isVacation && !d.isHoliday).length;

  return { days, breakdown: { vacationDays, holidayDays, weekendDays, totalFreeDays: vacationDays + holidayDays + weekendDays } };
}

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-3.5 w-3.5',
            i < count ? 'text-primary-600 fill-primary-600' : 'text-gray-200 fill-gray-200'
          )}
        />
      ))}
    </div>
  );
}

function MiniCalendar({ suggestion, vacationStats }: {
  suggestion: VacationSuggestion;
  vacationStats: { remaining: number; total: number } | null;
}) {
  const { days, breakdown } = analyzeSuggestionDays(suggestion);

  const firstDayOfWeek = days[0].date.getDay();
  const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  return (
    <div className="space-y-4">
      {/* Mini-Kalender */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
          <div key={day} className="text-xs font-medium text-gray-500 py-1">{day}</div>
        ))}
        {Array.from({ length: paddingDays }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((day, index) => (
          <div
            key={index}
            className={cn(
              'aspect-square flex flex-col items-center justify-center text-xs rounded-md border relative',
              day.isVacation && 'bg-primary text-white border-primary',
              day.isHoliday && 'bg-blue-100 text-blue-800 border-blue-200',
              day.isWeekend && !day.isVacation && !day.isHoliday && 'bg-gray-100 text-gray-500',
              !day.isVacation && !day.isHoliday && !day.isWeekend && 'bg-white text-gray-900 border-gray-200'
            )}
          >
            {format(day.date, 'd')}
            {day.isHoliday && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </div>
        ))}
      </div>

      {/* Legende */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-primary rounded"></div>
          <span>Urlaub</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
          <span>Feiertag</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-100 rounded"></div>
          <span>Wochenende</span>
        </div>
      </div>

      {/* Aufschlüsselung */}
      <div className="bg-gray-50 rounded-lg p-3 text-sm">
        <div className="font-medium text-gray-900 mb-2">Aufschlüsselung:</div>
        <div className="space-y-1 text-gray-700">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary-600"></span>
              {breakdown.vacationDays} Urlaubstag{breakdown.vacationDays !== 1 ? 'e' : ''}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-200"></span>
              {breakdown.holidayDays} Feiertag{breakdown.holidayDays !== 1 ? 'e' : ''}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gray-300"></span>
              {breakdown.weekendDays} Wochenendtag{breakdown.weekendDays !== 1 ? 'e' : ''}
            </span>
            <span className="font-bold text-primary-600">→ {breakdown.totalFreeDays} Tage frei</span>
          </div>
          <div className="text-xs text-gray-500">
            Resturlaub danach: {typeof vacationStats?.remaining === 'number'
              ? `${Math.max(0, vacationStats.remaining - suggestion.urlaubstage)} von ${vacationStats.total ?? 0} Tagen`
              : `0 von 0 Tagen`}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VacationSuggestions({ className }: { className?: string }) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['vacation', 'suggestions'],
    queryFn: async () => {
      const res = await fetch('/api/vacation-suggestions');
      if (!res.ok) throw new Error('Failed to fetch vacation suggestions');
      return res.json();
    },
  });

  const { stats: vacationStats } = useVacationBalance();
  const suggestions: VacationSuggestion[] = data?.suggestions || [];

  const handleRequestVacation = (suggestion: VacationSuggestion) => {
    router.push(`/absences/new?start=${suggestion.startDate}&end=${suggestion.endDate}`);
  };

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary-600" />
            Smarte Urlaubsvorschläge
          </CardTitle>
        </div>
        <p className="text-sm text-gray-500 font-medium">
          Optimiere deine freien Tage mit Brückentagen.
        </p>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 pt-2 pb-6">
        {isLoading && (
          <div className="flex gap-4 overflow-hidden">
            {[1, 2].map((i) => (
              <div key={i} className="min-w-[280px] w-[320px] rounded-xl border border-gray-100 bg-white p-4">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-52 mb-2" />
                <div className="flex items-center gap-2 mt-4">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-6 w-28" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && suggestions.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center py-6 text-center">
            <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <CalendarDays className="h-8 w-8 text-gray-300" />
            </div>
            <h4 className="text-sm font-bold text-gray-900">Keine Vorschläge</h4>
            <p className="text-xs text-gray-500 mt-2 max-w-[220px] leading-relaxed font-medium">
              Alle potenziellen Brückentage sind bereits belegt.
            </p>
          </div>
        )}

        {!isLoading && suggestions.length > 0 && (
          <div className="relative group/carousel h-full">
            <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-hide -mx-1 px-1">
              {suggestions.map((suggestion) => {
                const isExpanded = expandedCard === suggestion.id;
                return (
                  <div 
                    key={suggestion.id}
                    className="flex-none w-[300px] sm:w-[340px] snap-center"
                  >
                    <div
                      className={cn(
                        'h-full rounded-2xl border border-gray-100 bg-white p-5 transition-all duration-300 cursor-pointer flex flex-col',
                        'hover:shadow-lg hover:border-primary-200',
                        isExpanded ? 'ring-2 ring-primary-500 shadow-lg' : 'shadow-sm'
                      )}
                      onClick={() => setExpandedCard(isExpanded ? null : suggestion.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant={typeVariant[suggestion.typ]} className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider">
                            {typeLabel[suggestion.typ]}
                          </Badge>
                          <StarRating count={suggestion.sterne} />
                        </div>

                        <h4 className="text-lg font-bold text-gray-900 mb-1 leading-tight">
                          {suggestion.feiertag}
                        </h4>

                        <p className="text-xs text-gray-500 font-bold mb-3">
                          {format(parseLocalDate(suggestion.startDate), 'dd. MMM', { locale: de })}
                          {suggestion.startDate !== suggestion.endDate && (
                            <span> – {format(parseLocalDate(suggestion.endDate), 'dd. MMM', { locale: de })}</span>
                          )}
                        </p>

                        <p className="text-sm text-gray-600 mb-4 line-clamp-2 font-medium leading-relaxed">
                          {suggestion.beschreibung}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-gray-50 mt-auto">
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-sm font-bold text-primary-600 leading-none">
                              {suggestion.freieTage} Tage frei
                            </p>
                            <p className="text-[11px] text-gray-400 mt-1 font-bold italic">
                              nur {suggestion.urlaubstage} {suggestion.urlaubstage === 1 ? 'Tag' : 'Tage'}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRequestVacation(suggestion);
                            }}
                            className="h-8 px-3 rounded-lg text-xs font-bold"
                          >
                            Planen
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Modal-like Detail Overlay (Hidden by default, can be triggered) */}
                    {isExpanded && (
                      <div 
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedCard(null);
                        }}
                      >
                        <div 
                          className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">{suggestion.feiertag}</h3>
                            <Button variant="ghost" size="icon" onClick={() => setExpandedCard(null)} className="rounded-full">
                              <span className="sr-only">Schließen</span>
                              <ChevronDown className="h-5 w-5 rotate-180" />
                            </Button>
                          </div>
                          
                          <MiniCalendar suggestion={suggestion} vacationStats={vacationStats} />
                          
                          <div className="mt-8 flex gap-3">
                            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setExpandedCard(null)}>
                              Abbrechen
                            </Button>
                            <Button 
                              className="flex-1 rounded-xl gap-2 font-bold"
                              onClick={() => handleRequestVacation(suggestion)}
                            >
                              <Plus className="h-4 w-4" />
                              Beantragen
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Hint for more suggestions */}
            {suggestions.length > 2 && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 h-full w-20 bg-gradient-to-l from-white to-transparent pointer-events-none opacity-0 group-hover/carousel:opacity-100 transition-opacity" />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
