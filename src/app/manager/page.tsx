'use client';

// ========================================
// FILE: src/app/manager/page.tsx
// Manager Dashboard - WITH APPROVALS & ANALYTICS
// ========================================

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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

  // Redirect if not manager
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/');
      return;
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== 'manager' && userRole !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [session, status, router]);

  // Fetch pending approvals
  useEffect(() => {
    if (status === 'authenticated') {
      fetchPendingApprovals();
    }
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
        body: action === 'rejected' 
          ? JSON.stringify({ reason: 'Vom Manager abgelehnt' })
          : JSON.stringify({}),
      });

      if (response.ok) {
        alert(action === 'approved' ? '✅ Genehmigt!' : '❌ Abgelehnt!');
        await fetchPendingApprovals();
      } else {
        throw new Error('Failed to process approval');
      }
    } catch (err) {
      alert('Fehler beim Verarbeiten');
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatAbsenceType = (type: string) => {
    const types: Record<string, string> = {
      vacation: 'Urlaub',
      sick: 'Krankheit',
      training: 'Fortbildung',
      parental: 'Elternzeit',
    };
    return types[type] || type;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Manager Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Willkommen zurück, {session?.user?.name || 'Manager'}!
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Pending Approvals */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Offene Anträge</p>
                <p className="text-3xl font-bold text-warning-600 mt-2">
                  {pendingApprovals.length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-warning-100">
                <svg className="w-6 h-6 text-warning-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <button
              onClick={() => router.push('/manager/approvals')}
              className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Alle ansehen →
            </button>
          </div>

          {/* Team Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Team Mitglieder</p>
                <p className="text-3xl font-bold text-primary-600 mt-2">
                  -
                </p>
              </div>
              <div className="p-3 rounded-full bg-primary-100">
                <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Analytics Access */}
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Analytics</p>
                <p className="text-2xl font-bold mt-2">
                  Statistiken
                </p>
              </div>
              <div className="p-3 rounded-full bg-white/20">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <button
              onClick={() => router.push('/analytics')}
              className="mt-4 text-sm text-white hover:text-primary-100 font-medium flex items-center"
            >
              Dashboard öffnen →
            </button>
          </div>
        </div>

        {/* Pending Approvals Widget */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Offene Genehmigungen ({pendingApprovals.length})
            </h2>
            {pendingApprovals.length > 0 && (
              <button
                onClick={() => router.push('/manager/approvals')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Alle ansehen →
              </button>
            )}
          </div>

          <div className="p-6">
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Keine offenen Anträge
                </h3>
                <p className="mt-2 text-gray-500">
                  Aktuell gibt es keine Abwesenheitsanträge zum Genehmigen.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Show first 3 pending approvals */}
                {pendingApprovals.slice(0, 3).map((absence) => (
                  <div
                    key={absence._id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Employee Info */}
                        <div className="flex items-center mb-3">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold mr-3">
                            {absence.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {absence.userName}
                            </h4>
                            <p className="text-sm text-gray-500">{absence.userEmail}</p>
                          </div>
                        </div>

                        {/* Quick Info */}
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Art: </span>
                            <span className="font-medium text-gray-900">
                              {formatAbsenceType(absence.type)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Zeitraum: </span>
                            <span className="font-medium text-gray-900">
                              {formatDate(absence.startDate)} - {formatDate(absence.endDate)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Dauer: </span>
                            <span className="font-medium text-gray-900">
                              {absence.totalDays} Tag{absence.totalDays !== 1 ? 'e' : ''}
                            </span>
                          </div>
                        </div>

                        {/* Reason */}
                        {absence.reason && (
                          <div className="mt-3 text-sm">
                            <span className="text-gray-500">Begründung: </span>
                            <span className="text-gray-700 italic">{absence.reason}</span>
                          </div>
                        )}
                      </div>

                      {/* Quick Action Buttons */}
                      <div className="flex gap-2 ml-6">
                        <button
                          onClick={() => handleQuickApproval(absence._id, 'approved')}
                          disabled={processingId === absence._id}
                          className="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                          title="Genehmigen"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => handleQuickApproval(absence._id, 'rejected')}
                          disabled={processingId === absence._id}
                          className="px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                          title="Ablehnen"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Show "See all" if more than 3 */}
                {pendingApprovals.length > 3 && (
                  <div className="text-center pt-4">
                    <button
                      onClick={() => router.push('/manager/approvals')}
                      className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                    >
                      + {pendingApprovals.length - 3} weitere Anträge ansehen
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Schnellzugriff
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/manager/approvals')}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="font-medium text-gray-900">Alle Genehmigungen</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => router.push('/analytics')}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="font-medium text-gray-900">Team Analytics</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="font-medium text-gray-900">Meine Abwesenheiten</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Tipps & Hinweise
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-primary-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Genehmigen Sie Anträge zeitnah, um Planungssicherheit zu schaffen.</p>
              </div>
              <div className="flex items-start">
                <svg className="w-5 h-5 text-primary-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Nutzen Sie Analytics, um Trends und Muster zu erkennen.</p>
              </div>
              <div className="flex items-start">
                <svg className="w-5 h-5 text-primary-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Prüfen Sie die Team-Kapazität vor Genehmigung längerer Abwesenheiten.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}