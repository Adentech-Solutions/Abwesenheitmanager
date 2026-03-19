'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { 
    Settings, RefreshCw, KeyRound, Cloud, CheckCircle2, 
    XCircle, Info, Link as LinkIcon, Users, Trash2, 
    Edit2, Eye, EyeOff, ExternalLink, ShieldCheck, Zap,
    Clock, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function IntegrationsPage() {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    
    // Config form states
    const [clientId, setClientId] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    const [showSecret, setShowSecret] = useState(false);
    
    // Testing states
    const [testResult, setTestResult] = useState<any>(null);
    
    // Settings states
    const [settings, setSettings] = useState({
        autoSyncEnabled: false,
        syncIntervalHours: 24,
        writeBackEnabled: true,
    });

    // 1. Fetch Personio Config
    const { data: configData, isLoading: isLoadingConfig } = useQuery({
        queryKey: ['admin-integration-personio'],
        queryFn: async () => {
            const res = await fetch('/api/admin/integrations/personio');
            if (!res.ok) throw new Error('Failed to fetch config');
            return res.json();
        },
    });

    // 2. Fetch Users (for mapping table)
    const { data: usersData, isLoading: isLoadingUsers } = useQuery({
        queryKey: ['admin-users-all'],
        queryFn: async () => {
            const res = await fetch('/api/admin/users?limit=500');
            if (!res.ok) throw new Error('Failed to fetch users');
            return res.json();
        },
        enabled: !!configData?.configured,
    });

    useEffect(() => {
        if (configData?.settings) {
            setSettings({
                autoSyncEnabled: configData.settings.autoSyncEnabled ?? false,
                syncIntervalHours: configData.settings.syncIntervalHours ?? 24,
                writeBackEnabled: configData.settings.writeBackEnabled ?? true,
            });
        }
    }, [configData]);

    const isConfigured = configData?.configured;
    const users = usersData?.users || [];
    const mappedUsers = users.filter((u: any) => u.personioId);

    // Mutations
    const testMutation = useMutation({
        mutationFn: async (credentials: { clientId: string, clientSecret: string }) => {
            const res = await fetch('/api/admin/integrations/personio/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Test failed');
            return data;
        },
        onSuccess: (data) => {
            setTestResult(data);
            toast.success('Verbindung erfolgreich getestet!');
        },
        onError: (error: any) => {
            setTestResult({ success: false, error: error.message });
            toast.error(error.message);
        },
    });

    const saveCredentialsMutation = useMutation({
        mutationFn: async (credentials: { clientId: string, clientSecret: string }) => {
            const res = await fetch('/api/admin/integrations/personio/credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Speichern fehlgeschlagen');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-integration-personio'] });
            toast.success('Zugangsdaten erfolgreich gespeichert!');
            setIsEditing(false);
            setClientId('');
            setClientSecret('');
            setTestResult(null);
        },
        onError: (error: any) => {
            toast.error(error.message);
        },
    });

    const deleteCredentialsMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/admin/integrations/personio', { method: 'DELETE' });
            if (!res.ok) throw new Error('Entfernen fehlgeschlagen');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-integration-personio'] });
            toast.success('Verbindung getrennt');
        },
    });

    const updateSettingsMutation = useMutation({
        mutationFn: async (newSettings: any) => {
            const res = await fetch('/api/admin/integrations/personio/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSettings),
            });
            if (!res.ok) throw new Error('Einstellungen speichern fehlgeschlagen');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-integration-personio'] });
            toast.success('Einstellungen gespeichert');
        },
    });

    const syncMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/admin/sync/personio', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Sync fehlgeschlagen');
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['admin-users-all'] });
            queryClient.invalidateQueries({ queryKey: ['admin-integration-personio'] });
            if (data.status === 'completed') {
                toast.success(`Sync fertig: ${data.stats.updated} akt., ${data.stats.errors} Fehler`);
            } else {
                toast.error('Sync mit Fehlern beendet');
            }
        },
        onError: (error: any) => toast.error(error.message),
    });

    // Event Handlers
    const handleTest = (e: React.FormEvent) => {
        e.preventDefault();
        testMutation.mutate({ clientId, clientSecret });
    };

    const handleSaveCredentials = () => {
        saveCredentialsMutation.mutate({ clientId, clientSecret });
    };

    const handleSaveSettings = () => {
        updateSettingsMutation.mutate(settings);
    };

    const handleDelete = () => {
        if (window.confirm('Verbindung wirklich trennen? Zugangsdaten werden sicher gelöscht.')) {
            deleteCredentialsMutation.mutate();
        }
    };

    if (isLoadingConfig && !configData) {
        return (
            <DashboardLayout>
                <div className="h-[60vh] flex items-center justify-center">
                    <LoadingSpinner text="Integrationen werden geladen..." />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-in fade-in duration-500">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
                            <Zap className="h-7 w-7 text-primary-600" />
                            Integrationen
                        </h1>
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                            Verbinden Sie externe HR-Systeme und Cloud-Dienste für automatisierten Datenabgleich
                        </p>
                    </div>
                </div>

                {/* Personio Setup State */}
                {(!isConfigured || isEditing) ? (
                    <Card className="p-8 border-gray-100 shadow-sm animate-in slide-in-from-bottom-4 duration-500 delay-0">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shadow-sm">
                                <KeyRound className="w-7 h-7" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900 tracking-tight">Personio verbinden</h2>
                                <p className="text-sm font-bold text-gray-400">Synchronisieren Sie Urlaubskontingente über die offizielle API</p>
                            </div>
                        </div>
                        
                        <div className="bg-primary-50/50 border border-primary-100 rounded-2xl p-5 text-sm text-primary-800 flex gap-4 mb-8">
                            <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-primary-600" />
                            <div className="space-y-1">
                                <p className="font-bold">Konfigurations-Hinweis</p>
                                <p className="text-xs text-primary-700/80 leading-relaxed font-medium">
                                    Die Zugangsdaten finden Sie in Ihrem Personio-Account unter <strong className="font-black">Einstellungen → Integrationen → API-Zugangsdaten</strong>. 
                                    Stellen Sie sicher, dass die Berechtigungen für "Employees" und "Absences" gesetzt sind.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleTest} className="space-y-6 max-w-xl">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Client ID</label>
                                <Input 
                                    type="text" 
                                    required
                                    className="h-11 rounded-xl border-gray-100 bg-white font-bold text-gray-700 shadow-sm transition-all"
                                    value={clientId}
                                    onChange={e => setClientId(e.target.value)}
                                    placeholder="zz.B. abcdef1234..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Client Secret</label>
                                <div className="relative">
                                    <Input 
                                        type={showSecret ? "text" : "password"}
                                        required
                                        className="h-11 rounded-xl border-gray-100 bg-white font-bold text-gray-700 shadow-sm pr-12 transition-all"
                                        value={clientSecret}
                                        onChange={e => setClientSecret(e.target.value)}
                                    />
                                    <button 
                                        type="button"
                                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-300 hover:text-gray-500 transition-colors"
                                        onClick={() => setShowSecret(!showSecret)}
                                    >
                                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {testResult && (
                                <div className={cn(
                                    "p-4 rounded-2xl border animate-in zoom-in-95 duration-300",
                                    testResult.success ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-100'
                                )}>
                                    <div className="flex items-start gap-3">
                                        {testResult.success ? <CheckCircle2 className="w-5 h-5 mt-0.5" /> : <XCircle className="w-5 h-5 mt-0.5" />}
                                        <div>
                                            {testResult.success ? (
                                                <>
                                                    <p className="text-sm font-black tracking-tight">Verbindung erfolgreich!</p>
                                                    <p className="text-[11px] mt-0.5 font-bold opacity-80">{testResult.employeeCount} Mitarbeiter und {testResult.absenceTypeCount} Abwesenheitstypen gefunden.</p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-sm font-black tracking-tight">Verbindung fehlgeschlagen</p>
                                                    <p className="text-[11px] mt-0.5 font-bold opacity-80">{testResult.error}</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-3 pt-4">
                                <Button 
                                    type="submit" 
                                    variant="outline" 
                                    isLoading={testMutation.isPending}
                                    className="rounded-xl font-bold shadow-sm"
                                >
                                    Verbindung testen
                                </Button>
                                <Button 
                                    type="button" 
                                    disabled={!testResult?.success}
                                    onClick={handleSaveCredentials}
                                    isLoading={saveCredentialsMutation.isPending}
                                    className="rounded-xl font-bold shadow-sm bg-primary-600 hover:bg-primary-700"
                                >
                                    Konfiguration speichern
                                </Button>
                                {isConfigured && (
                                    <Button type="button" variant="secondary" className="rounded-xl font-bold" onClick={() => {
                                        setIsEditing(false);
                                        setTestResult(null);
                                    }}>Abbrechen</Button>
                                )}
                            </div>
                        </form>
                    </Card>
                ) : (
                    // Personio Active State
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="space-y-8 lg:col-span-2">
                            {/* Connection Status */}
                            <Card className="p-8 border-gray-100 shadow-sm animate-in slide-in-from-bottom-4 duration-500 delay-0">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shadow-sm">
                                            <ShieldCheck className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-gray-900 tracking-tight">Personio HR Suite</h2>
                                            <p className="text-sm font-bold text-gray-400">Aktive Schnittstellen-Verbindung</p>
                                        </div>
                                    </div>
                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold px-3 py-1 rounded-full border shadow-sm uppercase text-[10px] tracking-widest">
                                        Active
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                                    <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Mitarbeiter-ID</p>
                                        <code className="text-sm font-bold text-gray-700 tracking-tighter">{configData.clientIdMasked}</code>
                                    </div>
                                    <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Autorisiert von</p>
                                        <p className="text-sm font-bold text-gray-700 truncate">{configData.configuredBy || 'System'}</p>
                                    </div>
                                    <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Status seit</p>
                                        <p className="text-sm font-bold text-gray-700">
                                            {configData.configuredAt ? new Date(configData.configuredAt).toLocaleDateString('de-DE') : '-'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <Button variant="outline" size="sm" className="rounded-xl font-bold border-gray-100 shadow-sm" onClick={() => setIsEditing(true)}>
                                        <Edit2 className="w-4 h-4 mr-2" />
                                        Daten ändern
                                    </Button>
                                    <Button variant="danger" size="sm" className="rounded-xl font-bold shadow-sm" onClick={handleDelete} isLoading={deleteCredentialsMutation.isPending}>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Verbindung trennen
                                    </Button>
                                    <Button variant="secondary" size="sm" className="rounded-xl font-bold shadow-sm ml-auto" onClick={() => syncMutation.mutate()} isLoading={syncMutation.isPending}>
                                        <RefreshCw className={cn("w-4 h-4 mr-2", syncMutation.isPending && "animate-spin")} />
                                        Sync erzwingen
                                    </Button>
                                </div>
                            </Card>

                            {/* Sync Settings */}
                            <Card className="p-8 border-gray-100 shadow-sm animate-in slide-in-from-bottom-4 duration-500 delay-150">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8 border-b border-gray-50 pb-4">
                                     Sync-Automatisierung
                                </h3>
                                
                                <div className="space-y-8 max-w-2xl">
                                    <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-50 group hover:border-primary-100 transition-colors">
                                        <div className="flex gap-4">
                                            <div className={cn(
                                                "p-2 rounded-xl border self-start transition-colors",
                                                settings.autoSyncEnabled ? "bg-primary-50 text-primary-600 border-primary-100" : "bg-gray-100 text-gray-300 border-gray-200"
                                            )}>
                                                <RefreshCw className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 tracking-tight">Hintergrund-Synchronisation</p>
                                                <p className="text-xs font-bold text-gray-400">Urlaubsstände im Hintergrund automatisiert abgleichen</p>
                                            </div>
                                        </div>
                                        <div className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none" onClick={() => setSettings({...settings, autoSyncEnabled: !settings.autoSyncEnabled})}>
                                            <span className={cn(
                                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                                settings.autoSyncEnabled ? "translate-x-5" : "translate-x-0"
                                            )} />
                                            <span className={cn(
                                                "absolute inset-0 -z-10 h-full w-full rounded-full transition-colors",
                                                settings.autoSyncEnabled ? "bg-primary-500" : "bg-gray-200"
                                            )} />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-50">
                                        <div className="flex gap-4">
                                            <div className="p-2 rounded-xl bg-gray-100 text-gray-500 border border-gray-200 self-start">
                                                <Clock className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 tracking-tight">Sync-Intervall</p>
                                                <p className="text-xs font-bold text-gray-400">Zeitfenster für die automatische Aktualisierung</p>
                                            </div>
                                        </div>
                                        <select
                                            disabled={!settings.autoSyncEnabled}
                                            value={settings.syncIntervalHours}
                                            onChange={e => setSettings({...settings, syncIntervalHours: Number(e.target.value)})}
                                            className="text-xs font-bold rounded-xl border border-gray-100 px-3 py-2 bg-white shadow-sm disabled:opacity-30 cursor-pointer focus:ring-primary-500"
                                        >
                                            <option value={6}>Alle 6 Stunden</option>
                                            <option value={12}>Alle 12 Stunden</option>
                                            <option value={24}>Täglich (02:00 Uhr)</option>
                                        </select>
                                    </div>

                                    <div className="flex items-start justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-50 group hover:border-emerald-100 transition-colors">
                                        <div className="flex gap-4">
                                            <div className={cn(
                                                "p-2 rounded-xl border self-start transition-colors",
                                                settings.writeBackEnabled ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-gray-100 text-gray-300 border-gray-200"
                                            )}>
                                                <ExternalLink className="h-4 w-4" />
                                            </div>
                                            <div className="max-w-md">
                                                <p className="text-sm font-bold text-gray-900 tracking-tight">Zwei-Wege-Synchronisation</p>
                                                <p className="text-[11px] font-bold text-gray-400 mt-1 leading-relaxed">
                                                    Genehmigte Urlaubsanträge werden automatisch an Personio gemeldet und im Mitarbeiterprofil hinterlegt.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none" onClick={() => setSettings({...settings, writeBackEnabled: !settings.writeBackEnabled})}>
                                            <span className={cn(
                                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                                settings.writeBackEnabled ? "translate-x-5" : "translate-x-0"
                                            )} />
                                            <span className={cn(
                                                "absolute inset-0 -z-10 h-full w-full rounded-full transition-colors",
                                                settings.writeBackEnabled ? "bg-emerald-500" : "bg-gray-200"
                                            )} />
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <Button onClick={handleSaveSettings} isLoading={updateSettingsMutation.isPending} className="rounded-xl font-bold px-8 shadow-md shadow-primary-100 bg-primary-600 hover:bg-primary-700">
                                            Einstellungen speichern
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                            
                            {/* Employee Mapping Table */}
                            <Card className="overflow-hidden border-gray-100 shadow-sm animate-in slide-in-from-bottom-4 duration-500 delay-300">
                                <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-white">
                                    <div>
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Mitarbeiter-Mapping</h3>
                                        <p className="text-sm font-bold text-gray-900 tracking-tight">
                                            <span className="text-primary-600">{mappedUsers.length}</span> von {users.length} Benutzer verknüpft
                                        </p>
                                    </div>
                                    <div className="p-2 bg-primary-50 rounded-xl">
                                        <Users className="h-5 w-5 text-primary-500" />
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-50">
                                        <thead className="bg-gray-50/50">
                                            <tr>
                                                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Mitarbeiter Dashboard</th>
                                                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Verknüpfungs-Status</th>
                                                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Daten-Quelle</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-50">
                                            {isLoadingUsers ? (
                                                <tr><td colSpan={3} className="px-8 py-12 text-center"><LoadingSpinner size="sm" /></td></tr>
                                            ) : users.map((u: any) => (
                                                <tr key={u._id} className="group hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-8 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-full bg-primary-50 flex items-center justify-center border border-primary-100 text-[10px] font-black text-primary-600 uppercase">
                                                                {u.name?.[0]}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-sm text-gray-900 tracking-tight">{u.name}</p>
                                                                <p className="text-[10px] font-black text-gray-400 tracking-tighter uppercase">{u.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-4 whitespace-nowrap">
                                                        {u.personioId ? (
                                                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold px-2 py-0.5 rounded-lg border shadow-sm uppercase text-[9px] tracking-widest">
                                                                <LinkIcon className="w-3 h-3 mr-1" /> Bound ({u.personioId})
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-gray-300 font-bold px-2 py-0.5 rounded-lg border-gray-100 uppercase text-[9px] tracking-widest">
                                                                Unlinked
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-4 whitespace-nowrap">
                                                        {u.vacationDays?.source === 'personio' ? (
                                                            <Badge className="bg-primary-50 text-primary-700 border-primary-100 font-bold px-2 py-0.5 rounded-lg border shadow-sm uppercase text-[9px] tracking-widest">
                                                                Personio API
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-gray-50 text-gray-500 border-gray-100 font-bold px-2 py-0.5 rounded-lg border shadow-sm uppercase text-[9px] tracking-widest">
                                                                Internal
                                                            </Badge>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>

                        {/* Right Sidebar - Info text */}
                        <div className="space-y-8">
                            <Card className="bg-primary-600 text-white p-8 rounded-3xl overflow-hidden relative group">
                                <div className="relative z-10">
                                    <h3 className="text-lg font-black tracking-tight mb-6 flex items-center gap-2">
                                        <Info className="w-5 h-5 text-primary-200"/> Integration Guide
                                    </h3>
                                    <ul className="space-y-4">
                                        {[
                                            "Automatischer Kontingent-Abgleich",
                                            "Direkte Response-Meldung an HR",
                                            "Verschlüsselte Credential-Speicherung",
                                            "Audit-Logs jeder Sync-Aktion"
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <div className="h-4 w-4 rounded-full bg-primary-500/50 flex items-center justify-center mt-0.5 border border-primary-400">
                                                    <CheckCircle2 className="h-2.5 w-2.5 text-primary-100" />
                                                </div>
                                                <span className="text-xs font-bold text-primary-50/90 leading-tight">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                {/* Abstract background elements */}
                                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-primary-500 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity" />
                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-400/30 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700" />
                            </Card>

                            <Card className="p-8 border-gray-100 shadow-sm rounded-3xl">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Partner Directory</h3>
                                
                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                                <Cloud className="w-4 h-4" />
                                            </div>
                                            <span className="text-xs font-bold text-gray-900 tracking-tight">Microsoft Entra</span>
                                        </div>
                                        <Badge className="bg-gray-100 text-gray-500 border-none text-[9px] font-black uppercase tracking-tighter">Connected</Badge>
                                    </div>

                                    <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl flex items-center justify-between opacity-50">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 text-indigo-400 rounded-xl">
                                                <Users className="w-4 h-4" />
                                            </div>
                                            <span className="text-xs font-bold text-gray-400 tracking-tight">MS Teams Bot</span>
                                        </div>
                                        <Badge className="bg-gray-50 text-gray-400 border-none text-[9px] font-black uppercase tracking-tighter">Sprint 4</Badge>
                                    </div>
                                </div>
                                <div className="mt-8 pt-6 border-t border-gray-50 flex flex-col items-center">
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-center mb-4">You need another provider?</p>
                                    <Button variant="ghost" size="sm" className="text-xs font-bold text-primary-600 hover:bg-primary-50 rounded-xl">
                                        Request Custom Integration <ChevronRight className="h-3 w-3 ml-1" />
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
