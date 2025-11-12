'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';

export default function UpcomingAbsences() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['absences', 'stats'],
    queryFn: async () => {
      const response = await fetch('/api/absences/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  const upcomingAbsences = stats?.upcomingAbsences || [];

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

  const getDaysUntil = (startDate: string) => {
    const days = differenceInDays(new Date(startDate), new Date());
    if (days === 0) return 'Heute';
    if (days === 1) return 'Morgen';
    return `In ${days} Tagen`;
  };

  if (isLoading) {
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
            <p className="text-sm text-gray-600 mt-1">Deine genehmigten Abwesenheiten</p>
          </div>
        </div>

        {/* List */}
        {upcomingAbsences.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">Keine kommenden Abwesenheiten</p>
            <p className="text-sm mt-1">Klicke auf den + Button um einen Antrag zu stellen</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingAbsences.map((absence: any) => (
              <div
                key={absence._id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary-100">
                    <CalendarIcon className="h-4 w-4 text-primary-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-gray-900">
                        {format(new Date(absence.startDate), 'dd. MMM', { locale: de })} - {format(new Date(absence.endDate), 'dd. MMM yyyy', { locale: de })}
                      </p>
                      <Badge variant={getAbsenceTypeVariant(absence.type)}>
                        {getAbsenceTypeLabel(absence.type)}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {absence.totalDays} {absence.totalDays === 1 ? 'Tag' : 'Tage'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>{getDaysUntil(absence.startDate)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}