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
import {
  Calendar, Clock, CheckCircle2, XCircle, FileText, Plus,
} from 'lucide-react';

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
    approved: 'success', pending: 'warning', rejected: 'danger',
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
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary-600" />
              Meine Abwesenheiten
            </h1>
            <p className="text-gray-500 text-sm mt-1">Übersicht über alle deine Abwesenheitsanträge</p>
          </div>
          {/* ✅ FIX: Button navigiert korrekt */}
          <Button onClick={() => router.push('/absences/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Neue Abwesenheit
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Gesamt', value: stats.total, icon: FileText, color: 'text-gray-400' },
            { label: 'Ausstehend', value: stats.pending, icon: Clock, color: 'text-orange-400' },
            { label: 'Genehmigt', value: stats.approved, icon: CheckCircle2, color: 'text-green-400' },
            { label: 'Abgelehnt', value: stats.rejected, icon: XCircle, color: 'text-red-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
                <Icon className={`h-8 w-8 ${color}`} />
              </div>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex gap-1">
              {['all', 'pending', 'approved', 'rejected'].map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedStatus(s)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${selectedStatus === s
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  {{ all: 'Alle', pending: 'Ausstehend', approved: 'Genehmigt', rejected: 'Abgelehnt' }[s]}
                </button>
              ))}
            </div>
            <select
              className="ml-auto text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600"
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
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <div className="animate-pulse h-16 bg-gray-100 rounded" />
              </Card>
            ))}
          </div>
        ) : absences.length === 0 ? (
          <Card>
            <div className="py-16 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700">Keine Abwesenheiten</h3>
              <p className="text-gray-500 text-sm mt-1 mb-6">Du hast noch keine Abwesenheiten beantragt</p>
              {/* ✅ FIX: Auch dieser Button navigiert korrekt */}
              <Button onClick={() => router.push('/absences/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Erste Abwesenheit beantragen
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {absences.map(absence => (
              <Card key={absence._id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{getAbsenceTypeLabel(absence.type)}</span>
                      <Badge variant={getStatusVariant(absence.status)}>
                        {getStatusLabel(absence.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {format(new Date(absence.startDate), 'dd. MMM yyyy', { locale: de })}
                        {' → '}
                        {format(new Date(absence.endDate), 'dd. MMM yyyy', { locale: de })}
                      </span>
                      <span className="text-gray-400">·</span>
                      <span>{absence.totalDays} {absence.totalDays === 1 ? 'Tag' : 'Tage'}</span>
                    </div>
                    {absence.reason && (
                      <p className="text-sm text-gray-600 italic">{absence.reason}</p>
                    )}
                    {absence.status === 'rejected' && absence.rejectionReason && (
                      <div className="p-2.5 bg-red-50 border border-red-100 rounded-lg">
                        <p className="text-sm text-red-700">
                          <span className="font-medium">Grund:</span> {absence.rejectionReason}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-gray-400">
                      Beantragt am {format(new Date(absence.createdAt), 'dd.MM.yyyy', { locale: de })}
                    </p>
                  </div>
                  {(absence.status === 'pending' || absence.status === 'approved') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(absence._id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 shrink-0"
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
        {/* ✅ FAB entfernt — ein Button im Header reicht */}
      </div>
    </DashboardLayout>
  );
}