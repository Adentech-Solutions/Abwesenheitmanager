'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/skeleton';
import { Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseLocalDate } from '@/lib/utils/localDate';
import type { YearPlan } from '@/lib/services/yearPlanner';

export default function YearPlannerWidget({ className }: { className?: string }) {
  const year = new Date().getFullYear();
  const [hasPlanFlag, setHasPlanFlag] = useState(false);

  useEffect(() => {
    try {
      setHasPlanFlag(localStorage.getItem(`freyetag-planner-has-plan-${year}`) === '1');
    } catch {
      setHasPlanFlag(false);
    }
  }, [year]);

  const storedCriteria = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(`freyetag-planner-criteria-${year}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [year]);

  const { data: bootstrap } = useQuery({
    queryKey: ['absences', 'planner-bootstrap-widget', year],
    queryFn: async () => {
      const c = encodeURIComponent(
        JSON.stringify({
          priorities: [],
          mainVacation: null,
          remainingStrategy: ['christmas'],
          takeBridgeDays: false,
          considerSchoolHolidays: false,
        })
      );
      const res = await fetch(`/api/absences/planner?year=${year}&criteria=${c}`);
      if (!res.ok) throw new Error('fail');
      return res.json() as Promise<{ remainingDays: number; plan: YearPlan }>;
    },
    staleTime: 60_000,
  });

  const { data: planData, isLoading } = useQuery({
    queryKey: ['absences', 'planner-widget', year, storedCriteria],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('year', String(year));
      if (storedCriteria) params.set('criteria', JSON.stringify(storedCriteria));
      const res = await fetch(`/api/absences/planner?${params.toString()}`);
      if (!res.ok) throw new Error('fail');
      return res.json() as Promise<{ plan: YearPlan; remainingDays: number }>;
    },
    enabled: hasPlanFlag,
    staleTime: 60_000,
  });

  const total = bootstrap?.remainingDays ?? planData?.remainingDays ?? 30;
  const plannedUrlaub = useMemo(() => {
    if (!planData?.plan?.days) return 0;
    return planData.plan.days.filter((d) => d.type === 'urlaub' && d.reason !== 'Bereits verplant').length;
  }, [planData]);

  const monthBars = useMemo(() => {
    const counts = Array.from({ length: 12 }, () => 0);
    if (!planData?.plan?.days) return counts;
    for (const d of planData.plan.days) {
      if (d.type !== 'urlaub' || d.reason === 'Bereits verplant') continue;
      const m = parseLocalDate(d.date).getMonth();
      counts[m] += 1;
    }
    return counts;
  }, [planData]);

  const maxBar = Math.max(1, ...monthBars);

  const nextVacationDays = useMemo(() => {
    const days = planData?.plan?.days;
    if (!days) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let next: Date | null = null;
    for (const d of days) {
      if (d.type !== 'urlaub' || d.reason === 'Bereits verplant') continue;
      const dt = parseLocalDate(d.date);
      if (dt.getTime() < today.getTime()) continue;
      if (!next || dt < next) next = dt;
    }
    if (!next) return null;
    return Math.ceil((next.getTime() - today.getTime()) / 86400000);
  }, [planData]);

  if (isLoading && hasPlanFlag) {
    return (
      <Card className={cn("flex flex-col", className)}>
        <CardHeader className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-full max-w-xs" />
        </CardHeader>
        <CardContent className="flex-1">
          <Skeleton className="h-32 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (!hasPlanFlag) {
    return (
      <Card
        className={cn("border-primary-100/80 bg-gradient-to-br from-primary-50/80 via-white to-white shadow-sm overflow-hidden flex flex-col", className)}
        hover={false}
      >
        <CardHeader className="pb-2 space-y-1">
          <CardTitle className="text-xl flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary-600" />
            Jahresplaner {year}
          </CardTitle>
          <p className="text-sm text-primary-600 font-medium uppercase tracking-wide">
            Urlaub clever verteilen
          </p>
        </CardHeader>
        <CardContent className="flex-1 space-y-5 pt-0 flex flex-col justify-between">
          <p className="text-sm text-gray-600 leading-relaxed">
            Plane dein Urlaubsjahr in drei kurzen Schritten — inklusive Feiertagen, Brückentagen und
            Schulferien.
          </p>
          <Button asChild className="w-full h-11 text-base font-semibold shadow-sm hover:shadow-md transition-shadow">
            <Link href="/absences/planner">Jetzt planen</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn("border-primary-100/80 bg-gradient-to-br from-primary-50/50 via-white to-white shadow-sm overflow-hidden flex flex-col", className)}
      hover={false}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-xl flex items-center gap-2">
              <Compass className="h-5 w-5 text-primary-600" />
              Jahresplaner {year}
            </CardTitle>
          </div>
          <Button variant="outline" size="sm" asChild className="shrink-0 hover:shadow-md transition-shadow">
            <Link href="/absences/planner">Öffnen</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-0">
        <div className="rounded-xl bg-gray-900 px-4 py-4 text-gray-50">
          <p className="text-3xl font-bold tabular-nums text-white">
            {plannedUrlaub}
            <span className="text-lg font-medium text-gray-400"> / {total}</span>
          </p>
          <p className="text-sm text-gray-300 mt-1">Urlaubstage im Plan</p>
          {nextVacationDays !== null && (
            <p className="text-xs text-primary-300 mt-3 border-t border-gray-700 pt-3">
              Nächster geplanter Tag in{' '}
              <span className="font-semibold text-white">{nextVacationDays}</span> Tagen
            </p>
          )}
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">Verteilung</p>
          <div className="flex h-[4.5rem] items-end gap-1.5 px-0.5">
            {monthBars.map((c, i) => (
              <div
                key={i}
                className="flex-1 min-w-0 h-full flex flex-col justify-end"
                title={`Monat ${i + 1}: ${c} Tage`}
              >
                <div
                  className="w-full rounded-t-md bg-primary-500/90 min-h-[4px] transition-shadow hover:shadow-sm"
                  style={{ height: `${Math.max(6, (c / maxBar) * 72)}px` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1.5 px-0.5 tabular-nums">
            <span>J</span>
            <span>F</span>
            <span>M</span>
            <span>A</span>
            <span>M</span>
            <span>J</span>
            <span>J</span>
            <span>A</span>
            <span>S</span>
            <span>O</span>
            <span>N</span>
            <span>D</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
