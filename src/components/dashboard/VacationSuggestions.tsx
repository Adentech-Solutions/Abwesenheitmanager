'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, Sparkles, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { format, addDays, eachDayOfInterval, isWeekend } from 'date-fns';
import { de } from 'date-fns/locale';
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
  feiertag: string;
  feiertagDatum: string;
  beschreibung: string;
  typ: 'brueckentag' | 'kombination' | 'kette' | 'weihnachten';
};

const typeLabel: Record<VacationSuggestion['typ'], string> = {
  brueckentag: 'Brückentag',
  kombination: 'Kombination',
  kette: 'Kette',
  weihnachten: 'Weihnachten',
};

const typeVariant: Record<VacationSuggestion['typ'], 'default' | 'success' | 'warning' | 'info' | 'secondary'> = {
  brueckentag: 'info',
  kombination: 'success',
  kette: 'warning',
  weihnachten: 'secondary',
};

interface DayInfo {
  date: Date;
  isVacation: boolean;
  isHoliday: boolean;
  isWeekend: boolean;
  holidayName?: string;
}

function analyzeSuggestionDays(suggestion: VacationSuggestion, vacationStats: { remaining: number } | null): {
  days: DayInfo[];
  breakdown: {
    vacationDays: number;
    holidayDays: number;
    weekendDays: number;
    totalFreeDays: number;
  };
} {
  const startDate = parseLocalDate(suggestion.startDate);
  const endDate = parseLocalDate(suggestion.endDate);

  // Erstelle 2-wöchigen Zeitraum um den Vorschlag herum
  const calendarStart = addDays(startDate, -7);
  const calendarEnd = addDays(endDate, 7);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Sammle alle Feiertage (vereinfacht - in Realität würden wir die API nutzen)
  const holidays = new Set<string>();
  if (suggestion.feiertagDatum) {
    holidays.add(suggestion.feiertagDatum.split('T')[0]);
  }

  const days: DayInfo[] = calendarDays.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const isVacation = date >= startDate && date <= endDate && !isWeekend(date);
    const isHoliday = holidays.has(dateStr);
    // Explicitly check for Saturday (6) and Sunday (0) only
    const isWeekendDay = isWeekend(date);

    return {
      date,
      isVacation,
      isHoliday,
      isWeekend: isWeekendDay,
      holidayName: isHoliday ? suggestion.feiertag : undefined,
    };
  });

  // Berechne Aufschlüsselung
  const vacationDays = days.filter(d => d.isVacation).length;
  const holidayDays = days.filter(d => d.isHoliday).length;
  const weekendDays = days.filter(d => d.isWeekend && !d.isVacation && !d.isHoliday).length;
  const totalFreeDays = vacationDays + holidayDays + weekendDays;

  return {
    days,
    breakdown: {
      vacationDays,
      holidayDays,
      weekendDays,
      totalFreeDays,
    },
  };
}

