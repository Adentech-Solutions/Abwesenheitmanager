'use client';

// ========================================
// FILE: src/app/absences/page.tsx
// Absences Page - Meine Abwesenheiten
// ========================================

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  Plus,
  FileText,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface Absence {
  _id: string;
  type: 'vacation' | 'sick' | 'training' | 'parental';
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
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Fetch absences
  const { data: absencesData, isLoading } = useQuery({
    queryKey: ['absences', 'my', selectedStatus, selectedType],
    queryFn: async () => {
      let url = '/api/absences';
      const params = new URLSearchParams();

      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }
      if (selectedType !== 'all') {
        params.append('type', selectedType);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch absences');
      }
      return response.json();
    },
  });

  const absences: Absence[] = absencesData?.absences || [];

  // Helper functions
  const getAbsenceTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      vacation: 'Urlaub',
      sick: 'Krankheit',
      training: 'Fortbildung',
      parental: 'Elternzeit',
    };
    return types[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const statuses: Record<string, string> = {
      pending: 'Ausstehend',
      approved: 'Genehmigt',
      rejected: 'Abgelehnt',
      cancelled: 'Storniert',
    };
    return statuses[status] || status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getTypeVariant = (type: string): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
    switch (type) {
      case 'vacation':
        return 'info';
      case 'sick':
        return 'danger';
      case 'training':
        return 'success';
      case 'parental':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Delete/Cancel absence
  const handleDelete = async (absenceId: string) => {
    if (!confirm('Möchtest du diese Abwesenheit wirklich stornieren?')) {
      return;
    }

    try {
      const response = await fetch(`/api/absences/${absenceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete absence');
      }

      toast.success('Abwesenheit storniert');
      queryClient.invalidateQueries({ queryKey: ['absences'] });
    } catch (error) {
      console.error('Error deleting absence:', error);
      toast.error('Fehler beim Löschen');
    }
  };

  // Stats
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
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary-600" />
              Meine Abwesenheiten
            </h1>
            <p className="text-gray-600 mt-2">
              Übersicht über alle deine Abwesenheitsanträge
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Neue Abwesenheit
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gesamt</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ausstehend</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-400" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Genehmigt</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Abgelehnt</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Tabs defaultValue="all" onValueChange={setSelectedStatus}>
              <TabsList>
                <TabsTrigger value="all">Alle</TabsTrigger>
                <TabsTrigger value="pending">Ausstehend</TabsTrigger>
                <TabsTrigger value="approved">Genehmigt</TabsTrigger>
                <TabsTrigger value="rejected">Abgelehnt</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">Alle Typen</option>
                <option value="vacation">Urlaub</option>
                <option value="sick">Krankheit</option>
                <option value="training">Fortbildung</option>
                <option value="parental">Elternzeit</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Absences List */}
        {isLoading ? (
          <Card>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </Card>
        ) : absences.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Keine Abwesenheiten
              </h3>
              <p className="text-gray-600 mb-6">
                Du hast noch keine Abwesenheiten beantragt
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Erste Abwesenheit beantragen
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {absences.map((absence) => (
              <Card key={absence._id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(absence.status)}
                        <Badge variant={getStatusVariant(absence.status)}>
                          {getStatusLabel(absence.status)}
                        </Badge>
                      </div>
                      <Badge variant={getTypeVariant(absence.type)}>
                        {getAbsenceTypeLabel(absence.type)}
                      </Badge>
                    </div>

                    {/* Date Range */}
                    <div>
                      <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <span>
                          {format(new Date(absence.startDate), 'dd. MMMM yyyy', { locale: de })}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span>
                          {format(new Date(absence.endDate), 'dd. MMMM yyyy', { locale: de })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 ml-7">
                        {absence.totalDays} {absence.totalDays === 1 ? 'Tag' : 'Tage'}
                        {absence.isHalfDay && (
                          <> · Halbtags ({absence.halfDayPeriod === 'morning' ? 'Vormittag' : 'Nachmittag'})</>
                        )}
                      </p>
                    </div>

                    {/* Reason */}
                    {absence.reason && (
                      <div className="ml-7">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Grund:</span> {absence.reason}
                        </p>
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {absence.status === 'rejected' && absence.rejectionReason && (
                      <div className="ml-7 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                          <span className="font-medium">Ablehnungsgrund:</span> {absence.rejectionReason}
                        </p>
                      </div>
                    )}

                    {/* Approval Info */}
                    {absence.status === 'approved' && absence.approvedAt && (
                      <div className="ml-7">
                        <p className="text-xs text-gray-500">
                          Genehmigt am {format(new Date(absence.approvedAt), 'dd.MM.yyyy', { locale: de })}
                        </p>
                      </div>
                    )}

                    {/* Created At */}
                    <div className="ml-7">
                      <p className="text-xs text-gray-500">
                        Beantragt am {format(new Date(absence.createdAt), 'dd.MM.yyyy HH:mm', { locale: de })} Uhr
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {(absence.status === 'pending' || absence.status === 'approved') && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(absence._id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Stornieren
                      </Button>
                    </div>
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