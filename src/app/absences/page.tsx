'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { format, isBefore, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import StatsCard from '@/components/shared/StatsCard';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Plus,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseLocalDate } from '@/lib/utils/localDate';

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

/** ISO-Strings aus der API ohne TZ-Verschiebung (YYYY-MM-DD aus DateTime) */
function formatApiDate(s: string, pattern: string) {
  const ymd = s.slice(0, 10);
  return format(parseLocalDate(ymd), pattern, { locale: de });
}

export default function AbsencesPage() {
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

  const getAbsenceTypeLabel = (type: string) =>
    ({
      vacation: 'Urlaub',
      sick: 'Krankheit',
      training: 'Fortbildung',
      parental: 'Elternzeit',
    })[type] || type;

  const getStatusLabel = (status: string) =>
    ({
      pending: 'Ausstehend',
      approved: 'Genehmigt',
      rejected: 'Abgelehnt',
      cancelled: 'Storniert',
    })[status] || status;

  const getStatusVariant = (status: string) =>
    ({
      approved: 'success',
      pending: 'warning',
      rejected: 'danger',
      cancelled: 'outline',
    }[status] as 'success' | 'warning' | 'danger' | 'outline' | 'default') || 'default';

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

  const stats = useMemo(
    () => ({
      total: absences.length,
      pending: absences.filter((a) => a.status === 'pending').length,
      approved: absences.filter((a) => a.status === 'approved').length,
      rejected: absences.filter((a) => a.status === 'rejected').length,
    }),
    [absences]
  );

  const statusTabs = [
    { id: 'all', label: 'Alle' },
    { id: 'pending', label: 'Ausstehend' },
    { id: 'approved', label: 'Genehmigt' },
    { id: 'rejected', label: 'Abgelehnt' },
  ] as const;

  const typeOptions = [
    { value: 'all', label: 'Alle Typen' },
    { value: 'vacation', label: 'Urlaub' },
    { value: 'sick', label: 'Krankheit' },
    { value: 'training', label: 'Fortbildung' },
    { value: 'parental', label: 'Elternzeit' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        <section className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
                  <Calendar className="h-5 w-5 text-primary-600" />
                </span>
                Meine Abwesenheiten
              </h1>
              <p className="text-sm text-gray-600 mt-2 max-w-xl">
                Übersicht über alle deine Abwesenheitsanträge — Status filtern, neu beantragen oder den
                Jahresplaner nutzen.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Button
                variant="default"
                onClick={() => router.push('/absences/planner')}
                className="hover:shadow-md transition-shadow"
              >
                Jahresplaner
              </Button>
              <Button
                onClick={() => router.push('/absences/new')}
                className="hover:shadow-md transition-shadow"
              >
                <Plus className="h-4 w-4 mr-2" />
                Neue Abwesenheit
              </Button>
            </div>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Gesamt"
            value={isLoading ? '—' : stats.total}
            icon={FileText}
            color="text-gray-600"
            bgColor="bg-gray-50"
          />
          <StatsCard
            title="Ausstehend"
            value={isLoading ? '—' : stats.pending}
            icon={Clock}
            color="text-warning-600"
            bgColor="bg-warning-50"
          />
          <StatsCard
            title="Genehmigt"
            value={isLoading ? '—' : stats.approved}
            icon={CheckCircle2}
            color="text-success-600"
            bgColor="bg-success-50"
          />
          <StatsCard
            title="Abgelehnt"
            value={isLoading ? '—' : stats.rejected}
            icon={XCircle}
            color="text-danger-600"
            bgColor="bg-danger-50"
          />
        </div>

        <Card hover={false} className="border-gray-100 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-gray-900">Filter</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {statusTabs.map(({ id, label }) => (
                <Button
                  key={id}
                  type="button"
                  size="sm"
                  variant={selectedStatus === id ? 'default' : 'outline'}
                  className={cn(
                    'rounded-lg transition-shadow',
                    selectedStatus === id ? 'shadow-sm' : 'hover:border-primary-200 hover:bg-primary-50/50'
                  )}
                  onClick={() => setSelectedStatus(id)}
                >
                  {label}
                </Button>
              ))}
            </div>
            <div className="w-full sm:w-56 shrink-0">
              <Select
                options={typeOptions}
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="text-sm border-gray-200"
              />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} hover={false} className="border-gray-100">
                <CardContent className="pt-6">
                  <Skeleton className="h-5 w-1/3 mb-4" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : absences.length === 0 ? (
          <Card hover={false} className="border-gray-100 border-dashed bg-gray-50/50 transition-shadow hover:shadow-md">
            <CardContent className="py-16 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
                <Calendar className="h-7 w-7 text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Keine Abwesenheiten</h3>
              <p className="text-sm text-gray-600 mt-1 mb-8 max-w-sm mx-auto">
                Du hast noch keine Abwesenheiten beantragt.
              </p>
              <Button onClick={() => router.push('/absences/new')} className="hover:shadow-md transition-shadow">
                <Plus className="h-4 w-4 mr-2" />
                Erste Abwesenheit beantragen
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {absences.map((absence) => (
              <Card
                key={absence._id}
                hover={false}
                className="border-gray-100 shadow-sm transition-shadow hover:shadow-md"
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 space-y-3 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{getAbsenceTypeLabel(absence.type)}</span>
                        <Badge variant={getStatusVariant(absence.status)}>
                          {getStatusLabel(absence.status)}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                        <span className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-gray-50 rounded-lg border border-gray-100">
                          <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span className="font-medium tabular-nums">
                            {formatApiDate(absence.startDate, 'dd. MMM yyyy')}
                            {' → '}
                            {formatApiDate(absence.endDate, 'dd. MMM yyyy')}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-gray-50 rounded-lg border border-gray-100">
                          <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span className="font-medium">
                            {absence.totalDays} {absence.totalDays === 1 ? 'Tag' : 'Tage'}
                          </span>
                        </span>
                      </div>
                      {absence.reason && (
                        <p className="text-sm text-gray-600 bg-white p-3 rounded-xl border border-gray-100">
                          {absence.reason}
                        </p>
                      )}
                      {absence.status === 'rejected' && absence.rejectionReason && (
                        <div className="p-3 bg-danger-50 border border-danger-100 rounded-xl">
                          <p className="text-sm text-danger-800">
                            <span className="font-semibold">Grund:</span> {absence.rejectionReason}
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-gray-400">
                        Beantragt am {formatApiDate(absence.createdAt, 'dd.MM.yyyy')}
                      </p>
                    </div>
                    {(absence.status === 'pending' ||
                      (absence.status === 'approved' &&
                        !isBefore(
                          parseLocalDate(absence.startDate.slice(0, 10)),
                          startOfDay(new Date())
                        ))) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(absence._id)}
                        className="text-danger-600 hover:text-white hover:bg-danger-600 border-danger-200 hover:border-danger-600 shrink-0 transition-colors"
                      >
                        <XCircle className="h-4 w-4 mr-1.5" />
                        Stornieren
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
