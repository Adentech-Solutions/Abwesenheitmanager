'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Card from '@/components/ui/Card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from 'lucide-react';

export default function VacationBalance() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['absences', 'stats'],
    queryFn: async () => {
      const response = await fetch('/api/absences/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  const vacationDays = stats?.stats?.vacationDays;
  const percentage = vacationDays ? (vacationDays.remaining / vacationDays.total) * 100 : 0;

  if (isLoading) {
    return (
      <Card>
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-48 mb-4" />
        <Skeleton className="h-4 w-full mb-4" />
        <Skeleton className="h-20 w-full" />
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary-600" />
              Urlaubskonto
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Dein Urlaubsanspruch für {new Date().getFullYear()}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Verbraucht</span>
            <span className="font-medium text-gray-900">
              {vacationDays?.used || 0} / {vacationDays?.total || 0} Tage
            </span>
          </div>
          <Progress value={100 - percentage} className="h-2" />
        </div>

        {/* Vacation Days Breakdown */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div className="space-y-1">
            <p className="text-2xl font-bold text-green-600">
              {vacationDays?.remaining || 0}
            </p>
            <p className="text-xs text-gray-500">Verfügbar</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-orange-600">
              {vacationDays?.used || 0}
            </p>
            <p className="text-xs text-gray-500">Genutzt</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-blue-600">
              {vacationDays?.carryOver || 0}
            </p>
            <p className="text-xs text-gray-500">Übertrag</p>
          </div>
        </div>

        {/* Info Box */}
        {percentage < 30 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-800">
              ⚠️ Nur noch {vacationDays?.remaining || 0} Tage verfügbar! Plane deinen Urlaub rechtzeitig.
            </p>
          </div>
        )}

        {percentage > 70 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              ✅ Du hast noch viele Urlaubstage übrig. Zeit für eine Auszeit!
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}