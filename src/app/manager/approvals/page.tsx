'use client';

// ========================================
// FILE: src/app/manager/approvals/page.tsx
// Full Approvals Page - Linked from Manager Dashboard
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
  const [error, setError] = useState<string | null>(null);
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

  // Fetch pending absences
  useEffect(() => {
    if (status === 'authenticated') {
      fetchAbsences();
    }
  }, [status]);

  const fetchAbsences = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/approvals?status=pending');
      
      if (!response.ok) {
        throw new Error('Failed to fetch absences');
      }

      const data = await response.json();
      setAbsences(data.absences || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching absences:', err);
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
        body: action === 'rejected' 
          ? JSON.stringify({ reason: 'Vom Manager abgelehnt' })
          : JSON.stringify({}),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update absence');
      }

      alert(action === 'approved' ? '✅ Genehmigt!' : '❌ Abgelehnt!');
      await fetchAbsences();
    } catch (err: any) {
      alert(`Fehler: ${err.message}`);
      console.error('Error updating absence:', err);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-6 max-w-md">
          <h2 className="text-danger-800 font-semibold mb-2">Fehler</h2>
          <p className="text-danger-600">{error}</p>
          <button
            onClick={fetchAbsences}
            className="mt-4 px-4 py-2 bg-danger-600 text-white rounded hover:bg-danger-700 transition-colors"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Back Button */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/manager')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Zurück zum Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Offene Genehmigungen ({absences?.length || 0})
          </h1>
          <p className="text-gray-600 mt-2">
            Anträge Ihrer Mitarbeiter, die auf Genehmigung warten
          </p>
        </div>

        {/* Absences List */}
        {!absences || absences.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
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
              Aktuell gibt es keine Abwesenheitsanträge, die genehmigt werden müssen.
            </p>
            <button
              onClick={() => router.push('/manager')}
              className="mt-6 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Zurück zum Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {absences.map((absence) => (
              <div
                key={absence._id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Employee Info */}
                    <div className="flex items-center mb-4">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-lg mr-3">
                        {absence.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {absence.userName}
                        </h3>
                        <p className="text-sm text-gray-500">{absence.userEmail}</p>
                      </div>
                    </div>

                    {/* Absence Details */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Art:</p>
                        <p className="font-medium text-gray-900">
                          {formatAbsenceType(absence.type)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Zeitraum:</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(absence.startDate)} - {formatDate(absence.endDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Dauer:</p>
                        <p className="font-medium text-gray-900">
                          {absence.totalDays} Tag{absence.totalDays !== 1 ? 'e' : ''}
                          {absence.isHalfDay && (
                            <span className="text-gray-500 text-sm ml-1">
                              ({absence.halfDayPeriod === 'morning' ? 'Vormittag' : 'Nachmittag'})
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Beantragt am:</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(absence.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Reason */}
                    {absence.reason && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500">Begründung:</p>
                        <p className="text-gray-700 italic">{absence.reason}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 ml-6">
                    <button
                      onClick={() => handleApproval(absence._id, 'approved')}
                      disabled={processingId === absence._id}
                      className="px-6 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {processingId === absence._id ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Wird bearbeitet...
                        </span>
                      ) : (
                        'Genehmigen'
                      )}
                    </button>
                    <button
                      onClick={() => handleApproval(absence._id, 'rejected')}
                      disabled={processingId === absence._id}
                      className="px-6 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      Ablehnen
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}