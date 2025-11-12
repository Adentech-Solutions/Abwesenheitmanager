'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Calendar } from 'lucide-react';

export default function TeamOverview() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;

  // Only show for managers and admins
  if (userRole !== 'manager' && userRole !== 'admin') {
    return null;
  }

  const { data: teamData, isLoading } = useQuery({
    queryKey: ['team', 'absences', 'today'],
    queryFn: async () => {
      const response = await fetch('/api/calendar/team/today');
      if (!response.ok) {
        // If endpoint doesn't exist yet, return empty data
        if (response.status === 404) return { absentToday: [], totalTeam: 0 };
        throw new Error('Failed to fetch team data');
      }
      return response.json();
    },
    retry: false,
  });

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
        <Skeleton className="h-6 w-40 mb-2" />
        <Skeleton className="h-4 w-56 mb-4" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  const absentToday = teamData?.absentToday || [];
  const totalTeam = teamData?.totalTeam || 0;
  const presentToday = totalTeam - absentToday.length;

  return (
    <Card>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-600" />
              Team-Übersicht
            </h3>
            <p className="text-sm text-gray-600 mt-1">Wer ist heute abwesend?</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-gray-600">
                {presentToday} Anwesend
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <span className="text-gray-600">
                {absentToday.length} Abwesend
              </span>
            </div>
          </div>
        </div>

        {/* List */}
        {absentToday.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">Alle da! 🎉</p>
            <p className="text-sm mt-1">Dein Team ist heute vollständig anwesend</p>
          </div>
        ) : (
          <div className="space-y-3">
            {absentToday.map((absence: any) => (
              <div
                key={absence.userId}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary-100 text-primary-600">
                      {getInitials(absence.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm text-gray-900">{absence.userName}</p>
                    <p className="text-xs text-gray-500">{absence.userEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getAbsenceTypeVariant(absence.type)}>
                    {getAbsenceTypeLabel(absence.type)}
                  </Badge>
                  <div className="text-xs text-gray-500 text-right">
                    <p>{absence.totalDays} {absence.totalDays === 1 ? 'Tag' : 'Tage'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Action */}
        {totalTeam > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <a
              href="/calendar"
              className="flex items-center justify-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              <Calendar className="h-4 w-4" />
              Vollständige Team-Übersicht anzeigen
            </a>
          </div>
        )}
      </div>
    </Card>
  );
}