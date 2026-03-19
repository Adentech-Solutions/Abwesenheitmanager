'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import StatsCard from '@/components/shared/StatsCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { CheckCircle2, XCircle, Clock, Users, ChevronRight, Calendar, Mail, FileText, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Absence {
  _id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: 'vacation' | 'sick' | 'training' | 'parental' | string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  createdAt: string;
}

const TYPE_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; icon: any }> = {
  vacation: { label: 'Urlaub', variant: 'success', icon: Calendar },
  sick: { label: 'Krankheit', variant: 'danger', icon: XCircle },
  training: { label: 'Fortbildung', variant: 'info', icon: Briefcase },
  parental: { label: 'Elternzeit', variant: 'warning', icon: Users },
};

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

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="h-[60vh] flex items-center justify-center">
          <LoadingSpinner text="Manager Dashboard wird geladen..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manager Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Willkommen zurück, <span className="text-gray-900 font-semibold">{session?.user?.name || 'Manager'}</span></p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatsCard 
            title="Offene Anträge" 
            value={pendingApprovals.length} 
            icon={Clock} 
            color="text-amber-600" 
            bgColor="bg-amber-50"
            delay="delay-0"
          />
          <StatsCard 
            title="Team Mitglieder" 
            value="—" 
            icon={Users} 
            color="text-primary-600" 
            bgColor="bg-primary-50"
            delay="delay-75"
          />
          <Card className="p-5 flex flex-col justify-center items-center bg-gray-50/50 border-dashed hover:bg-white transition-colors cursor-pointer group delay-150 animate-in fade-in slide-in-from-bottom-2 fill-mode-both" onClick={() => router.push('/manager/approvals')}>
            <div className="p-3 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-all mb-3 text-primary-600">
              <ChevronRight className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-gray-900 tracking-tight">Alle Genehmigungen</p>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mt-1">Verlauf ansehen</p>
          </Card>
        </div>

        {/* Pending Approvals */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Offene Genehmigungen
              {pendingApprovals.length > 0 && (
                <Badge variant="warning" className="ml-2 px-2 py-0.5 font-bold">
                  {pendingApprovals.length}
                </Badge>
              )}
            </h2>
          </div>

          <Card className="p-0 overflow-hidden hover:shadow-md transition-all">
            {pendingApprovals.length === 0 ? (
              <div className="py-16 text-center">
                <div className="inline-flex p-4 bg-emerald-50 rounded-full mb-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <p className="text-gray-500 font-medium">Alle Anträge bearbeitet!</p>
                <p className="text-xs text-gray-400 mt-1">Momentan gibt es keine offenen Genehmigungen.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {pendingApprovals.slice(0, 5).map((absence, idx) => {
                  const type = TYPE_CONFIG[absence.type] || { label: absence.type, variant: 'default', icon: FileText };
                  const TypeIcon = type.icon;
                  return (
                    <div 
                      key={absence._id} 
                      className={cn(
                        "flex items-center gap-4 px-6 py-5 hover:bg-gray-50/80 transition-colors animate-in fade-in slide-in-from-right-4 fill-mode-both",
                        `delay-[${idx * 50}ms]`
                      )}
                    >
                      <Avatar className="h-12 w-12 border-2 border-white shadow-sm ring-1 ring-gray-100">
                        <AvatarFallback className="bg-primary-50 text-primary-600 font-bold text-lg">
                          {absence.userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 tracking-tight truncate">{absence.userName}</p>
                          <Badge variant={type.variant as any} className="gap-1 px-2 py-0 font-bold uppercase text-[9px] tracking-widest">
                            {TypeIcon && <TypeIcon className="h-3 w-3" />}
                            {type.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(absence.startDate)} – {formatDate(absence.endDate)}
                          </span>
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                            {absence.totalDays} {absence.totalDays === 1 ? 'Tag' : 'Tage'}
                          </span>
                        </div>
                        {absence.reason && (
                          <p className="text-xs text-gray-400 italic mt-1 flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {absence.reason}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuickApproval(absence._id, 'approved')}
                          disabled={processingId === absence._id}
                          className="h-10 w-10 p-0 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                          title="Genehmigen"
                        >
                          {processingId === absence._id
                            ? <LoadingSpinner size="sm" />
                            : <CheckCircle2 className="h-5 w-5" />
                          }
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuickApproval(absence._id, 'rejected')}
                          disabled={processingId === absence._id}
                          className="h-10 w-10 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          title="Ablehnen"
                        >
                          <XCircle className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {pendingApprovals.length > 5 && (
                  <div className="p-4 bg-gray-50/50 text-center">
                    <Button 
                      variant="link" 
                      onClick={() => router.push('/manager/approvals')} 
                      className="text-xs font-bold text-primary-600"
                    >
                      +{pendingApprovals.length - 5} weitere Genehmigungen anzeigen →
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Schnellzugriff & Tipps */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-6 hover:shadow-md transition-all">
            <h3 className="font-bold text-gray-900 tracking-tight mb-4 flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-primary-600" />
              Schnellzugriff
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Alle Genehmigungen', href: '/manager/approvals', icon: Calendar },
                { label: 'Team Analytics', href: '/analytics', icon: Briefcase },
                { label: 'Meine Abwesenheiten', href: '/absences', icon: Users },
              ].map(({ label, href, icon: Icon }) => (
                <button
                  key={href}
                  onClick={() => router.push(href)}
                  className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-primary-50 hover:ring-1 hover:ring-primary-100 rounded-xl transition-all text-center group"
                >
                  <Icon className="h-5 w-5 text-gray-400 group-hover:text-primary-600 mb-2 transition-colors" />
                  <span className="text-[11px] font-bold text-gray-700 tracking-tight">{label}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-6 hover:shadow-md transition-all bg-primary-900 text-white border-none shadow-lg">
            <h3 className="font-bold tracking-tight mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary-400" />
              Manager-Tipps
            </h3>
            <ul className="space-y-3">
              {[
                'Genehmigen Sie Anträge zeitnah für bessere Planungssicherheit.',
                'Prüfen Sie Team-Kapazitäten in Analytics vor langen Abwesenheiten.',
                'Sorgen Sie für eine faire Verteilung der Urlaubstage im Team.'
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-primary-100">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-800 text-[10px] font-bold text-primary-400 shrink-0">
                    {i + 1}
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}