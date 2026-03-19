'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/avatar';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { 
    ClipboardList, CheckCircle2, AlertTriangle, Clock, 
    Calendar, User, MessageSquare, Phone, ExternalLink, 
    Paperclip, ChevronLeft, Sparkles, Inbox, Activity,
    Layout, ArrowRight, Star, XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface HandoverTask {
    _id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    dueDate?: string;
    status: 'pending' | 'completed';
    links: { title: string; url: string }[];
    attachments: { name: string; size: number; url: string }[];
}

interface HandoverData {
    _id: string;
    absenceId: string;
    creator: { name: string; email: string };
    substitute: { name: string; email: string };
    tasks: HandoverTask[];
    generalNotes: string;
    emergencyContact: {
        availability: 'unavailable' | 'emergency_only' | 'limited_email';
        phone?: string;
        note?: string;
    };
    status: 'active' | 'completed';
}

export default function HandoverDetailPage() {
    const { absenceId } = useParams();
    const { data: session, status: authStatus } = useSession();
    const router = useRouter();
    const [handover, setHandover] = useState<HandoverData | null>(null);
    const [loading, setLoading] = useState(true);
    const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

    useEffect(() => {
        if (authStatus === 'unauthenticated') router.push('/');
        if (authStatus === 'authenticated' && absenceId) fetchHandover();
    }, [authStatus, absenceId, router]);

    const fetchHandover = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/handover/${absenceId}`);
            if (!response.ok) throw new Error('Handover nicht gefunden');
            const data = await response.json();
            setHandover(data.handover);
        } catch (err: any) {
            toast.error(err.message || 'Fehler beim Laden');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
        try {
            setUpdatingTaskId(taskId);
            const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
            const response = await fetch(`/api/handover/${absenceId}/tasks/${taskId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) throw new Error('Status konnte nicht aktualisiert werden');
            
            setHandover(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    tasks: prev.tasks.map(t => t._id === taskId ? { ...t, status: newStatus as any } : t)
                };
            });
            
            toast.success(newStatus === 'completed' ? 'Aufgabe erledigt' : 'Aufgabe wieder offen');
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setUpdatingTaskId(null);
        }
    };

    if (authStatus === 'loading' || loading) {
        return (
            <DashboardLayout>
                <div className="h-[60vh] flex items-center justify-center">
                    <LoadingSpinner text="Handover-Details werden geladen..." />
                </div>
            </DashboardLayout>
        );
    }

    if (!handover) {
        return (
            <DashboardLayout>
                <div className="max-w-2xl mx-auto py-24 text-center space-y-6 animate-in zoom-in-95 duration-500">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-50 text-gray-300 border border-gray-100 shadow-sm">
                        <AlertTriangle className="h-10 w-10" />
                    </div>
                    <div className="space-y-2">
                         <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Handover nicht gefunden</h2>
                         <p className="text-gray-500 font-medium">Es wurde kein Übergabeprotokoll für diese Abwesenheit erstellt.</p>
                    </div>
                    <Button 
                        onClick={() => router.push('/dashboard')}
                        className="h-12 px-8 rounded-2xl bg-primary-600 text-white shadow-xl shadow-primary-100 font-black uppercase tracking-widest text-[10px]"
                    >
                        Zurück zum Dashboard
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    const completedTasks = handover.tasks.filter(t => t.status === 'completed').length;
    const progress = Math.round((completedTasks / handover.tasks.length) * 100) || 0;

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => router.push('/dashboard')}
                            className="h-12 w-12 p-0 rounded-2xl border border-gray-100 bg-white shadow-sm hover:bg-gray-50"
                        >
                            <ChevronLeft className="h-6 w-6 text-gray-400" />
                        </Button>
                        <div>
                             <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
                                <ClipboardList className="h-7 w-7 text-primary-600" />
                                Übergabe-Tracker
                             </h1>
                             <p className="text-sm font-medium text-gray-500 mt-1 uppercase tracking-widest flex items-center gap-2">
                                Briefing von <span className="text-primary-600 font-black">{handover.creator.name}</span>
                                <ArrowRight className="h-3 w-3 text-gray-300" />
                                <span className="text-gray-900">{handover.substitute.name}</span>
                             </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-white p-2 pr-4 rounded-2xl border border-gray-100 shadow-sm">
                         <div className="h-12 w-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-black text-xs">
                             {progress}%
                         </div>
                         <div>
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Fortschritt</p>
                             <p className="text-sm font-black text-gray-900 tracking-tight">{completedTasks} von {handover.tasks.length} erledigt</p>
                         </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Tasks */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between px-2">
                             <div className="flex items-center gap-2.5">
                                <Activity className="h-4 w-4 text-primary-500" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Aufgaben & Prioritäten</span>
                             </div>
                             {handover.tasks.some(t => t.priority === 'high' && t.status === 'pending') && (
                                <Badge className="bg-rose-50 text-rose-700 border-rose-100 font-black text-[8px] tracking-widest px-2 py-0.5 rounded-lg uppercase animate-pulse">
                                    Dringend
                                </Badge>
                             )}
                        </div>

                        <div className="space-y-4">
                            {handover.tasks.map((task, idx) => (
                                <Card 
                                    key={task._id} 
                                    className={cn(
                                        "p-0 overflow-hidden border-gray-100 shadow-sm hover:shadow-md transition-all animate-in slide-in-from-left-4 duration-500",
                                        `delay-${idx * 50}`,
                                        task.status === 'completed' && "opacity-75 grayscale-[0.5]"
                                    )}
                                >
                                    <div className="flex flex-col sm:flex-row items-stretch">
                                        {/* Status Checkbox Area */}
                                        <div className={cn(
                                            "flex items-center justify-center p-6 border-b sm:border-b-0 sm:border-r border-gray-50 transition-colors",
                                            task.status === 'completed' ? "bg-emerald-50/30" : "bg-white"
                                        )}>
                                            <button 
                                                onClick={() => toggleTaskStatus(task._id, task.status)}
                                                disabled={updatingTaskId === task._id}
                                                className={cn(
                                                    "h-10 w-10 rounded-xl border-2 flex items-center justify-center transition-all duration-300",
                                                    task.status === 'completed' 
                                                        ? "bg-emerald-500 border-emerald-400 text-white scale-110 shadow-lg shadow-emerald-100" 
                                                        : "border-gray-100 text-transparent hover:border-primary-200 bg-gray-50/50"
                                                )}
                                            >
                                                {updatingTaskId === task._id 
                                                    ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                    : <CheckCircle2 className="h-6 w-6" />
                                                }
                                            </button>
                                        </div>

                                        {/* Content Area */}
                                        <div className="flex-1 p-6 space-y-4">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <h3 className={cn(
                                                        "text-base font-bold tracking-tight transition-all",
                                                        task.status === 'completed' ? "text-gray-400 line-through" : "text-gray-900"
                                                    )}>
                                                        {task.title}
                                                    </h3>
                                                    <Badge className={cn(
                                                        "font-black text-[8px] tracking-widest rounded-lg px-2",
                                                        task.priority === 'high' ? "bg-rose-50 text-rose-700 border-rose-100" :
                                                        task.priority === 'medium' ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                        "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                    )}>
                                                        {task.priority.toUpperCase()}
                                                    </Badge>
                                                </div>
                                                {task.dueDate && (
                                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-tighter shrink-0">
                                                        <Clock className="h-3 w-3" />
                                                        {format(new Date(task.dueDate), 'dd.MM.yyyy')}
                                                    </div>
                                                )}
                                            </div>

                                            <p className={cn(
                                                "text-sm font-medium leading-relaxed",
                                                task.status === 'completed' ? "text-gray-300" : "text-gray-600"
                                            )}>
                                                {task.description}
                                            </p>

                                            {(task.links.length > 0 || task.attachments.length > 0) && (
                                                <div className="flex flex-wrap gap-3 pt-2">
                                                    {task.links.map((link, lIdx) => (
                                                        <a 
                                                            key={lIdx} 
                                                            href={link.url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 rounded-xl text-[10px] font-black text-primary-600 uppercase tracking-widest hover:border-primary-200 hover:bg-primary-50/30 transition-all shadow-xs"
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                            {link.title || 'Link'}
                                                        </a>
                                                    ))}
                                                    {task.attachments.map((att, aIdx) => (
                                                        <div 
                                                            key={aIdx}
                                                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-50/50 border border-gray-100 rounded-xl text-[10px] font-black text-gray-500 uppercase tracking-widest"
                                                        >
                                                            <Paperclip className="h-3 w-3" />
                                                            {att.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Sidebar Info */}
                    <div className="space-y-6">
                        
                        {/* Status Card */}
                        <Card className="p-8 border-gray-100 shadow-sm bg-gradient-to-br from-primary-600 to-indigo-700 text-white relative overflow-hidden group">
                             <div className="absolute -right-4 -top-4 text-white/10 group-hover:scale-125 transition-transform duration-1000">
                                 <Sparkles className="h-32 w-32" />
                             </div>
                             <div className="relative z-10 space-y-6">
                                 <div>
                                     <h3 className="text-xs font-black uppercase tracking-widest mb-1 opacity-60">Handover Status</h3>
                                     <Badge className="bg-white/20 text-white border-white/20 font-black px-3 py-1 rounded-full uppercase text-[10px] tracking-widest">
                                         {handover.status === 'active' ? 'AKTIV' : 'ABGESCHLOSSEN'}
                                     </Badge>
                                 </div>
                                 <div className="space-y-4">
                                      <div className="flex items-center gap-4">
                                          <Avatar name={handover.creator.name} className="h-10 w-10 border-2 border-white/20 ring-1 ring-white/10" />
                                          <div>
                                              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Erstellt von</p>
                                              <p className="text-sm font-black tracking-tight">{handover.creator.name}</p>
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                          <Avatar name={handover.substitute.name} className="h-10 w-10 border-2 border-white/20 ring-1 ring-white/10" />
                                          <div>
                                              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Zuständig</p>
                                              <p className="text-sm font-black tracking-tight">{handover.substitute.name}</p>
                                          </div>
                                      </div>
                                 </div>
                             </div>
                        </Card>

                        {/* General Notes */}
                        <Card className="p-8 border-gray-100 shadow-sm">
                             <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <MessageSquare className="h-3 w-3 text-primary-500" /> Wichtige Hinweise
                             </h4>
                             <div className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 italic text-sm font-medium text-gray-600 leading-relaxed">
                                {handover.generalNotes || "Keine allgemeinen Hinweise hinterlegt."}
                             </div>
                        </Card>

                        {/* Emergency Contact */}
                        <Card className="p-8 border-gray-100 shadow-sm relative overflow-hidden group">
                             <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Phone className="h-3 w-3 text-primary-500" /> Erreichbarkeit
                             </h4>
                             <div className="space-y-4">
                                 <div className={cn(
                                     "p-4 rounded-2xl border-2 flex flex-col items-center text-center gap-2",
                                     handover.emergencyContact.availability === 'unavailable' 
                                        ? "bg-rose-50 border-rose-100 text-rose-700" 
                                        : "bg-emerald-50 border-emerald-100 text-emerald-700"
                                 )}>
                                     {handover.emergencyContact.availability === 'unavailable' ? <XCircle className="h-5 w-5" /> : 
                                      handover.emergencyContact.availability === 'emergency_only' ? <AlertTriangle className="h-5 w-5 animate-pulse" /> : 
                                      <Clock className="h-5 w-5" />}
                                     <span className="text-[10px] font-black uppercase tracking-widest">
                                         {handover.emergencyContact.availability === 'unavailable' ? 'Nicht erreichbar' : 
                                          handover.emergencyContact.availability === 'emergency_only' ? 'Nur Notfall' : 'Eingeschränkt'}
                                     </span>
                                 </div>
                                 
                                 {handover.emergencyContact.phone && (
                                     <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center gap-3">
                                         <Phone className="h-4 w-4 text-primary-500" />
                                         <p className="text-sm font-black text-gray-900 tracking-tight tabular-nums">
                                             {handover.emergencyContact.phone}
                                         </p>
                                     </div>
                                 )}
                                 
                                 {handover.emergencyContact.note && (
                                     <p className="text-[10px] font-bold text-gray-400 leading-relaxed uppercase tracking-tight text-center px-2">
                                         “{handover.emergencyContact.note}”
                                     </p>
                                 )}
                             </div>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
