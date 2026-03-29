'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from "@/lib/utils"
import { Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function VacationBalance({ className }: { className?: string }) {
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
      <Card className={cn("flex flex-col", className)}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent className="flex-1 space-y-6">
          <Skeleton className="h-2 w-full" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary-600" />
            Urlaubskonto
          </CardTitle>
        </div>
        <p className="text-sm text-gray-500 font-medium">
          Dein Urlaubsanspruch für {new Date().getFullYear()}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-4">
        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 font-medium">Verbraucht</span>
            <span className="font-bold text-gray-900">
              {vacationDays?.used || 0} / {vacationDays?.total || 0} <span className="text-gray-400 font-normal ml-0.5">Tage</span>
            </span>
          </div>
          <Progress value={100 - percentage} className="h-2.5 bg-gray-100" />
        </div>

        {/* Breakdown Grid */}
        <div className="grid grid-cols-3 gap-4 py-6 border-y border-gray-100">
          <div className="text-center space-y-1">
            <p className="text-2xl font-bold text-emerald-600 leading-none">
              {vacationDays?.remaining || 0}
            </p>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Verfügbar</p>
          </div>
          <div className="text-center space-y-1 border-x border-gray-100 px-2">
            <p className="text-2xl font-bold text-amber-600 leading-none">
              {vacationDays?.used || 0}
            </p>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Genutzt</p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-2xl font-bold text-primary-600 leading-none">
              {vacationDays?.carryOver || 0}
            </p>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Übertrag</p>
          </div>
        </div>

        {/* Contextual Alerts */}
        <div className="pt-2">
          {percentage < 30 ? (
            <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 flex gap-3 items-start">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 leading-relaxed font-medium">
                Nur noch {vacationDays?.remaining || 0} Tage verfügbar! Plane deinen Urlaub rechtzeitig.
              </p>
            </div>
          ) : percentage > 70 ? (
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex gap-3 items-start">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-800 leading-relaxed font-medium">
                Du hast noch viele Urlaubstage übrig. Zeit für eine Auszeit!
              </p>
            </div>
          ) : (
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex gap-3 items-start">
              <Calendar className="h-5 w-5 text-primary-600 shrink-0 mt-0.5" />
              <p className="text-sm text-primary-800 leading-relaxed font-medium">
                Dein Urlaubskonto ist gut ausgeglichen. Weiter so!
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}