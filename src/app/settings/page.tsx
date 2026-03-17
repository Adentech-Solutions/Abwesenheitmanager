'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import {
    Building2, MapPin, Calendar, Bell, Shield,
    Save, CheckCircle2, ChevronRight,
} from 'lucide-react';

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
function Section({ icon: Icon, title, description, children }: {
    icon: React.ElementType;
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <Card>
            <div className="flex items-start gap-4 mb-6">
                <div className="p-2.5 bg-primary-50 rounded-lg shrink-0">
                    <Icon className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                    <h2 className="font-semibold text-gray-900">{title}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{description}</p>
                </div>
            </div>
            <div className="space-y-5">{children}</div>
        </Card>
    );
}

// ─── Field components ─────────────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
            <div className="sm:w-56 shrink-0">
                <p className="text-sm font-medium text-gray-700">{label}</p>
                {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
            </div>
            <div className="flex-1">{children}</div>
        </div>
    );
}

function Input({ value, onChange, type = 'text', min, max }: {
    value: string | number; onChange: (v: any) => void; type?: string; min?: number; max?: number;
}) {
    return (
        <input
            type={type}
            value={value}
            min={min}
            max={max}
            onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
            className="w-full sm:max-w-xs px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
    );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className="flex items-center gap-3 group"
        >
            <div className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-primary-600' : 'bg-gray-200'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
        </button>
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
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                </div>
            </DashboardLayout>
        );
    }

    const selectedState = GERMAN_STATES.find(s => s.code === form.state);

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Einstellungen</h1>
                        <p className="text-gray-500 text-sm mt-1">Unternehmensweite Konfiguration</p>
                    </div>
                    <button
                        onClick={() => save()}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        {saving
                            ? <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            : <Save className="h-4 w-4" />
                        }
                        Speichern
                    </button>
                </div>

                {/* 1 — Unternehmen */}
                <Section icon={Building2} title="Unternehmen" description="Grundlegende Unternehmensangaben">
                    <Field label="Firmenname">
                        <Input value={form.companyName} onChange={v => set('companyName', v)} />
                    </Field>
                </Section>

                {/* 2 — Standort & Feiertage */}
                <Section icon={MapPin} title="Standort & Feiertage" description="Bundesland bestimmt die gesetzlichen Feiertage">
                    <Field label="Bundesland" hint="Für Feiertagsberechnung">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-md">
                            {GERMAN_STATES.map(state => (
                                <button
                                    key={state.code}
                                    type="button"
                                    onClick={() => set('state', state.code)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${form.state === state.code
                                            ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium'
                                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    {form.state === state.code && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                                    <span className="truncate">{state.name}</span>
                                </button>
                            ))}
                        </div>
                        {selectedState && (
                            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                Aktiv: {selectedState.name} ({selectedState.code})
                            </p>
                        )}
                    </Field>
                </Section>

                {/* 3 — Urlaubsregelung */}
                <Section icon={Calendar} title="Urlaubsregelung" description="Standard-Urlaubstage und Übertragungsregeln">
                    <Field label="Urlaubstage pro Jahr" hint="Gilt für neue Mitarbeiter">
                        <Input type="number" value={form.vacationDaysPerYear} onChange={v => set('vacationDaysPerYear', v)} min={20} max={40} />
                    </Field>
                    <Field label="Übertragbare Tage" hint="Max. Resturlaub ins Folgejahr">
                        <Input type="number" value={form.carryOverDays} onChange={v => set('carryOverDays', v)} min={0} max={30} />
                    </Field>
                    <Field label="Max. gleichzeitige Abwesenheiten" hint="Pro Team/Abteilung">
                        <Input type="number" value={form.maxConcurrentAbsences} onChange={v => set('maxConcurrentAbsences', v)} min={1} max={20} />
                    </Field>
                </Section>

                {/* 4 — Genehmigungsworkflow */}
                <Section icon={Shield} title="Genehmigungsworkflow" description="Wie werden Abwesenheitsanträge bearbeitet">
                    <Field label="Genehmigung erforderlich">
                        <Toggle
                            checked={form.requireApproval}
                            onChange={v => set('requireApproval', v)}
                            label="Anträge müssen genehmigt werden"
                        />
                    </Field>
                    {form.requireApproval && (
                        <Field label="Auto-Genehmigung nach Tagen" hint="0 = deaktiviert">
                            <Input
                                type="number"
                                value={form.autoApproveAfterDays}
                                onChange={v => set('autoApproveAfterDays', v)}
                                min={0}
                                max={30}
                            />
                        </Field>
                    )}
                </Section>

                {/* 5 — Benachrichtigungen */}
                <Section icon={Bell} title="Benachrichtigungen" description="Teams-Nachrichten und E-Mail-Benachrichtigungen">
                    <Field label="Manager benachrichtigen">
                        <Toggle
                            checked={form.notifyManagerOnRequest}
                            onChange={v => set('notifyManagerOnRequest', v)}
                            label="Bei neuem Antrag per Teams benachrichtigen"
                        />
                    </Field>
                    <Field label="Mitarbeiter benachrichtigen">
                        <Toggle
                            checked={form.notifyUserOnApproval}
                            onChange={v => set('notifyUserOnApproval', v)}
                            label="Bei Genehmigung/Ablehnung benachrichtigen"
                        />
                    </Field>
                </Section>

                {/* Save bottom */}
                <div className="flex justify-end pb-8">
                    <button
                        onClick={() => save()}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        {saving
                            ? <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            : <Save className="h-4 w-4" />
                        }
                        Einstellungen speichern
                    </button>
                </div>

            </div>
        </DashboardLayout>
    );
}