'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/Button';
import { Users, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function TeamOverview() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;

  const { data: teamData, isLoading } = useQuery({
    queryKey: ['team', 'absences', 'today'],
    enabled: userRole === 'manager' || userRole === 'admin',
    queryFn: async () => {
      const response = await fetch('/api/calendar/team/today');
      if (!response.ok) {
        if (response.status === 404) return { absentToday: [], totalTeam: 0 };
        throw new Error('Failed to fetch team data');
      }
      return response.json();
    },
    retry: false,
  });

  // Only show for managers and admins
  if (userRole !== 'manager' && userRole !== 'admin') {
    return null;
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAbsenceTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      vacation: 'Urlaub',
      sick: 'Krank',
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const absentToday = teamData?.absentToday || [];
  const totalTeam = teamData?.totalTeam || 0;
  const presentToday = totalTeam - absentToday.length;

  return (
    <Card className="hover:shadow-md transition-all">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-600" />
              Team-Übersicht
            </CardTitle>
            <p className="text-sm text-gray-500 font-medium">Wer ist heute abwesend?</p>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-wider">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {presentToday} Anwesend
            </div>
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border",
              absentToday.length > 0 
                ? "bg-amber-50 text-amber-700 border-amber-100/50" 
                : "bg-gray-50 text-gray-500 border-gray-100"
            )}>
              <span className={cn(
                "w-1.5 h-1.5 rounded-full",
                absentToday.length > 0 ? "bg-amber-500" : "bg-gray-300"
              )} />
              {absentToday.length} Abwesend
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {absentToday.length === 0 ? (
          <div className="text-center py-12 px-6 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <div className="h-16 w-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 scale-in-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Vollzählig!</h4>
            <p className="text-xs text-gray-500 mt-2 font-medium max-w-[200px] mx-auto leading-relaxed">
              Dein gesamtes Team ist heute anwesend.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {absentToday.map((absence: any, index: number) => (
              <div
                key={absence.userId}
                className={cn(
                  "group flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white hover:border-primary-100 hover:bg-primary-50/10 transition-all animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-both",
                  `delay-[${index * 100}ms]`
                )}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10 border-2 border-white shadow-sm transition-transform group-hover:scale-105">
                    <AvatarFallback className="bg-primary-50 text-primary-700 font-bold text-xs">
                      {getInitials(absence.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-sm text-gray-900 leading-tight group-hover:text-primary-700 transition-colors">
                      {absence.userName}
                    </p>
                    <p className="text-[11px] text-gray-500 font-medium mt-0.5">{absence.userEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={getAbsenceTypeVariant(absence.type)} className="shadow-none font-bold uppercase text-[9px] tracking-widest px-2.5">
                    {getAbsenceTypeLabel(absence.type)}
                  </Badge>
                  <div className="text-right h-8 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                      {absence.totalDays} {absence.totalDays === 1 ? 'Tag' : 'Tage'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalTeam > 0 && (
          <Button asChild variant="ghost" className="w-full h-11 rounded-xl text-primary-600 hover:text-primary-700 hover:bg-primary-50 border border-transparent hover:border-primary-100 transition-all font-bold text-sm group">
            <Link href="/calendar" className="flex items-center justify-center gap-2">
              <Calendar className="h-4 w-4" />
              Details im Team-Kalender
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}