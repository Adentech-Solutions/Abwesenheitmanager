'use client';

// ========================================
// FILE: src/app/calendar/page.tsx
// Team Calendar Page - Wer ist wann abwesend?
// ========================================

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Users,
  Filter,
  Download
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isWeekend,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isSameDay
} from 'date-fns';
import { de } from 'date-fns/locale';

interface Absence {
  _id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: 'vacation' | 'sick' | 'training' | 'parental';
  startDate: string;
  endDate: string;
  totalDays: number;
  status: string;
}

export default function CalendarPage() {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  const userRole = (session?.user as any)?.role;
  const isManagerOrAdmin = userRole === 'manager' || userRole === 'admin';

  // Fetch team absences
  const { data: absencesData, isLoading } = useQuery({
    queryKey: ['calendar', 'absences', format(currentDate, 'yyyy-MM'), selectedDepartment],
    queryFn: async () => {
      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);
      
      let url = `/api/absences/team?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
      if (selectedDepartment !== 'all') {
        url += `&department=${selectedDepartment}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch absences');
      }
      return response.json();
    },
    enabled: isManagerOrAdmin,
  });

  const absences: Absence[] = absencesData?.absences || [];

  // Generate calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { locale: de });
  const calendarEnd = endOfWeek(monthEnd, { locale: de });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Helper functions
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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

  const getAbsenceTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      vacation: 'bg-blue-100 text-blue-800',
      sick: 'bg-red-100 text-red-800',
      training: 'bg-green-100 text-green-800',
      parental: 'bg-purple-100 text-purple-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  // Get absences for a specific day
  const getAbsencesForDay = (day: Date) => {
    return absences.filter(absence => {
      const start = new Date(absence.startDate);
      const end = new Date(absence.endDate);
      return day >= start && day <= end;
    });
  };

  // Navigation
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  if (!isManagerOrAdmin) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <CalendarIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Keine Berechtigung
          </h2>
          <p className="text-gray-600">
            Nur Manager und Administratoren können den Team-Kalender einsehen.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CalendarIcon className="h-8 w-8 text-primary-600" />
            Team-Kalender
          </h1>
          <p className="text-gray-600 mt-2">
            Übersicht über alle Team-Abwesenheiten
          </p>
        </div>

        {/* Controls */}
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="text-center min-w-[180px]">
                <h2 className="text-lg font-semibold text-gray-900">
                  {format(currentDate, 'MMMM yyyy', { locale: de })}
                </h2>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={goToNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
              >
                Heute
              </Button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </Card>

        {/* Calendar View */}
        {isLoading ? (
          <Card>
            <Skeleton className="h-[600px] w-full" />
          </Card>
        ) : (
          <Card>
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-t-lg overflow-hidden">
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                <div
                  key={day}
                  className="bg-gray-50 px-2 py-3 text-center text-sm font-semibold text-gray-700"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 border-x border-b border-gray-200 rounded-b-lg overflow-hidden">
              {calendarDays.map((day, dayIdx) => {
                const dayAbsences = getAbsencesForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isTodayDate = isToday(day);
                const isWeekendDay = isWeekend(day);

                return (
                  <div
                    key={day.toString()}
                    className={`
                      min-h-[120px] bg-white p-2
                      ${!isCurrentMonth ? 'bg-gray-50' : ''}
                      ${isTodayDate ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset' : ''}
                      ${isWeekendDay ? 'bg-gray-50' : ''}
                    `}
                  >
                    {/* Day Number */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`
                          text-sm font-medium
                          ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                          ${isTodayDate ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs' : ''}
                        `}
                      >
                        {format(day, 'd')}
                      </span>
                      {dayAbsences.length > 0 && (
                        <span className="text-xs font-semibold text-gray-500">
                          {dayAbsences.length}
                        </span>
                      )}
                    </div>

                    {/* Absences */}
                    <div className="space-y-1">
                      {dayAbsences.slice(0, 3).map((absence) => (
                        <div
                          key={absence._id}
                          className={`
                            text-xs px-2 py-1 rounded truncate
                            ${getAbsenceTypeColor(absence.type)}
                          `}
                          title={`${absence.userName} - ${getAbsenceTypeLabel(absence.type)}`}
                        >
                          {absence.userName.split(' ')[0]}
                        </div>
                      ))}
                      {dayAbsences.length > 3 && (
                        <div className="text-xs text-gray-500 px-2">
                          +{dayAbsences.length - 3} weitere
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Legend */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Legende</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-100"></div>
              <span className="text-sm text-gray-700">Urlaub</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100"></div>
              <span className="text-sm text-gray-700">Krank</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100"></div>
              <span className="text-sm text-gray-700">Fortbildung</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-100"></div>
              <span className="text-sm text-gray-700">Elternzeit</span>
            </div>
          </div>
        </Card>

        {/* Absences List */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Abwesenheiten in {format(currentDate, 'MMMM yyyy', { locale: de })}
          </h3>
          
          {absences.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Keine Abwesenheiten</p>
              <p className="text-sm mt-1">
                In diesem Monat sind keine Abwesenheiten geplant
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {absences
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                .map((absence) => (
                  <div
                    key={absence._id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary-100 text-primary-600">
                          {getInitials(absence.userName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {absence.userName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(absence.startDate), 'dd.MM.yyyy', { locale: de })}
                          {' - '}
                          {format(new Date(absence.endDate), 'dd.MM.yyyy', { locale: de })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        absence.type === 'vacation' ? 'info' :
                        absence.type === 'sick' ? 'danger' :
                        absence.type === 'training' ? 'success' : 'warning'
                      }>
                        {getAbsenceTypeLabel(absence.type)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {absence.totalDays} {absence.totalDays === 1 ? 'Tag' : 'Tage'}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}