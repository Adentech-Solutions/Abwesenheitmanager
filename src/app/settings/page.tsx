'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
    Building2, MapPin, Calendar, Bell, Shield,
    Save, CheckCircle2, ChevronRight, Settings as SettingsIcon,
    Info, InfoIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── German states ────────────────────────────────────────────────────────────
const GERMAN_STATES = [
    { code: 'BW', name: 'Baden-Württemberg' },
    { code: 'BY', name: 'Bayern' },
    { code: 'BE', name: 'Berlin' },
    { code: 'BB', name: 'Brandenburg' },
    { code: 'HB', name: 'Bremen' },
    { code: 'HH', name: 'Hamburg' },
    { code: 'HE', name: 'Hessen' },
    { code: 'MV', name: 'Mecklenburg-Vorpommern' },
    { code: 'NI', name: 'Niedersachsen' },
    { code: 'NW', name: 'Nordrhein-Westfalen' },
    { code: 'RP', name: 'Rheinland-Pfalz' },
    { code: 'SL', name: 'Saarland' },
    { code: 'SN', name: 'Sachsen' },
    { code: 'ST', name: 'Sachsen-Anhalt' },
    { code: 'SH', name: 'Schleswig-Holstein' },
    { code: 'TH', name: 'Thüringen' },
];

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ icon: Icon, title, description, children, delay }: {
    icon: React.ElementType;
    title: string;
    description: string;
    children: React.ReactNode;
    delay?: string;
}) {
    return (
        <Card className={cn(
            "p-6 hover:shadow-md transition-all border-gray-100 animate-in fade-in slide-in-from-bottom-4 fill-mode-both",
            delay
        )}>
            <div className="flex items-start gap-4 mb-8">
                <div className="p-3 bg-primary-50 rounded-2xl shrink-0 shadow-sm border border-primary-100">
                    <Icon className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{description}</p>
                </div>
            </div>
            <div className="space-y-6">{children}</div>
        </Card>
    );
}

