'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import SubstituteSearch from '@/components/handover/SubstituteSearch';
import HandoverSection, { HandoverItemInput, HandoverEmergencyContact } from '@/components/handover/HandoverSection';
import { 
    ChevronLeft, ChevronRight, Calendar, UserPlus, FileText, 
    Send, Info, AlertCircle, CheckCircle2, Sparkles, 
    Clock, RefreshCcw, Layout, ClipboardList, BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

type Step = 'details' | 'substitute' | 'auto-reply' | 'confirmation';

interface AbsenceType {
    id: string;
    label: string;
    icon: any;
    color: string;
    bg: string;
}

const ABSENCE_TYPES: AbsenceType[] = [
    { id: 'vacation', label: 'Erholungsurlaub', icon: Sparkles, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'sick', label: 'Krankheit', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 'training', label: 'Fortbildung', icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'parental', label: 'Elternzeit', icon: UserPlus, color: 'text-emerald-600', bg: 'bg-emerald-50' },
];


// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

export default function NewAbsenceWizard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    
    // Step State
    const [currentStep, setCurrentStep] = useState<Step>('details');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form Data
    const [formData, setFormData] = useState({
        type: 'vacation',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        isHalfDay: false,
        halfDayPeriod: 'morning' as 'morning' | 'afternoon',
        reason: '',
        substitute: { userId: '', email: '', name: '' },
        handoverEnabled: false,
        handoverItems: [] as HandoverItemInput[],
        generalNotes: '',
        emergencyContact: { availability: 'unavailable' } as HandoverEmergencyContact,
        autoReplyEnabled: true,
        autoReplySubject: 'Abwesenheitsnotiz: {name}',
        autoReplyMessage: 'Vielen Dank für Ihre Nachricht. Ich bin von {startDate} bis {endDate} nicht im Büro. In dringenden Fällen wenden Sie sich bitte an {substituteName}.',
    });

    // Auth Check
    useEffect(() => {
        if (status === 'unauthenticated') router.push('/');
    }, [status, router]);

    // Derived State
    const totalDays = differenceInDays(new Date(formData.endDate), new Date(formData.startDate)) + 1;
    const isSingleDay = isSameDay(new Date(formData.startDate), new Date(formData.endDate));

    // Handlers
    const handleNext = () => {
        if (currentStep === 'details') setCurrentStep('substitute');
        else if (currentStep === 'substitute') setCurrentStep('auto-reply');
        else if (currentStep === 'auto-reply') setCurrentStep('confirmation');
    };

    const handleBack = () => {
        if (currentStep === 'substitute') setCurrentStep('details');
        else if (currentStep === 'auto-reply') setCurrentStep('substitute');
        else if (currentStep === 'confirmation') setCurrentStep('auto-reply');
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            const response = await fetch('/api/absences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    totalDays: formData.isHalfDay ? 0.5 : totalDays,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create absence');
            }

            toast.success('Abwesenheit erfolgreich beantragt');
            router.push('/dashboard');
        } catch (err: any) {
            toast.error(err.message || 'Fehler beim Speichern');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status === 'loading') return <div className="h-screen flex items-center justify-center bg-gray-50"><LoadingSpinner /></div>;

    const steps: { id: Step; label: string; icon: any }[] = [
        { id: 'details', label: 'Details', icon: Calendar },
        { id: 'substitute', label: 'Vertretung', icon: UserPlus },
        { id: 'auto-reply', label: 'Auto-Reply', icon: Send },
        { id: 'confirmation', label: 'Review', icon: CheckCircle2 },
    ];

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
                
                {/* Wizard Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
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
                                <Layout className="h-7 w-7 text-primary-600" />
                                Neue Abwesenheit
                            </h1>
                            <p className="text-sm font-medium text-gray-500 mt-1 uppercase tracking-widest flex items-center gap-2">
                                Schritt {steps.findIndex(s => s.id === currentStep) + 1} von 4
                                <span className="h-1 w-1 rounded-full bg-gray-300" />
                                {steps.find(s => s.id === currentStep)?.label}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Step Progress Bar */}
                <div className="grid grid-cols-4 gap-2 md:gap-4 px-1">
                    {steps.map((step, idx) => {
                        const isActive = currentStep === step.id;
                        const isPast = steps.findIndex(s => s.id === currentStep) > idx;
                        const Icon = step.icon;
                        
                        return (
                            <div key={step.id} className="relative">
                                <div className={cn(
                                    "h-1.5 rounded-full transition-all duration-500",
                                    isActive ? "bg-primary-600 w-full shadow-[0_0_10px_rgba(37,99,235,0.3)]" : 
                                    isPast ? "bg-emerald-500 w-full" : "bg-gray-100 w-full"
                                )} />
                                <div className="hidden md:flex items-center gap-2 mt-3 overflow-hidden">
                                     <div className={cn(
                                         "flex items-center justify-center h-5 w-5 rounded-md text-[10px] font-black border transition-all duration-300",
                                         isActive ? "bg-primary-600 border-primary-500 text-white" : 
                                         isPast ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-white border-gray-100 text-gray-300"
                                     )}>
                                         {isPast ? <CheckCircle2 className="h-3 w-3" /> : idx + 1}
                                     </div>
                                     <span className={cn(
                                         "text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors",
                                         isActive ? "text-primary-600" : isPast ? "text-emerald-600" : "text-gray-300"
                                     )}>
                                         {step.label}
                                     </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Step Content */}
                <div className="min-h-[400px]">
                    {currentStep === 'details' && (
                        <Card className="p-8 border-gray-100 shadow-sm animate-in zoom-in-95 duration-500 slide-in-from-right-4">
                            <div className="space-y-8">
                                <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-primary-500" />
                                        Abwesenheits-Typ
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {ABSENCE_TYPES.map((type) => (
                                            <button
                                                key={type.id}
                                                onClick={() => setFormData({ ...formData, type: type.id })}
                                                className={cn(
                                                    "flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 group relative overflow-hidden",
                                                    formData.type === type.id 
                                                        ? "bg-primary-600 border-primary-500 shadow-xl shadow-primary-100 scale-105" 
                                                        : "bg-white border-gray-50 hover:border-gray-100 hover:bg-gray-50/50"
                                                )}
                                            >
                                                {formData.type === type.id && (
                                                    <div className="absolute top-0 right-0 p-2 text-white/20">
                                                        <Sparkles className="h-8 w-8" />
                                                    </div>
                                                )}
                                                <div className={cn(
                                                    "p-3 rounded-xl mb-4 transition-transform group-hover:scale-110",
                                                    formData.type === type.id ? "bg-white/10 text-white" : `${type.bg} ${type.color}`
                                                )}>
                                                    <type.icon className="h-7 w-7" />
                                                </div>
                                                <span className={cn(
                                                    "text-[11px] font-black uppercase tracking-widest text-center leading-tight",
                                                    formData.type === type.id ? "text-white" : "text-gray-900"
                                                )}>{type.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Zeitraum Wählen</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">Beginn</span>
                                                <div className="relative group">
                                                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-primary-500 transition-colors" />
                                                    <input 
                                                        type="date" 
                                                        value={formData.startDate}
                                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                                        className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-100 font-bold text-gray-700 bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ende</span>
                                                <div className="relative group">
                                                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-primary-500 transition-colors" />
                                                    <input 
                                                        type="date" 
                                                        value={formData.endDate}
                                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                                        className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-100 font-bold text-gray-700 bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                             <div className="flex items-center gap-3">
                                                 <div className="h-8 w-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center">
                                                     <Clock className="h-4 w-4 text-primary-500" />
                                                 </div>
                                                 <span className="text-sm font-bold text-gray-700">Halber Tag</span>
                                             </div>
                                             <button 
                                                onClick={() => setFormData({ ...formData, isHalfDay: !formData.isHalfDay })}
                                                className={cn(
                                                    "w-12 h-6 rounded-full transition-all duration-300 relative",
                                                    formData.isHalfDay ? "bg-primary-600" : "bg-gray-200"
                                                )}
                                             >
                                                <div className={cn(
                                                    "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                                                    formData.isHalfDay ? "translate-x-6" : "translate-x-0"
                                                )} />
                                             </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Grund / Notiz (optional)</label>
                                        <textarea 
                                            value={formData.reason}
                                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                            placeholder="Geben Sie hier ggf. weitere Informationen an..."
                                            rows={5}
                                            className="w-full px-5 py-4 rounded-xl border border-gray-100 font-bold text-gray-700 bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all outline-none resize-none shadow-sm"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-center p-4 bg-primary-50/30 rounded-2xl border border-primary-100 gap-3 border-dashed">
                                    <div className="p-2 bg-white rounded-xl text-primary-600 shadow-sm">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <p className="text-sm font-black text-primary-800 uppercase tracking-tight">
                                        Gesamt: {formData.isHalfDay ? '0.5' : totalDays} {totalDays === 1 && !formData.isHalfDay ? 'Tag' : 'Tage'} Abwesenheit
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {currentStep === 'substitute' && (
                        <div className="space-y-6 animate-in zoom-in-95 duration-500 slide-in-from-right-4">
                            <Card className="p-8 border-gray-100 shadow-sm bg-white">
                                <div className="max-w-xl mx-auto space-y-8">
                                    <div className="text-center space-y-2">
                                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Team-Unterstützung</h3>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Wer übernimmt Ihre Aufgaben?</p>
                                    </div>
                                    <SubstituteSearch 
                                        selectedEmail={formData.substitute.email}
                                        onSelect={(sub) => setFormData({ ...formData, substitute: sub })} 
                                    />
                                    {formData.substitute.name && (
                                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3 animate-in zoom-in-95">
                                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                            <span className="text-xs font-bold text-emerald-800 uppercase tracking-tight">
                                                {formData.substitute.name} wurde als Vertretung ausgewählt
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            <HandoverSection 
                                enabled={formData.handoverEnabled}
                                onToggle={(v) => setFormData({ ...formData, handoverEnabled: v })}
                                items={formData.handoverItems}
                                onItemsChange={(items) => setFormData({ ...formData, handoverItems: items })}
                                generalNotes={formData.generalNotes}
                                onGeneralNotesChange={(notes) => setFormData({ ...formData, generalNotes: notes })}
                                emergencyContact={formData.emergencyContact}
                                onEmergencyContactChange={(ec) => setFormData({ ...formData, emergencyContact: ec })}
                                substituteName={formData.substitute.name}
                                recommendHandover={totalDays >= 3}
                            />
                        </div>
                    )}

                    {currentStep === 'auto-reply' && (
                        <Card className="p-8 border-gray-100 shadow-sm animate-in zoom-in-95 duration-500 slide-in-from-right-4">
                            <div className="max-w-2xl mx-auto space-y-8">
                                <div className="flex items-center justify-between p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm border transition-all duration-500",
                                            formData.autoReplyEnabled ? "bg-primary-600 text-white" : "bg-white text-gray-300"
                                        )}>
                                            <Send className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Auto-Reply</h3>
                                            <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-tight">
                                                Automatische Abwesenheitsnotiz via Graph API
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setFormData({ ...formData, autoReplyEnabled: !formData.autoReplyEnabled })}
                                        className={cn(
                                            "w-14 h-8 rounded-full transition-all duration-300 relative shadow-inner",
                                            formData.autoReplyEnabled ? "bg-primary-600" : "bg-gray-100"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-all shadow-xl",
                                            formData.autoReplyEnabled ? "translate-x-6" : "translate-x-0"
                                        )} />
                                    </button>
                                </div>

                                {formData.autoReplyEnabled && (
                                    <div className="space-y-6 pt-4 animate-in zoom-in-95">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Betreff der Nachricht</label>
                                            <input 
                                                type="text" 
                                                value={formData.autoReplySubject}
                                                onChange={(e) => setFormData({ ...formData, autoReplySubject: e.target.value })}
                                                className="w-full h-12 px-5 rounded-2xl border border-gray-100 font-bold text-gray-700 bg-white focus:border-primary-500 transition-all outline-none"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Inhalt der Abwesenheitsnotiz</label>
                                            <div className="relative">
                                                <textarea 
                                                    value={formData.autoReplyMessage}
                                                    onChange={(e) => setFormData({ ...formData, autoReplyMessage: e.target.value })}
                                                    rows={6}
                                                    className="w-full px-5 py-4 rounded-2xl border border-gray-100 font-bold text-gray-700 bg-white focus:border-primary-500 transition-all outline-none resize-none"
                                                />
                                                <div className="absolute bottom-4 right-4 bg-gray-50/50 p-2 rounded-lg border border-gray-100 backdrop-blur-sm">
                                                    <RefreshCcw 
                                                        className="h-4 w-4 text-primary-500 cursor-pointer hover:rotate-180 transition-transform duration-500" 
                                                        onClick={() => setFormData({ ...formData, autoReplyMessage: `Vielen Dank für Ihre Nachricht. Ich bin von ${format(new Date(formData.startDate), 'dd.MM.yyyy')} bis ${format(new Date(formData.endDate), 'dd.MM.yyyy')} nicht im Büro. In dringenden Fällen wenden Sie sich bitte an ${formData.substitute.name || 'meine Vertretung'}.` })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-primary-50/30 rounded-2xl border border-primary-100 flex items-start gap-4">
                                            <Info className="h-5 w-5 text-primary-500 shrink-0 mt-0.5" />
                                            <p className="text-[10px] font-bold text-primary-800 leading-relaxed uppercase tracking-tight">
                                                Platzhalter wie <span className="underline">{'{startDate}'}</span>, <span className="underline">{'{endDate}'}</span> und <span className="underline">{'{substituteName}'}</span> werden beim Versenden automatisch durch Ihre aktuellen Daten ersetzt.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}

                    {currentStep === 'confirmation' && (
                        <div className="space-y-6 animate-in zoom-in-95 duration-500 slide-in-from-right-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="p-8 border-gray-100 shadow-sm relative overflow-hidden group">
                                     <div className="absolute -right-4 -top-4 text-emerald-500/5 group-hover:scale-125 transition-transform duration-1000">
                                         <CheckCircle2 className="h-32 w-32" />
                                     </div>
                                     <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                         <Calendar className="h-4 w-4 text-primary-500" /> Abwesenheit
                                     </h3>
                                     <div className="space-y-4">
                                         <div className="flex items-center justify-between">
                                             <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Typ</span>
                                             <Badge className="bg-primary-50 text-primary-700 font-black px-3 py-1 rounded-full uppercase tracking-tighter text-[10px]">
                                                 {ABSENCE_TYPES.find(t => t.id === formData.type)?.label}
                                             </Badge>
                                         </div>
                                         <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                                             <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Zeitraum</span>
                                             <div className="text-right">
                                                 <p className="text-sm font-black text-gray-900 tracking-tight">
                                                     {format(new Date(formData.startDate), 'dd. LLL yyyy', { locale: de })}
                                                 </p>
                                                 <p className="text-[10px] font-black text-primary-500 uppercase tracking-tight text-center">— bis —</p>
                                                 <p className="text-sm font-black text-gray-900 tracking-tight">
                                                     {format(new Date(formData.endDate), 'dd. LLL yyyy', { locale: de })}
                                                 </p>
                                             </div>
                                         </div>
                                         <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                                              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gesamt</span>
                                              <span className="text-sm font-black text-primary-700">{formData.isHalfDay ? '0.5' : totalDays} Tage</span>
                                         </div>
                                     </div>
                                </Card>

                                <Card className="p-8 border-gray-100 shadow-sm">
                                     <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                         <UserPlus className="h-4 w-4 text-primary-500" /> Vertretung & Übergabe
                                     </h3>
                                     <div className="space-y-4 text-center py-4">
                                         {formData.substitute.name ? (
                                             <div className="space-y-3">
                                                  <div className="h-16 w-16 rounded-2xl bg-primary-50 text-primary-600 border border-primary-100 flex items-center justify-center mx-auto shadow-sm">
                                                      <UserPlus className="h-8 w-8" />
                                                  </div>
                                                  <div>
                                                      <p className="text-sm font-black text-gray-900 tracking-tight">{formData.substitute.name}</p>
                                                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{formData.substitute.email}</p>
                                                  </div>
                                                  {formData.handoverEnabled && (
                                                      <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                          <ClipboardList className="h-3 w-3" /> {formData.handoverItems.filter(i => i.title.trim()).length} Übergabe-Tasks
                                                      </div>
                                                  )}
                                             </div>
                                         ) : (
                                             <div className="py-6 italic text-gray-300 text-sm font-medium">Keine Vertretung angegeben</div>
                                         )}
                                     </div>
                                </Card>
                            </div>

                            <Card className="p-8 border-gray-100 shadow-sm bg-gradient-to-r from-primary-600 to-indigo-700 text-white relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 text-white/10 group-hover:scale-125 transition-transform duration-1000">
                                    <Send className="h-24 w-24" />
                                </div>
                                <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Info className="h-4 w-4" /> Ready for Takeoff?
                                </h3>
                                <p className="text-sm font-medium leading-relaxed mb-6 max-w-lg">
                                    Nach Klick auf "Abwesenheit beantragen" wird Ihr Team informiert und (falls aktiviert) Ihre Outlook-Abwesenheitsnotiz hinterlegt.
                                </p>
                                <Button 
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="w-full h-14 bg-white text-primary-700 hover:bg-gray-50 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-black/20 group"
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 border-2 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
                                            Wird verarbeitet...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            Abwesenheit beantragen
                                            <Send className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        </div>
                                    )}
                                </Button>
                            </Card>
                        </div>
                    )}
                </div>

                {/* Wizard Navigation */}
                {currentStep !== 'confirmation' && (
                    <div className="flex items-center justify-between pt-4 pb-12">
                        <Button 
                            variant="ghost" 
                            disabled={currentStep === 'details' || isSubmitting}
                            onClick={handleBack}
                            className={cn(
                                "h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[11px] border border-gray-100 bg-white shadow-sm transition-all",
                                currentStep === 'details' ? "opacity-0 pointer-events-none" : "hover:bg-gray-50"
                            )}
                        >
                            <ChevronLeft className="h-4 w-4 mr-2" /> Zurück
                        </Button>
                        <Button 
                            onClick={handleNext}
                            disabled={isSubmitting}
                            className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-[11px] bg-primary-600 text-white shadow-xl shadow-primary-100 hover:bg-primary-700 hover:-translate-y-0.5 transition-all group"
                        >
                            {currentStep === 'auto-reply' ? 'Review & Senden' : 'Weiter'} 
                            <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}