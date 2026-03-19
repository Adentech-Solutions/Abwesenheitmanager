'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import StatsCard from '@/components/shared/StatsCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar, Clock, CheckCircle2, XCircle, FileText, Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Absence {
  _id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reason?: string;
  isHalfDay: boolean;
  halfDayPeriod?: 'morning' | 'afternoon';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export default function AbsencesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const { data: absencesData, isLoading } = useQuery({
    queryKey: ['absences', 'my', selectedStatus, selectedType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedType !== 'all') params.append('type', selectedType);
      const response = await fetch(`/api/absences${params.toString() ? `?${params}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch absences');
      return response.json();
    },
  });

  const absences: Absence[] = absencesData?.absences || [];

  const getAbsenceTypeLabel = (type: string) => ({
    vacation: 'Urlaub', sick: 'Krankheit', training: 'Fortbildung', parental: 'Elternzeit',
  }[type] || type);

  const getStatusLabel = (status: string) => ({
    pending: 'Ausstehend', approved: 'Genehmigt', rejected: 'Abgelehnt', cancelled: 'Storniert',
  }[status] || status);

  const getStatusVariant = (status: string) => ({
    approved: 'success', pending: 'warning', rejected: 'danger', cancelled: 'outline'
  }[status] as any || 'default');

  const handleDelete = async (absenceId: string) => {
    if (!confirm('Möchtest du diese Abwesenheit wirklich stornieren?')) return;
    try {
      const response = await fetch(`/api/absences/${absenceId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete absence');
      toast.success('Abwesenheit storniert');
      queryClient.invalidateQueries({ queryKey: ['absences'] });
    } catch {
      toast.error('Fehler beim Stornieren');
    }
  };

  const stats = {
    total: absences.length,
    pending: absences.filter(a => a.status === 'pending').length,
    approved: absences.filter(a => a.status === 'approved').length,
    rejected: absences.filter(a => a.status === 'rejected').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary-600" />
              Meine Abwesenheiten
            </h1>
            <p className="text-sm text-gray-500 mt-1">Übersicht über alle deine Abwesenheitsanträge</p>
          </div>
          <Button 
            onClick={() => router.push('/absences/new')}
            className="shadow-sm hover:shadow transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            Neue Abwesenheit
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard 
            title="Gesamt" 
            value={isLoading ? '-' : stats.total} 
            icon={FileText} 
            color="text-gray-500" 
            bgColor="bg-gray-50"
            delay="delay-0"
          />
          <StatsCard 
            title="Ausstehend" 
            value={isLoading ? '-' : stats.pending} 
            icon={Clock} 
            color="text-amber-600" 
            bgColor="bg-amber-50"
            delay="delay-75"
          />
          <StatsCard 
            title="Genehmigt" 
            value={isLoading ? '-' : stats.approved} 
            icon={CheckCircle2} 
            color="text-emerald-600" 
            bgColor="bg-emerald-50"
            delay="delay-150"
          />
          <StatsCard 
            title="Abgelehnt" 
            value={isLoading ? '-' : stats.rejected} 
            icon={XCircle} 
            color="text-rose-600" 
            bgColor="bg-rose-50"
            delay="delay-[225ms]"
          />
        </div>

        {/* Filters */}
        <Card className="hover:shadow-md transition-all">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex gap-1">
              {['all', 'pending', 'approved', 'rejected'].map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedStatus(s)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-lg transition-all",
                    selectedStatus === s
                      ? "bg-primary-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {{ all: 'Alle', pending: 'Ausstehend', approved: 'Genehmigt', rejected: 'Abgelehnt' }[s]}
                </button>
              ))}
            </div>
            <select
              className="ml-auto text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-600 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
            >
              <option value="all">Alle Typen</option>
              <option value="vacation">Urlaub</option>
              <option value="sick">Krankheit</option>
              <option value="training">Fortbildung</option>
              <option value="parental">Elternzeit</option>
            </select>
          </div>
        </Card>

        {/* List */}
        {isLoading ? (
          <div className="py-12">
            <LoadingSpinner text="Abwesenheiten werden geladen..." />
          </div>
        ) : absences.length === 0 ? (
          <Card className="hover:shadow-md transition-all">
            <div className="py-16 text-center">
              <Calendar className="h-12 w-12 text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 tracking-tight">Keine Abwesenheiten</h3>
              <p className="text-gray-500 text-sm mt-1 mb-6">Du hast noch keine Abwesenheiten beantragt</p>
              <Button 
                onClick={() => router.push('/absences/new')}
                className="shadow-sm hover:shadow transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                Erste Abwesenheit beantragen
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {absences.map((absence, idx) => (
              <Card 
                key={absence._id} 
                className={cn(
                  "hover:shadow-md hover:-translate-y-0.5 transition-all animate-in fade-in slide-in-from-bottom-2 fill-mode-both",
                  `delay-[${idx * 50}ms]`
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{getAbsenceTypeLabel(absence.type)}</span>
                      <Badge variant={getStatusVariant(absence.status)}>
                        {getStatusLabel(absence.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5 py-1 px-2 bg-gray-50 rounded-md">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span className="font-medium">
                          {format(new Date(absence.startDate), 'dd. MMM yyyy', { locale: de })}
                          {' → '}
                          {format(new Date(absence.endDate), 'dd. MMM yyyy', { locale: de })}
                        </span>
                      </div>
                      <span className="text-gray-300">|</span>
                      <div className="flex items-center gap-1.5 py-1 px-2 bg-gray-50 rounded-md">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        <span className="font-medium">{absence.totalDays} {absence.totalDays === 1 ? 'Tag' : 'Tage'}</span>
                      </div>
                    </div>
                    {absence.reason && (
                      <p className="text-sm text-gray-600 bg-gray-50/50 p-2 rounded-lg italic border-l-2 border-gray-100">
                        {absence.reason}
                      </p>
                    )}
                    {absence.status === 'rejected' && absence.rejectionReason && (
                      <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg">
                        <p className="text-sm text-rose-700">
                          <span className="font-semibold">Grund:</span> {absence.rejectionReason}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 flex items-center gap-1.5">
                      <span className="inline-block w-1 h-1 rounded-full bg-gray-300" />
                      Beantragt am {format(new Date(absence.createdAt), 'dd.MM.yyyy', { locale: de })}
                    </p>
                  </div>
                  {(absence.status === 'pending' || (absence.status === 'approved' && new Date(absence.startDate) > new Date())) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(absence._id)}
                      className="text-rose-600 hover:text-white hover:bg-rose-600 border-rose-200 hover:border-rose-600 transition-all shrink-0 shadow-sm"
                    >
                      <XCircle className="h-4 w-4 mr-1.5" />
                      Stornieren
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}