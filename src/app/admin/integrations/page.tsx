'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Settings, RefreshCw, KeyRound, Cloud, CheckCircle2, XCircle, Info, Link as LinkIcon, Users, Trash2, Edit2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

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
        enabled: configData?.configured,
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

    if (isLoadingConfig && !isConfigured) {
        return (
            <DashboardLayout>
                <div className="flex justify-center p-12"><RefreshCw className="animate-spin text-gray-400 w-8 h-8" /></div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Integrationen</h1>
                    <p className="text-gray-600">Verwalten Sie Drittanbieter-Anbindungen und Synchronisationen</p>
                </div>

                {/* Personio Setup State */}
                {(!isConfigured || isEditing) ? (
                    <Card>
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                                    <KeyRound className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Personio verbinden</h2>
                                    <p className="text-gray-600 text-sm">Verbinden Sie Personio um Urlaubskontingente automatisch zu synchronisieren</p>
                                </div>
                            </div>
                            
                            <hr className="my-6" />

                            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-800 flex gap-3 mb-6">
                                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <p>Die Zugangsdaten finden Sie in Personio unter <strong>Einstellungen → Integrationen → API-Zugangsdaten</strong>.</p>
                            </div>

                            <form onSubmit={handleTest} className="space-y-4 max-w-xl">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                                    <input 
                                        type="text" 
                                        required
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                        value={clientId}
                                        onChange={e => setClientId(e.target.value)}
                                        placeholder="zz.B. abcdef1234..."
                                    />
                                </div>
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
                                    <div className="relative">
                                        <input 
                                            type={showSecret ? "text" : "password"}
                                            required
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                            value={clientSecret}
                                            onChange={e => setClientSecret(e.target.value)}
                                        />
                                        <button 
                                            type="button"
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                                            onClick={() => setShowSecret(!showSecret)}
                                        >
                                            {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                {testResult && (
                                    <div className={`p-4 rounded-md mt-4 ${testResult.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                                        <div className="flex items-start gap-3">
                                            {testResult.success ? <CheckCircle2 className="w-5 h-5 mt-0.5" /> : <XCircle className="w-5 h-5 mt-0.5" />}
                                            <div>
                                                {testResult.success ? (
                                                    <>
                                                        <p className="font-semibold">Verbindung erfolgreich!</p>
                                                        <p className="text-sm mt-1">{testResult.employeeCount} Mitarbeiter und {testResult.absenceTypeCount} Abwesenheitstypen gefunden.</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="font-semibold">Fehler bei der Verbindung</p>
                                                        <p className="text-sm mt-1">{testResult.error}</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <Button 
                                        type="submit" 
                                        variant="outline" 
                                        isLoading={testMutation.isPending}
                                    >
                                        Verbindung testen
                                    </Button>
                                    <Button 
                                        type="button" 
                                        disabled={!testResult?.success}
                                        onClick={handleSaveCredentials}
                                        isLoading={saveCredentialsMutation.isPending}
                                    >
                                        Zugangsdaten speichern
                                    </Button>
                                    {isConfigured && (
                                        <Button type="button" variant="secondary" onClick={() => {
                                            setIsEditing(false);
                                            setTestResult(null);
                                        }}>Abbrechen</Button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </Card>
                ) : (
                    // Personio Active State
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="space-y-6 lg:col-span-2">
                            {/* Connection Status */}
                            <Card>
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                                                <KeyRound className="w-6 h-6" />
                                            </div>
                                            <h2 className="text-xl font-bold text-gray-900">Personio Verbindung</h2>
                                        </div>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                            <CheckCircle2 className="w-4 h-4" /> Verbunden
                                        </span>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm mb-6">
                                        <div className="grid grid-cols-3 gap-4">
                                            <span className="text-gray-500 font-medium">Client ID:</span>
                                            <code className="text-gray-900 col-span-2">{configData.clientIdMasked}</code>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <span className="text-gray-500 font-medium">Konfiguriert von:</span>
                                            <span className="text-gray-900 col-span-2">{configData.configuredBy || 'Unbekannt'}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <span className="text-gray-500 font-medium">Zuletzt aktualisiert:</span>
                                            <span className="text-gray-900 col-span-2">
                                                {configData.configuredAt ? new Date(configData.configuredAt).toLocaleDateString('de-DE') : '-'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                            <Edit2 className="w-4 h-4 mr-2" />
                                            Zugangsdaten ändern
                                        </Button>
                                        <Button variant="danger" size="sm" onClick={handleDelete} isLoading={deleteCredentialsMutation.isPending}>
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Verbindung entfernen
                                        </Button>
                                    </div>
                                </div>
                            </Card>

                            {/* Sync Settings */}
                            <Card>
                                <div className="p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-6 border-b pb-2">Sync-Einstellungen</h3>
                                    
                                    <div className="space-y-5 max-w-xl">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900">Automatische Synchronisation</p>
                                                <p className="text-sm text-gray-500">Urlaubsstände im Hintergrund abgleichen</p>
                                            </div>
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.autoSyncEnabled}
                                                    onChange={e => setSettings({...settings, autoSyncEnabled: e.target.checked})}
                                                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900">Intervall</p>
                                                <p className="text-sm text-gray-500">Wie oft soll gesynct werden?</p>
                                            </div>
                                            <select
                                                disabled={!settings.autoSyncEnabled}
                                                value={settings.syncIntervalHours}
                                                onChange={e => setSettings({...settings, syncIntervalHours: Number(e.target.value)})}
                                                className="text-sm rounded-md border border-gray-300 px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500"
                                            >
                                                <option value={6}>Alle 6 Stunden</option>
                                                <option value={12}>Alle 12 Stunden</option>
                                                <option value={24}>Automatisch 1x nachts</option>
                                            </select>
                                        </div>

                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900">Genehmigte Urlaubsanträge an Personio zurückmelden</p>
                                                <p className="text-sm text-gray-500 max-w-sm">Wenn lokal im Portal ein Urlaub genehmigt wird, wird er automatisch zurück in das Arbeitnehmerprofil bei Personio gepusht.</p>
                                            </div>
                                            <div className="flex items-center mt-1">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.writeBackEnabled}
                                                    onChange={e => setSettings({...settings, writeBackEnabled: e.target.checked})}
                                                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4 flex justify-end">
                                            <Button onClick={handleSaveSettings} isLoading={updateSettingsMutation.isPending}>
                                                Einstellungen speichern
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Manual Sync Trigger */}
                            <Card>
                                <div className="p-6 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-gray-900">Manuelle Synchronisation</h3>
                                        <p className="text-sm text-gray-500">Kontingente jetzt updaten</p>
                                    </div>
                                    <Button onClick={() => syncMutation.mutate()} isLoading={syncMutation.isPending}>
                                        <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                                        Jetzt synchronisieren
                                    </Button>
                                </div>
                            </Card>
                            
                            {/* Employee Mapping Table */}
                            <Card>
                                <div className="p-6 border-b border-gray-200">
                                    <h3 className="font-bold text-gray-900">Mitarbeiter-Zuordnung</h3>
                                    <p className="text-sm text-gray-500">{mappedUsers.length} von {users.length} Mitarbeitern mit Personio verknüpft</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mitarbeiter</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Urlaub-Quelle</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {isLoadingUsers ? (
                                                <tr><td colSpan={3} className="px-6 py-4 text-center">Laden...</td></tr>
                                            ) : users.map((u: any) => (
                                                <tr key={u._id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="font-medium text-sm text-gray-900">{u.name}</div>
                                                        <div className="text-xs text-gray-500">{u.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {u.personioId ? (
                                                            <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full"><LinkIcon className="w-3 h-3"/> Verknüpft ({u.personioId})</span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">Nicht verknüpft</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {u.vacationDays?.source === 'personio' ? (
                                                            <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-200">Personio API</span>
                                                        ) : (
                                                            <span className="text-xs text-gray-500">Lokal / Entra</span>
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
                        <div className="space-y-6">
                            <Card>
                                <div className="bg-blue-50 p-6 rounded-lg text-sm text-blue-900">
                                    <h3 className="font-bold mb-3 text-blue-900 border-b border-blue-200 pb-2 flex items-center gap-2">
                                        <Info className="w-5 h-5"/> So funktioniert die Integration
                                    </h3>
                                    <ul className="space-y-3 list-disc pl-5">
                                        <li>Urlaubskontingente werden automatisch synchronisiert, basierend auf den Personio Ansprüchen.</li>
                                        <li>Genehmigte Urlaubsanträge werden an Personio zurückgemeldet, ohne dass ein Manager dort erneut bestätigen muss.</li>
                                        <li>Krankmeldungen werden <strong className="font-bold">NICHT</strong> synchronisiert, sie verbleiben sicher im lokalen System.</li>
                                        <li>Bei einer Stornierung durch den Nutzer oder Manager wird der Eintrag in Personio automatisch gelöscht.</li>
                                    </ul>
                                </div>
                            </Card>

                            <Card>
                                <div className="p-6">
                                    <h3 className="font-bold text-gray-900 mb-4 border-b pb-2">Weitere Integrationen</h3>
                                    
                                    <div className="space-y-4">
                                        <div className="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Cloud className="text-blue-600 w-5 h-5" />
                                                <span className="font-medium text-gray-900">Microsoft Entra ID</span>
                                            </div>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Via ENV fixiert</span>
                                        </div>

                                        <div className="p-4 border border-gray-200 rounded-lg flex items-center justify-between opacity-60">
                                            <div className="flex items-center gap-3">
                                                <Users className="text-purple-600 w-5 h-5" />
                                                <span className="font-medium text-gray-900">Microsoft Teams Bot</span>
                                            </div>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Demnächst</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
