'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isToday, isWeekend, addMonths, subMonths,
  startOfWeek, endOfWeek,
} from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Check, ChevronDown, Users, Building2 } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// ── Inline Department Filter ──────────────────────────────────────────────
function getDeptColor(name: string) {
  const palette = [
    { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400' },
    { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-400' },
    { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
    { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
    { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-400' },
    { bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-400' },
    { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-400' },
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function getDeptInitials(name: string) {
  const words = name.trim().split(/\s+/);
  return words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

function DepartmentFilter({ departments, selected, onChange, isLoading }: {
  departments: string[]; selected: string; onChange: (v: string) => void; isLoading?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const selectedColor = selected !== 'all' ? getDeptColor(selected) : null;
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className={cn(
          'flex items-center gap-2 h-9 px-3 rounded-lg border text-sm font-medium transition-all outline-none',
          'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50',
          open && 'border-primary-300 bg-primary-50 text-primary-700',
          isLoading && 'opacity-50 pointer-events-none'
        )}>
          {selected === 'all' ? (
            <div className="flex items-center justify-center w-5 h-5 rounded bg-gray-100">
              <Users className="h-3 w-3 text-gray-500" />
            </div>
          ) : (
            <div className={cn('flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold', selectedColor?.bg, selectedColor?.text)}>
              {getDeptInitials(selected)}
            </div>
          )}
          <span className="max-w-[140px] truncate">{selected === 'all' ? 'Alle Abteilungen' : selected}</span>
          {selected === 'all' && departments.length > 0 && (
            <span className="text-xs text-gray-400 font-normal">({departments.length})</span>
          )}
          <ChevronDown className={cn('h-3.5 w-3.5 text-gray-400 transition-transform duration-150', open && 'rotate-180')} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-56 p-1.5 shadow-lg border border-gray-200 rounded-xl">
        <DropdownMenuLabel className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Abteilung</DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1 bg-gray-100" />
        <DropdownMenuItem onSelect={() => { onChange('all'); setOpen(false); }}
          className={cn('flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer text-sm',
            selected === 'all' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50')}>
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-gray-100 shrink-0">
            <Users className="h-3.5 w-3.5 text-gray-500" />
          </div>
          <span className="flex-1">Alle Abteilungen</span>
          {selected === 'all' && <Check className="h-3.5 w-3.5 text-primary-600 shrink-0" />}
        </DropdownMenuItem>
        {isLoading ? (
          <div className="py-3 px-2 space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-gray-100 animate-pulse shrink-0" />
                <div className="h-3 bg-gray-100 rounded animate-pulse flex-1" />
              </div>
            ))}
          </div>
        ) : departments.length === 0 ? (
          <div className="py-4 text-center">
            <Building2 className="h-5 w-5 text-gray-300 mx-auto mb-1" />
            <p className="text-xs text-gray-400">Keine Abteilungen</p>
          </div>
        ) : departments.map(dept => {
          const color = getDeptColor(dept);
          const isSelected = selected === dept;
          return (
            <DropdownMenuItem key={dept} onSelect={() => { onChange(dept); setOpen(false); }}
              className={cn('flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer text-sm',
                isSelected ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50')}>
              <div className={cn('flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold shrink-0', color.bg, color.text)}>
                {getDeptInitials(dept)}
              </div>
              <span className="flex-1 truncate">{dept}</span>
              {!isSelected && <div className={cn('w-1.5 h-1.5 rounded-full shrink-0 opacity-60', color.dot)} />}
              {isSelected && <Check className="h-3.5 w-3.5 text-primary-600 shrink-0" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

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
  const [selectedDepartment, setSelectedDepartment] = useState<string>('own');

  const userRole = (session?.user as any)?.role;
  const isManagerOrAdmin = userRole === 'manager' || userRole === 'admin';
  const userDepartment = (session?.user as any)?.department;

  // ✅ FIX: Abteilungen für ALLE User laden (nicht nur Manager)
  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await fetch('/api/departments');
      if (!res.ok) return { departments: [] };
      return res.json();
    },
    enabled: isManagerOrAdmin, // Manager sehen alle, normale User bekommen 'own' default
  });

  // ✅ FIX: Kalender-API für alle User zugänglich
  const { data: absencesData, isLoading } = useQuery({
    queryKey: ['calendar', 'absences', format(currentDate, 'yyyy-MM'), selectedDepartment],
    queryFn: async () => {
      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);
      let url = `/api/calendar/team?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;

      // Manager/Admin: nach Abteilung filtern; normaler User: nur seine Abteilung
      if (isManagerOrAdmin) {
        if (selectedDepartment !== 'all') url += `&department=${selectedDepartment}`;
      } else {
        // Normaler User sieht nur seine Abteilung
        if (userDepartment) url += `&department=${userDepartment}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch absences');
      return response.json();
    },
  });

  const absences: Absence[] = absencesData?.absences || [];

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { locale: de });
  const calendarEnd = endOfWeek(monthEnd, { locale: de });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getAbsenceTypeLabel = (type: string) =>
    ({ vacation: 'Urlaub', sick: 'Krank', training: 'Fortbildung', parental: 'Elternzeit' }[type] || type);

  const getAbsenceTypeColor = (type: string) => ({
    vacation: 'bg-blue-100 text-blue-800',
    sick: 'bg-red-100 text-red-800',
    training: 'bg-green-100 text-green-800',
    parental: 'bg-purple-100 text-purple-800',
  }[type] || 'bg-gray-100 text-gray-800');

  const getAbsencesForDay = (day: Date) =>
    absences.filter(a => day >= new Date(a.startDate) && day <= new Date(a.endDate));

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-primary-600" />
            {isManagerOrAdmin ? 'Team-Kalender' : 'Abteilungs-Kalender'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isManagerOrAdmin
              ? 'Übersicht über alle Team-Abwesenheiten'
              : `Abwesenheiten in deiner Abteilung${userDepartment ? ` (${userDepartment})` : ''}`
            }
          </p>
        </div>

        {/* Controls */}
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-gray-500" />
              </button>
              <div className="min-w-[160px] text-center">
                <h2 className="text-base font-semibold text-gray-900">
                  {format(currentDate, 'MMMM yyyy', { locale: de })}
                </h2>
              </div>
              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-gray-500" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
              >
                Heute
              </button>
            </div>

            {/* ✅ FIX: Dropdown nur für Manager/Admin; Export vorerst ausgeblendet */}
            <div className="flex items-center gap-2">
              {isManagerOrAdmin && (
                <DepartmentFilter
                  departments={departmentsData?.departments || []}
                  selected={selectedDepartment}
                  onChange={setSelectedDepartment}
                  isLoading={!departmentsData}
                />
              )}
              {/* Export Button — vorerst ausgeblendet bis implementiert
              <button className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                <Download className="h-4 w-4" /> Export
              </button>
              */}
            </div>
          </div>
        </Card>

        {/* Calendar Grid */}
        {isLoading ? (
          <Card><Skeleton className="h-[600px] w-full" /></Card>
        ) : (
          <Card>
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-px bg-gray-100 border border-gray-200 rounded-t-lg overflow-hidden">
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
                <div key={day} className="bg-gray-50 px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {day}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-px bg-gray-100 border-x border-b border-gray-200 rounded-b-lg overflow-hidden">
              {calendarDays.map(day => {
                const dayAbsences = getAbsencesForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isTodayDate = isToday(day);
                const isWeekendDay = isWeekend(day);

                return (
                  <div
                    key={day.toString()}
                    className={[
                      'min-h-[100px] bg-white p-1.5',
                      !isCurrentMonth && 'bg-gray-50',
                      isTodayDate && 'ring-2 ring-primary-500 ring-inset bg-primary-50/30',
                      isWeekendDay && !isTodayDate && 'bg-gray-50/60',
                    ].filter(Boolean).join(' ')}
                  >
                    <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isTodayDate ? 'bg-primary-600 text-white' : isCurrentMonth ? 'text-gray-700' : 'text-gray-300'
                      }`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-0.5">
                      {dayAbsences.slice(0, 3).map(absence => (
                        <div
                          key={absence._id}
                          className={`text-xs px-1.5 py-0.5 rounded truncate ${getAbsenceTypeColor(absence.type)}`}
                          title={`${absence.userName} — ${getAbsenceTypeLabel(absence.type)}`}
                        >
                          {absence.userName.split(' ')[0]}
                        </div>
                      ))}
                      {dayAbsences.length > 3 && (
                        <div className="text-xs text-gray-400 px-1">+{dayAbsences.length - 3}</div>
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
          <div className="flex items-center gap-6 flex-wrap">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Legende</span>
            {[
              { type: 'vacation', label: 'Urlaub' },
              { type: 'sick', label: 'Krank' },
              { type: 'training', label: 'Fortbildung' },
              { type: 'parental', label: 'Elternzeit' },
            ].map(({ type, label }) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded ${getAbsenceTypeColor(type).split(' ')[0]}`} />
                <span className="text-xs text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Absence List for current month */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Abwesenheiten im {format(currentDate, 'MMMM yyyy', { locale: de })}
          </h2>
          {absences.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 py-10 text-center">
              <CalendarIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Keine Abwesenheiten in diesem Monat</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {absences.map(absence => (
                <div key={absence._id} className="flex items-center gap-4 px-4 py-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary-100 text-primary-700">
                      {getInitials(absence.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{absence.userName}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(absence.startDate), 'dd.MM.')} – {format(new Date(absence.endDate), 'dd.MM.yyyy')}
                      {' · '}{absence.totalDays} Tage
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getAbsenceTypeColor(absence.type)}`}>
                    {getAbsenceTypeLabel(absence.type)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}