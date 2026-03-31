'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isToday, isWeekend, addMonths, subMonths,
  startOfWeek, endOfWeek,
} from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Check, ChevronDown, Users, Building2, MapPin, Info } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { getGermanHolidays, GermanState } from '@/lib/utils/holidays';

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
          'flex items-center gap-2 h-10 px-4 rounded-xl border text-sm font-bold transition-all outline-none shadow-sm',
          'border-gray-200 bg-white text-gray-700 hover:border-primary-200 hover:bg-primary-50/30',
          open && 'border-primary-500 ring-4 ring-primary-500/10 text-primary-700',
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
          <ChevronDown className={cn('h-3.5 w-3.5 text-gray-400 transition-transform duration-200', open && 'rotate-180 text-primary-500')} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-64 p-2 shadow-xl border border-gray-100 rounded-2xl animate-in fade-in zoom-in-95 duration-200">
        <DropdownMenuLabel className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Abteilung wählen</DropdownMenuLabel>
        <DropdownMenuSeparator className="mx-2 my-1 bg-gray-50" />
        <DropdownMenuItem onSelect={() => { onChange('all'); setOpen(false); }}
          className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm mb-1 transition-colors',
            selected === 'all' ? 'bg-primary-50 text-primary-700 font-bold' : 'text-gray-600 hover:bg-gray-50')}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-gray-100 shadow-sm shrink-0">
            <Users className="h-4 w-4 text-gray-400" />
          </div>
          <span className="flex-1">Alle Abteilungen</span>
          {selected === 'all' && <Check className="h-4 w-4 text-primary-600 shrink-0" />}
        </DropdownMenuItem>
        {isLoading ? (
          <div className="py-3 px-3 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 animate-pulse shrink-0" />
                <div className="h-3 bg-gray-50 rounded animate-pulse flex-1" />
              </div>
            ))}
          </div>
        ) : departments.length === 0 ? (
          <div className="py-6 text-center">
            <div className="inline-flex p-3 bg-gray-50 rounded-full mb-2">
              <Building2 className="h-5 w-5 text-gray-300" />
            </div>
            <p className="text-xs text-gray-400 font-medium">Keine Abteilungen gefunden</p>
          </div>
        ) : departments.map(dept => {
          const color = getDeptColor(dept);
          const isSelected = selected === dept;
          return (
            <DropdownMenuItem key={dept} onSelect={() => { onChange(dept); setOpen(false); }}
              className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm mb-1 transition-colors',
                isSelected ? 'bg-primary-50 text-primary-700 font-bold' : 'text-gray-600 hover:bg-gray-50')}>
              <div className={cn('flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold shrink-0 border border-white shadow-sm', color.bg, color.text)}>
                {getDeptInitials(dept)}
              </div>
              <span className="flex-1 truncate">{dept}</span>
              {isSelected && <Check className="h-4 w-4 text-primary-600 shrink-0" />}
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

const TYPE_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; colorClass: string; dotClass: string }> = {
  vacation: { label: 'Urlaub', variant: 'success', colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-100', dotClass: 'bg-emerald-400' },
  sick: { label: 'Krank', variant: 'danger', colorClass: 'bg-rose-50 text-rose-800 border-rose-100', dotClass: 'bg-rose-400' },
  training: { label: 'Fortbildung', variant: 'info', colorClass: 'bg-sky-50 text-sky-800 border-sky-100', dotClass: 'bg-sky-400' },
  parental: { label: 'Elternzeit', variant: 'warning', colorClass: 'bg-amber-50 text-amber-800 border-amber-100', dotClass: 'bg-amber-400' },
};

export default function CalendarPage() {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  const userRole = (session?.user as any)?.role;
  const isManagerOrAdmin = userRole === 'manager' || userRole === 'admin';
  const userDepartment = (session?.user as any)?.department;

  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await fetch('/api/departments');
      if (!res.ok) return { departments: [] };
      return res.json();
    },
    enabled: isManagerOrAdmin,
  });

  const { data: companySettings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings/company');
      if (!res.ok) throw new Error('Failed to fetch company settings');
      return res.json();
    },
  });

  const { data: absencesData, isLoading } = useQuery({
    queryKey: ['calendar', 'absences', format(currentDate, 'yyyy-MM'), selectedDepartment],
    queryFn: async () => {
      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);
      let url = `/api/calendar/team?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;

      if (isManagerOrAdmin) {
        if (selectedDepartment !== 'all') url += `&department=${selectedDepartment}`;
      } else {
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

  // Calculate holidays for the current month
  const userState = (companySettings?.settings?.state as GermanState) || 'BY'; // Default to Bavaria
  const year = currentDate.getFullYear();
  const allHolidays = getGermanHolidays(year, userState);
  const monthHolidays = allHolidays.filter(holiday => 
    holiday.date >= calendarStart && holiday.date <= calendarEnd
  );

  const getHolidayForDay = (day: Date) => 
    monthHolidays.find(holiday => 
      format(holiday.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    );

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getAbsenceTypeLabel = (type: string) => TYPE_CONFIG[type]?.label || type;
  const getAbsenceTypeColors = (type: string) => TYPE_CONFIG[type] || { colorClass: 'bg-gray-50 text-gray-700 border-gray-100', dotClass: 'bg-gray-400' };

  const getAbsencesForDay = (day: Date) =>
    absences.filter(a => day >= new Date(a.startDate) && day <= new Date(a.endDate));

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-500">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
              <CalendarIcon className="h-7 w-7 text-primary-600" />
              {isManagerOrAdmin ? 'Team-Kalender' : 'Abteilungs-Kalender'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isManagerOrAdmin
                ? 'Übersicht über alle Team-Abwesenheiten'
                : `Abwesenheiten in deiner Abteilung${userDepartment ? ` (${userDepartment})` : ''}`
              }
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isManagerOrAdmin && (
              <DepartmentFilter
                departments={departmentsData?.departments || []}
                selected={selectedDepartment}
                onChange={setSelectedDepartment}
                isLoading={!departmentsData}
              />
            )}
            <Button
              variant="outline"
              onClick={() => setCurrentDate(new Date())}
              className="h-10 px-4 rounded-xl border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold shadow-sm transition-all"
            >
              Heute
            </Button>
          </div>
        </div>

        {/* Calendar Nav & Content */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
          
          <div className="xl:col-span-3 space-y-6">
            {/* Calendar Controls */}
            <Card className="p-2 overflow-hidden border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between px-2 py-1">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-bold text-gray-900 min-w-[160px] tracking-tight">
                    {format(currentDate, 'MMMM yyyy', { locale: de })}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                    className="h-10 w-10 p-0 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                    className="h-10 w-10 p-0 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Calendar Grid */}
            <Card className="p-0 overflow-hidden border-gray-100 shadow-lg hover:shadow-xl transition-shadow group">
              {isLoading ? (
                <div className="h-[600px] flex items-center justify-center bg-gray-50/50">
                  <LoadingSpinner text="Kalender wird aktualisiert..." />
                </div>
              ) : (
                <div className="select-none">
                  {/* Weekday Headers */}
                  <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
                    {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
                      <div key={day} className="py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Days */}
                  <div className="grid grid-cols-7 gap-px bg-gray-100 auto-rows-fr">
                    {calendarDays.map((day, idx) => {
                      const dayAbsences = getAbsencesForDay(day);
                      const dayHoliday = getHolidayForDay(day);
                      const isCurrentMonth = isSameMonth(day, currentDate);
                      const isTodayDate = isToday(day);
                      const isWeekendDay = isWeekend(day);

                      return (
                        <div
                          key={day.toString()}
                          className={cn(
                            'min-h-[110px] bg-white p-2 transition-colors relative group/day',
                            !isCurrentMonth && 'bg-gray-50/80',
                            isTodayDate && 'bg-primary-50/20',
                            isWeekendDay && !isTodayDate && !isCurrentMonth && 'bg-gray-100/50',
                            dayHoliday && 'bg-primary-50/50',
                            "animate-in fade-in duration-500 fill-mode-both",
                            `delay-[${Math.min(idx * 5, 200)}ms]`
                          )}
                          title={dayHoliday ? dayHoliday.name : undefined}
                        >
                          <div className={cn(
                            "inline-flex items-center justify-center w-7 h-7 text-xs font-bold rounded-xl mb-2 transition-all shadow-sm",
                            isTodayDate ? "bg-primary-600 text-white shadow-primary-200" : 
                            isCurrentMonth ? "text-gray-900 group-hover/day:bg-gray-50" : "text-gray-300"
                          )}>
                            {format(day, 'd')}
                          </div>
                          
                          <div className="space-y-1">
                            {dayAbsences.slice(0, 3).map(absence => {
                               const colors = getAbsenceTypeColors(absence.type);
                               return (
                                <div
                                  key={absence._id}
                                  className={cn(
                                    "text-[10px] font-bold px-2 py-1 rounded-lg truncate border shadow-xs transition-transform hover:scale-[1.02] cursor-default",
                                    colors.colorClass
                                  )}
                                  title={`${absence.userName} — ${getAbsenceTypeLabel(absence.type)}`}
                                >
                                  {absence.userName.split(' ')[0]}
                                </div>
                              );
                            })}
                            {dayAbsences.length > 3 && (
                              <div className="text-[10px] font-bold text-gray-400 px-2 py-0.5 bg-gray-50 rounded-lg inline-block">
                                +{dayAbsences.length - 3} weitere
                              </div>
                            )}
                            
                            {/* Holiday display - appears below absences */}
                            {dayHoliday && (
                              <div
                                className="text-[9px] font-bold text-primary-700 px-2 py-1 bg-primary-100/80 rounded-lg inline-block border border-primary-200/50 truncate max-w-full"
                                title={dayHoliday.name}
                              >
                                {dayHoliday.name.length > 8 ? `${dayHoliday.name.substring(0, 6)}...` : dayHoliday.name}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            {/* Legend Card */}
            <Card className="p-6 hover:shadow-md transition-all border-gray-100 bg-white/50 backdrop-blur-sm">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Info className="h-3 w-3" />
                Legende
              </h3>
              <div className="space-y-3">
                {Object.entries(TYPE_CONFIG).map(([type, config]) => (
                  <div key={type} className="flex items-center justify-between group cursor-default">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2.5 h-2.5 rounded-full shadow-sm group-hover:scale-125 transition-transform", config.dotClass)} />
                      <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">{config.label}</span>
                    </div>
                    <Badge variant={config.variant as any} className="h-4 px-1.5 text-[9px] font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                      Aktiv
                    </Badge>
                  </div>
                ))}
                
                {/* Holiday Legend */}
                <div className="flex items-center justify-between group cursor-default pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary-400 shadow-sm group-hover:scale-125 transition-transform" />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Feiertag</span>
                  </div>
                  <Badge variant="default" className="h-4 px-1.5 text-[9px] font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity bg-primary-100 text-primary-700 border-primary-200">
                    {userState}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Summary List */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 tracking-tight flex items-center gap-2 px-1">
                <Users className="h-4 w-4 text-primary-600" />
                Monatsübersicht
              </h3>
              
              <div className="space-y-2">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="p-3 bg-gray-50/50 border-gray-100">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-xl" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-3 w-2/3" />
                          <Skeleton className="h-2 w-1/2" />
                        </div>
                      </div>
                    </Card>
                  ))
                ) : absences.length === 0 ? (
                  <div className="bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 py-10 text-center animate-in fade-in duration-700">
                    <CalendarIcon className="h-8 w-8 text-gray-300 mx-auto mb-2 opacity-50" />
                    <p className="text-xs text-gray-400 font-medium">Bisher keine Einträge</p>
                  </div>
                ) : (
                  absences.map((absence, idx) => {
                    const colors = getAbsenceTypeColors(absence.type);
                    return (
                      <div 
                        key={absence._id} 
                        className={cn(
                          "bg-white rounded-2xl border border-gray-100 p-3 flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all shadow-sm animate-in fade-in slide-in-from-right-4 fill-mode-both",
                          `delay-[${idx * 30}ms]`
                        )}
                      >
                        <Avatar className="h-9 w-9 rounded-xl border border-white shadow-sm ring-1 ring-gray-100">
                          <AvatarFallback className="bg-primary-50 text-primary-600 font-bold text-xs">
                            {getInitials(absence.userName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate tracking-tight">{absence.userName}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                            <span className="text-primary-500 font-black">{absence.totalDays}d</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 truncate max-w-[100px]">
                              {format(new Date(absence.startDate), 'dd.MM.')} – {format(new Date(absence.endDate), 'dd.MM.')}
                            </span>
                          </div>
                        </div>
                        <Badge variant={colors.variant as any} className="h-5 px-1.5 text-[9px] font-bold uppercase tracking-widest shrink-0">
                          {getAbsenceTypeLabel(absence.type)}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}