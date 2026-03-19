'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/avatar';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { CheckCircle2, XCircle, ChevronLeft, Clock, Calendar, User, FileText, AlertCircle, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

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

      if (action === 'approved') {
        toast.success('Antrag genehmigt');
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
      <DashboardLayout>
        <div className="h-[60vh] flex items-center justify-center">
          <LoadingSpinner text="Anträge werden geladen..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/manager')}
              className="h-10 w-10 p-0 rounded-2xl hover:bg-gray-100 border border-gray-100 shadow-sm"
            >
              <ChevronLeft className="h-5 w-5 text-gray-400" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
                <Inbox className="h-7 w-7 text-primary-600" />
                Offene Genehmigungen
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Überprüfen und entscheiden Sie über die Abwesenheitsanträge Ihres Teams
              </p>
            </div>
          </div>
          <Badge className="bg-primary-50 text-primary-700 border-primary-100 font-black px-3 py-1 rounded-full text-xs uppercase tracking-widest">
            {absences.length} Anträge
          </Badge>
        </div>

        {/* List content */}
        {absences.length === 0 ? (
          <Card className="py-24 text-center border-gray-100 shadow-sm animate-in zoom-in-95 duration-500">
            <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
              <div className="p-5 bg-emerald-50 text-emerald-500 rounded-full border border-emerald-100 shadow-sm">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Alles erledigt</h3>
                <p className="text-sm font-medium text-gray-500 leading-relaxed">
                  Es stehen aktuell keine Abwesenheitsanträge zur Genehmigung aus.
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {absences.map((absence, index) => (
              <Card 
                key={absence._id} 
                className={cn(
                  "p-0 overflow-hidden border-gray-100 shadow-sm hover:shadow-md transition-all animate-in slide-in-from-bottom-4 duration-500",
                  `delay-${(index * 100) % 500}`
                )}
              >
                <div className="flex flex-col md:flex-row items-stretch">
                  {/* Left: User Info */}
                  <div className="p-6 md:w-64 bg-gray-50/50 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col items-center justify-center text-center gap-3">
                    <Avatar 
                      name={absence.userName} 
                      className="h-16 w-16 text-xl border-4 border-white shadow-sm ring-1 ring-gray-100" 
                    />
                    <div>
                      <p className="font-black text-gray-900 tracking-tight leading-none mb-1">{absence.userName}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{absence.userEmail}</p>
                    </div>
                  </div>

                  {/* Middle: Details */}
                  <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-gray-300" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kategorie</span>
                      </div>
                      <Badge className={cn(
                        "font-bold uppercase text-[10px] tracking-widest px-2.5 py-1 rounded-lg border shadow-sm",
                        absence.type === 'vacation' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        absence.type === 'sick' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                        'bg-indigo-50 text-indigo-700 border-indigo-100'
                      )}>
                        {formatAbsenceType(absence.type)}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-gray-300" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Zeitraum</span>
                      </div>
                      <p className="text-sm font-bold text-gray-800 tracking-tight">
                        {formatDate(absence.startDate)} – {formatDate(absence.endDate)}
                      </p>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {absence.totalDays} {absence.totalDays === 1 ? 'Tag' : 'Tage'}
                        {absence.isHalfDay && ' (Halber Tag)'}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-3.5 w-3.5 text-gray-300" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Grund / Notiz</span>
                      </div>
                      <p className={cn(
                        "text-sm font-medium leading-relaxed italic",
                        absence.reason ? "text-gray-600" : "text-gray-300"
                      )}>
                        {absence.reason ? `"${absence.reason}"` : "Keine Begründung angegeben"}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="p-6 bg-white border-t md:border-t-0 md:border-l border-gray-50 flex items-center md:flex-col justify-center gap-3">
                    <Button
                      onClick={() => handleApproval(absence._id, 'approved')}
                      disabled={processingId === absence._id}
                      className="flex-1 md:w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-100 font-bold tracking-tight"
                    >
                      {processingId === absence._id
                        ? <div className="w-5 h-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        : <CheckCircle2 className="h-4 w-4 mr-2" />
                      }
                      Genehmigen
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleApproval(absence._id, 'rejected')}
                      disabled={processingId === absence._id}
                      className="flex-1 md:w-full h-11 text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl font-bold tracking-tight"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Ablehnen
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}