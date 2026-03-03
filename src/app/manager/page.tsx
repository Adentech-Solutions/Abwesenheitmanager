'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { CheckCircle2, XCircle, Clock, Users, ChevronRight } from 'lucide-react';

interface Absence {
  _id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  createdAt: string;
}

export default function ManagerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pendingApprovals, setPendingApprovals] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) { router.push('/'); return; }
    const userRole = (session.user as any)?.role;
    if (userRole !== 'manager' && userRole !== 'admin') { router.push('/dashboard'); return; }
  }, [session, status, router]);

  useEffect(() => {
    if (status === 'authenticated') fetchPendingApprovals();
  }, [status]);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/approvals?status=pending');
      if (response.ok) {
        const data = await response.json();
        setPendingApprovals(data.absences || []);
      }
    } catch (err) {
      console.error('Error fetching approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickApproval = async (absenceId: string, action: 'approved' | 'rejected') => {
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

      if (response.ok) {
        // ✅ FIX: toast statt alert()
        if (action === 'approved') {
          toast.success('Antrag genehmigt');
        } else {
          toast.error('Antrag abgelehnt');
        }
        await fetchPendingApprovals();
      } else {
        throw new Error('Failed to process approval');
      }
    } catch (err) {
      toast.error('Fehler beim Verarbeiten');
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Willkommen zurück, {session?.user?.name || 'Manager'}</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="p-3 bg-orange-50 rounded-lg">
              <Clock className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Offene Anträge</p>
              <p className="text-2xl font-bold text-orange-600">{pendingApprovals.length}</p>
              <button
                onClick={() => router.push('/manager/approvals')}
                className="text-xs text-primary-600 hover:underline mt-0.5"
              >
                Alle ansehen →
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Team Mitglieder</p>
              <p className="text-2xl font-bold text-gray-900">—</p>
            </div>
          </div>
        </div>

        {/* ✅ Statistiken-Card ENTFERNT — gehört in /analytics */}

        {/* Pending Approvals */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              Offene Genehmigungen
              {pendingApprovals.length > 0 && (
                <span className="ml-2 text-xs bg-orange-100 text-orange-600 font-semibold px-2 py-0.5 rounded-full">
                  {pendingApprovals.length}
                </span>
              )}
            </h2>
            {pendingApprovals.length > 3 && (
              <button
                onClick={() => router.push('/manager/approvals')}
                className="text-sm text-primary-600 hover:underline"
              >
                Alle ansehen →
              </button>
            )}
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Keine offenen Anträge</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {pendingApprovals.slice(0, 5).map(absence => (
                <div key={absence._id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700 shrink-0">
                    {absence.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{absence.userName}</p>
                    <p className="text-xs text-gray-500 truncate">{absence.userEmail}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="font-medium text-gray-700">{formatAbsenceType(absence.type)}</span>
                      <span>{formatDate(absence.startDate)} – {formatDate(absence.endDate)}</span>
                      <span>{absence.totalDays} {absence.totalDays === 1 ? 'Tag' : 'Tage'}</span>
                    </div>
                    {absence.reason && (
                      <p className="text-xs text-gray-400 italic mt-0.5 truncate">{absence.reason}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleQuickApproval(absence._id, 'approved')}
                      disabled={processingId === absence._id}
                      className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg disabled:opacity-40 transition-colors"
                      title="Genehmigen"
                    >
                      {processingId === absence._id
                        ? <div className="w-4 h-4 animate-spin rounded-full border-2 border-green-400 border-t-transparent" />
                        : <CheckCircle2 className="h-4 w-4" />
                      }
                    </button>
                    <button
                      onClick={() => handleQuickApproval(absence._id, 'rejected')}
                      disabled={processingId === absence._id}
                      className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg disabled:opacity-40 transition-colors"
                      title="Ablehnen"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Schnellzugriff */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Schnellzugriff</h3>
            <div className="space-y-2">
              {[
                { label: 'Alle Genehmigungen', href: '/manager/approvals' },
                { label: 'Team Analytics', href: '/analytics' },
                { label: 'Meine Abwesenheiten', href: '/absences' },
              ].map(({ label, href }) => (
                <button
                  key={href}
                  onClick={() => router.push(href)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                >
                  <span className="font-medium text-gray-700">{label}</span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Tipps & Hinweise</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                Genehmigen Sie Anträge zeitnah, um Planungssicherheit zu schaffen.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                Nutzen Sie Analytics, um Trends und Muster zu erkennen.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                Prüfen Sie die Team-Kapazität vor Genehmigung längerer Abwesenheiten.
              </li>
            </ul>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}