// ─── Field components ─────────────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 group">
            <div className="sm:w-64 shrink-0 pt-2 lg:pt-3">
                <p className="text-sm font-bold text-gray-700 tracking-tight group-hover:text-primary-600 transition-colors uppercase text-[10px] tracking-widest">{label}</p>
                {hint && <p className="text-xs text-gray-400 mt-1 leading-relaxed font-medium">{hint}</p>}
            </div>
            <div className="flex-1">{children}</div>
        </div>
    );
}

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
    return (
        <label className="flex items-start gap-4 cursor-pointer group select-none">
            <div 
                onClick={() => onChange(!checked)}
                className={cn(
                    "relative w-12 h-6.5 rounded-full transition-all duration-300 shadow-inner mt-0.5",
                    checked ? 'bg-primary-600' : 'bg-gray-200'
                )}
            >
                <div className={cn(
                    "absolute top-1 w-4.5 h-4.5 rounded-full bg-white shadow-md transition-all duration-300 transform",
                    checked ? 'translate-x-6' : 'translate-x-1'
                )} />
            </div>
            <div className="flex-1" onClick={() => onChange(!checked)}>
                <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900 transition-colors">{label}</span>
                {description && <p className="text-xs text-gray-400 font-medium mt-0.5">{description}</p>}
            </div>
        </label>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const queryClient = useQueryClient();
    const userRole = (session?.user as any)?.role;

    // Redirect non-admins
    useEffect(() => {
        if (status === 'loading') return;
        if (!session) { router.push('/'); return; }
        if (userRole === undefined) return;
        if (userRole !== 'admin') router.push('/dashboard');
    }, [session, status, userRole, router]);

    // Load settings
    const { data, isLoading } = useQuery({
        queryKey: ['company-settings'],
        queryFn: async () => {
            const res = await fetch('/api/settings/company');
            if (!res.ok) throw new Error('Failed to load settings');
            return res.json();
        },
        enabled: userRole === 'admin',
    });

    const [form, setForm] = useState({
        companyName: '',
        state: 'BY',
        vacationDaysPerYear: 30,
        carryOverDays: 5,
        maxConcurrentAbsences: 3,
        requireApproval: true,
        autoApproveAfterDays: 0,
        notifyManagerOnRequest: true,
        notifyUserOnApproval: true,
    });

    // Populate form once data arrives
    useEffect(() => {
        if (data?.settings) {
            const s = data.settings;
            setForm({
                companyName: s.companyName ?? '',
                state: s.state ?? 'BY',
                vacationDaysPerYear: s.vacationDaysPerYear ?? 30,
                carryOverDays: s.carryOverDays ?? 5,
                maxConcurrentAbsences: s.maxConcurrentAbsences ?? 3,
                requireApproval: s.requireApproval ?? true,
                autoApproveAfterDays: s.autoApproveAfterDays ?? 0,
                notifyManagerOnRequest: s.notifyManagerOnRequest ?? true,
                notifyUserOnApproval: s.notifyUserOnApproval ?? true,
            });
        }
    }, [data]);

    const set = (key: keyof typeof form, value: any) =>
        setForm(prev => ({ ...prev, [key]: value }));

    // Save mutation
    const { mutate: save, isPending: saving } = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/settings/company', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error('Speichern fehlgeschlagen');
            return res.json();
        },
        onSuccess: () => {
            toast.success('Einstellungen gespeichert');
            queryClient.invalidateQueries({ queryKey: ['company-settings'] });
        },
        onError: (err: any) => toast.error(err.message || 'Fehler beim Speichern'),
    });

    if (status === 'loading' || (status === 'authenticated' && userRole === undefined) || isLoading) {
        return (
            <DashboardLayout>
                <div className="h-[60vh] flex items-center justify-center">
                    <LoadingSpinner text="Konfiguration wird geladen..." />
                </div>
            </DashboardLayout>
        );
    }

    const selectedState = GERMAN_STATES.find(s => s.code === form.state);

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
                            <SettingsIcon className="h-7 w-7 text-primary-600" />
                            Einstellungen
                        </h1>
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                            Globale Systemsteuerung und Unternehmensvorgaben
                        </p>
                    </div>
                    <Button
                        size="lg"
                        onClick={() => save()}
                        disabled={saving}
                        className="h-12 px-8 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-lg shadow-primary-200 transition-all"
                    >
                        {saving ? (
                            <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        Einstellungen speichern
                    </Button>
                </div>

                <div className="space-y-6">
                    {/* 1 — Unternehmen */}
                    <Section 
                        icon={Building2} 
                        title="Unternehmen" 
                        description="Identität Ihres Workspace in freyetag"
                        delay="delay-0"
                    >
                        <Field label="Offizieller Firmenname" hint="Wird in Berichten und Teams-Bots verwendet">
                            <Input 
                                value={form.companyName} 
                                onChange={e => set('companyName', e.target.value)} 
                                className="max-w-md h-11 rounded-xl border-gray-100 bg-gray-50 shadow-inner focus:bg-white transition-all font-medium"
                                placeholder="z.B. Adentech Solutions GmbH"
                            />
                        </Field>
                    </Section>

                    {/* 2 — Standort & Feiertage */}
                    <Section 
                        icon={MapPin} 
                        title="Standort & Feiertage" 
                        description="Regionale Kalendersteuerung und Feiertagsberechnung"
                        delay="delay-75"
                    >
                        <Field label="Bundesland" hint="Wichtig für die korrekte Berechnung der Brutto-Arbeitstage">
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 max-w-2xl">
                                {GERMAN_STATES.map(state => {
                                    const isSelected = form.state === state.code;
                                    return (
                                        <button
                                            key={state.code}
                                            type="button"
                                            onClick={() => set('state', state.code)}
                                            className={cn(
                                                'flex items-center gap-2.5 px-4 py-3 rounded-xl border text-[13px] font-bold transition-all shadow-sm',
                                                isSelected
                                                    ? 'border-primary-500 bg-primary-50 text-primary-700 ring-2 ring-primary-500/10'
                                                    : 'border-gray-100 bg-white text-gray-500 hover:border-primary-200 hover:bg-primary-50/30'
                                            )}
                                        >
                                            <div className={cn(
                                                "w-2 h-2 rounded-full shrink-0 transition-all",
                                                isSelected ? "bg-primary-500 scale-125 shadow-sm shadow-primary-200" : "bg-gray-200"
                                            )} />
                                            <span className="truncate">{state.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            {selectedState && (
                                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-100">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Gesetzliche Feiertage für {selectedState.name} aktiviert
                                </div>
                            )}
                        </Field>
                    </Section>

                    {/* 3 — Urlaubsregelung */}
                    <Section 
                        icon={Calendar} 
                        title="Urlaubsregelung" 
                        description="Kontingente und Abwesenheits-Richtlinien"
                        delay="delay-150"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Field label="Jahresanspruch" hint="Basistage für neue Profile">
                                <div className="flex items-center gap-3">
                                    <Input 
                                        type="number" 
                                        value={form.vacationDaysPerYear} 
                                        onChange={e => set('vacationDaysPerYear', Number(e.target.value))} 
                                        min={20} 
                                        max={45} 
                                        className="w-24 h-11 text-center font-black text-lg bg-gray-50 border-gray-100 rounded-xl"
                                    />
                                    <span className="text-sm font-bold text-gray-400">Tage / Jahr</span>
                                </div>
                            </Field>
                            <Field label="Übertragbarkeit" hint="Limit für Resturlaub-Mitnahme">
                                <div className="flex items-center gap-3">
                                    <Input 
                                        type="number" 
                                        value={form.carryOverDays} 
                                        onChange={e => set('carryOverDays', Number(e.target.value))} 
                                        min={0} 
                                        max={20} 
                                        className="w-24 h-11 text-center font-black text-lg bg-gray-50 border-gray-100 rounded-xl"
                                    />
                                    <span className="text-sm font-bold text-gray-400">Tage Limit</span>
                                </div>
                            </Field>
                        </div>
                        <div className="h-px bg-gray-50" />
                        <Field label="Kapazitätslimit" hint="Maximale gleichzeitige Fälle pro Team">
                            <div className="flex items-center gap-3">
                                <Input 
                                    type="number" 
                                    value={form.maxConcurrentAbsences} 
                                    onChange={e => set('maxConcurrentAbsences', Number(e.target.value))} 
                                    min={1} 
                                    max={50} 
                                    className="w-24 h-11 text-center font-black text-lg bg-gray-50 border-gray-100 rounded-xl"
                                />
                                <span className="text-sm font-bold text-gray-400">MA pro Team</span>
                            </div>
                        </Field>
                    </Section>

                    {/* 4 — Genehmigungsworkflow */}
                    <Section 
                        icon={Shield} 
                        title="Genehmigungsworkflow" 
                        description="Governance und Freigabeprozesse"
                        delay="delay-[225ms]"
                    >
                        <Field label="Genehmigungspflicht">
                            <Toggle
                                checked={form.requireApproval}
                                onChange={v => set('requireApproval', v)}
                                label="Approval Flow aktivieren"
                                description="Abwesenheitsanträge müssen manuell vom Vorgesetzten freigegeben werden."
                            />
                        </Field>
                        {form.requireApproval && (
                            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 animate-in zoom-in-95 duration-300">
                                <Field label="Auto-Freigabe" hint="Automatische Genehmigung nach Zeit">
                                    <div className="flex items-center gap-3">
                                        <Input
                                            type="number"
                                            value={form.autoApproveAfterDays}
                                            onChange={e => set('autoApproveAfterDays', Number(e.target.value))}
                                            min={0}
                                            max={30}
                                            className="w-24 h-11 text-center font-black text-lg bg-white border-amber-200 rounded-xl text-amber-700"
                                        />
                                        <span className="text-sm font-bold text-amber-600/60">Tage (0 = deaktiviert)</span>
                                    </div>
                                    <div className="mt-3 flex items-start gap-2 text-[11px] text-amber-600 font-medium">
                                        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                        <span>Anträge werden nach Ablauf dieser Frist automatisch genehmigt, falls der Vorgesetzte nicht reagiert.</span>
                                    </div>
                                </Field>
                            </div>
                        )}
                    </Section>

                    {/* 5 — Benachrichtigungen */}
                    <Section 
                        icon={Bell} 
                        title="Benachrichtigungen" 
                        description="Kommunikation via Microsoft Teams"
                        delay="delay-300"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Toggle
                                checked={form.notifyManagerOnRequest}
                                onChange={v => set('notifyManagerOnRequest', v)}
                                label="Manager Alerts"
                                description="Sofortige Teams-Meldung bei neuen Anträgen."
                            />
                            <Toggle
                                checked={form.notifyUserOnApproval}
                                onChange={v => set('notifyUserOnApproval', v)}
                                label="User Feedback"
                                description="Benachrichtigung bei Statusänderungen."
                            />
                        </div>
                    </Section>
                </div>

                {/* Save bottom actions */}
                <div className="flex justify-end pt-6 pb-12">
                    <Button
                        size="lg"
                        onClick={() => save()}
                        disabled={saving}
                        className="h-14 px-10 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-xl shadow-primary-100 hover:shadow-primary-200 transition-all hover:-translate-y-0.5"
                    >
                        {saving ? (
                            <div className="w-6 h-6 animate-spin rounded-full border-2 border-white border-t-transparent mr-3" />
                        ) : (
                            <Save className="h-5 w-5 mr-3" />
                        )}
                        Konfiguration anwenden
                    </Button>
                </div>

            </div>
        </DashboardLayout>
    );
}