'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { CheckCircle2, XCircle, ChevronLeft, Clock } from 'lucide-react';

interface Absence {
  _id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: string;
  startDate: string;
  endDate: string;
  isHalfDay: boolean;
  halfDayPeriod?: 'morning' | 'afternoon';
  totalDays: number;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  createdAt: string;
}

export default function ManagerApprovalsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) { router.push('/'); return; }
    const userRole = (session.user as any)?.role;
    if (userRole !== 'manager' && userRole !== 'admin') { router.push('/dashboard'); return; }
  }, [session, status, router]);

  useEffect(() => {
    if (status === 'authenticated') fetchAbsences();
  }, [status]);

  const fetchAbsences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/approvals?status=pending');
      if (!response.ok) throw new Error('Failed to fetch absences');
      const data = await response.json();
      setAbsences(data.absences || []);
    } catch (err: any) {
      toast.error('Fehler beim Laden der Anträge');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (absenceId: string, action: 'approved' | 'rejected') => {
    try {
      setProcessingId(absenceId);
      const endpoint = action === 'approved'
        ? `/api/approvals/${absenceId}/approve`
        : `/api/approvals/${absenceId}/reject`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action === 'rejected' ? { reason: 'Vom Manager abgelehnt' } : {}),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update absence');
      }

      // ✅ FIX: toast statt alert()
      if (action === 'approved') {
        toast.success('Antrag erfolgreich genehmigt');
      } else {
        toast.error('Antrag abgelehnt');
      }
      await fetchAbsences();
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Verarbeiten');
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const formatAbsenceType = (type: string) =>
    ({ vacation: 'Urlaub', sick: 'Krankheit', training: 'Fortbildung', parental: 'Elternzeit' }[type] || type);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/manager')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Offene Genehmigungen</h1>
            <p className="text-gray-500 text-sm mt-0.5">Anträge Ihrer Mitarbeiter, die auf Genehmigung warten</p>
          </div>
        </div>

        {/* List */}
        {absences.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700">Alles erledigt</h3>
            <p className="text-gray-500 text-sm mt-1">Keine offenen Anträge</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {absences.map(absence => (
              <div key={absence._id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700 shrink-0">
                  {absence.userName.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{absence.userName}</p>
                    <span className="text-xs text-gray-400">{absence.userEmail}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 mt-1.5">
                    <div>
                      <p className="text-xs text-gray-400">Art</p>
                      <p className="text-sm font-medium text-gray-700">{formatAbsenceType(absence.type)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Zeitraum</p>
                      <p className="text-sm text-gray-700">{formatDate(absence.startDate)} – {formatDate(absence.endDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Dauer</p>
                      <p className="text-sm text-gray-700">{absence.totalDays} {absence.totalDays === 1 ? 'Tag' : 'Tage'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Beantragt am</p>
                      <p className="text-sm text-gray-700">{formatDate(absence.createdAt)}</p>
                    </div>
                  </div>
                  {absence.reason && (
                    <p className="text-xs text-gray-500 italic mt-1.5">"{absence.reason}"</p>
                  )}
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleApproval(absence._id, 'approved')}
                    disabled={processingId === absence._id}
                    className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium disabled:opacity-40 transition-colors"
                  >
                    {processingId === absence._id
                      ? <div className="w-4 h-4 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
                      : <CheckCircle2 className="h-4 w-4" />
                    }
                    Genehmigen
                  </button>
                  <button
                    onClick={() => handleApproval(absence._id, 'rejected')}
                    disabled={processingId === absence._id}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium disabled:opacity-40 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    Ablehnen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}