function MiniCalendar({ suggestion, vacationStats }: { suggestion: VacationSuggestion; vacationStats: { remaining: number } | null }) {
  const { days, breakdown } = analyzeSuggestionDays(suggestion, vacationStats);

  return (
    <div className="space-y-4">
      {/* Mini-Kalender */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {/* Wochentage Header */}
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
          <div key={day} className="text-xs font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}

        {/* Kalendertage */}
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
          <div>
            {breakdown.vacationDays} Urlaubstag{breakdown.vacationDays !== 1 ? 'e' : ''} + {' '}
            {breakdown.holidayDays} Feiertag{breakdown.holidayDays !== 1 ? 'e' : ''} + {' '}
            {breakdown.weekendDays} Wochenendtage = {' '}
            <span className="font-semibold text-primary-600">{breakdown.totalFreeDays} Tage frei</span>
          </div>
          <div className="text-xs text-gray-500">
            Resturlaub danach: {vacationStats ? Math.max(0, vacationStats.remaining - suggestion.urlaubstage) : '?'} Tage
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VacationSuggestions() {
  const [expanded, setExpanded] = useState(false);
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

  const visibleSuggestions = useMemo(() => {
    if (expanded) return suggestions;
    return suggestions.slice(0, 3);
  }, [expanded, suggestions]);

  const handleCardClick = (suggestionId: string) => {
    setExpandedCard(expandedCard === suggestionId ? null : suggestionId);
  };

  const handleRequestVacation = (suggestion: VacationSuggestion) => {
    router.push(`/absences/new?start=${suggestion.startDate}&end=${suggestion.endDate}`);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary-600" />
          Smarte Urlaubsvorschläge
        </CardTitle>
        <p className="text-sm text-gray-500 font-medium">
          Erhalte Vorschläge, wie du Feiertage optimal ausnutzt.
        </p>
      </CardHeader>

      <CardContent className="space-y-4 pt-2">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-gray-100 bg-white p-4">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-52 mb-2" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-6 w-28" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && suggestions.length === 0 && (
          <div className="text-center py-12 px-6">
            <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="h-8 w-8 text-gray-300" />
            </div>
            <h4 className="text-sm font-bold text-gray-900">Keine Vorschläge verfügbar</h4>
            <p className="text-xs text-gray-500 mt-2 max-w-[220px] mx-auto leading-relaxed font-medium">
              Entweder hast du keine freien Urlaubstage mehr oder alle potenziellen Brückentage sind bereits belegt.
            </p>
          </div>
        )}

        {!isLoading && suggestions.length > 0 && (
          <div className="space-y-3">
            {visibleSuggestions.map((suggestion) => {
              const isExpanded = expandedCard === suggestion.id;
              return (
                <div key={suggestion.id}>
                  <div
                    className={cn(
                      'rounded-xl border border-gray-100 bg-white p-4 transition-all duration-300 cursor-pointer',
                      'hover:shadow-md',
                      isExpanded && 'shadow-md'
                    )}
                    onClick={() => handleCardClick(suggestion.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge variant={typeVariant[suggestion.typ]}>
                            {typeLabel[suggestion.typ]}
                          </Badge>
                          <span className="text-xs text-gray-500 font-medium">
                            {format(parseLocalDate(suggestion.startDate), 'dd. MMM yyyy', { locale: de })}
                            {suggestion.startDate !== suggestion.endDate && (
                              <span>–{format(parseLocalDate(suggestion.endDate), 'dd. MMM yyyy', { locale: de })}</span>
                            )}
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-gray-900 mb-1">
                          {suggestion.feiertag} ({format(parseLocalDate(suggestion.feiertagDatum), 'EEE dd.MM.', { locale: de })})
                        </h4>

                        <p className="text-sm text-gray-700 mb-2">
                          {suggestion.beschreibung}
                        </p>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-primary-600">
                            {suggestion.freieTage} Tage frei
                          </span>
                          <span className="text-xs font-medium text-success-600">
                            nur {suggestion.urlaubstage} Urlaubstag{suggestion.urlaubstage === 1 ? '' : 'e'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <span className="text-xs font-medium text-gray-400">Effizienz</span>
                          <p className="text-lg font-bold text-gray-900">{suggestion.effizienz.toFixed(2)}</p>
                        </div>
                        <ChevronDown className={cn(
                          'h-4 w-4 text-gray-400 transition-transform duration-300',
                          isExpanded && 'rotate-180'
                        )} />
                      </div>
                    </div>
                  </div>

                  {/* Erweiterte Ansicht */}
                  {isExpanded && (
                    <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <MiniCalendar suggestion={suggestion} vacationStats={vacationStats} />
                      <div className="mt-4 flex justify-end">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRequestVacation(suggestion);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Urlaub beantragen
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {suggestions.length > 3 && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl font-bold"
                  onClick={() => setExpanded((prev) => !prev)}
                >
                  {expanded ? (
                    <span className="flex items-center gap-2">
                      <ChevronUp className="h-4 w-4" />
                      Weniger anzeigen
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <ChevronDown className="h-4 w-4" />
                      Alle Vorschläge anzeigen
                    </span>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
