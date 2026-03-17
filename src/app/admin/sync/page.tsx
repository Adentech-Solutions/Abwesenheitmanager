'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { RefreshCw, Cloud, Users, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SyncPage() {
    const queryClient = useQueryClient();

    // 1. Fetch Sync Status & History
    const { data: statusData, isLoading: isLoadingStatus } = useQuery({
        queryKey: ['admin-sync-status'],
        queryFn: async () => {
            const res = await fetch('/api/admin/sync');
            if (!res.ok) throw new Error('Failed to fetch sync status');
            return res.json();
        },
    });

    const { data: historyData, isLoading: isLoadingHistory } = useQuery({
        queryKey: ['admin-sync-history'],
        queryFn: async () => {
            const res = await fetch('/api/admin/sync/history');
            if (!res.ok) throw new Error('Failed to fetch sync history');
            return res.json();
        },
    });

    const { data: configData } = useQuery({
        queryKey: ['admin-integration-personio'],
        queryFn: async () => {
            const res = await fetch('/api/admin/integrations/personio');
            if (!res.ok) throw new Error('Failed to fetch Personio config');
            return res.json();
        },
    });

    const isPersonioConfigured = configData?.configured;

    // 2. Trigger Sync Mutation
    const syncMutation = useMutation({
        mutationFn: async (type: string) => {
            const res = await fetch('/api/admin/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type }),
            });
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.error || data.message || 'Sync failed');
            }
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['admin-sync-status'] });
            queryClient.invalidateQueries({ queryKey: ['admin-sync-history'] });
            
            if (data.status === 'completed') {
                toast.success(`Sync erfolgreich (${data.stats.updated} aktualisiert, ${data.stats.errors} Fehler)`);
            } else if (data.status === 'error') {
                toast.error('Sync mit Fehlern beendet');
            }
        },
        onError: (error: any) => {
            toast.error(error.message);
        },
    });

    const triggerEntraSync = () => {
        syncMutation.mutate('entra_groups');
    };

    const personioSyncMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/admin/sync/personio', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Sync fehlgeschlagen');
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['admin-sync-status'] });
            queryClient.invalidateQueries({ queryKey: ['admin-sync-history'] });
            if (data.status === 'completed') {
                toast.success(`Personio Sync erfolgreich (${data.stats.updated} akt., ${data.stats.errors} Fehler)`);
            } else {
                toast.error('Personio Sync mit Fehlern beendet');
            }
        },
        onError: (error: any) => toast.error(error.message),
    });

    const lastSyncs = statusData?.lastSyncs || {};
    const history = historyData?.history || [];

    const formatTime = (dateString?: string) => {
        if (!dateString) return 'Nie';
        return new Date(dateString).toLocaleString('de-DE');
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium"><CheckCircle2 className="w-3 h-3 mr-1" /> Erfolgreich</span>;
            case 'error': return <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium"><XCircle className="w-3 h-3 mr-1" /> Fehler</span>;
            case 'running': return <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium animate-pulse"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Läuft</span>;
            default: return <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">{status}</span>;
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Sync Center</h1>
                    <p className="text-gray-600">Zentrale Verwaltung für Daten-Synchronisation</p>
                </div>

                {/* Integration Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Entra Groups */}
                    <Card>
                        <div className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                                        <Cloud className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900">Entra Groups</h3>
                                </div>
                                {lastSyncs.entra_groups ? getStatusBadge(lastSyncs.entra_groups.status) : <span className="text-xs text-gray-500">Unbekannt</span>}
                            </div>
                            <p className="text-sm text-gray-500 mb-6">
                                Synchronisiert Abteilungen und deren Mitglieder aus Azure Entra ID in die lokale Datenbank.
                            </p>
                            <div className="flex items-center justify-between mt-auto">
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Zuletzt: {isLoadingStatus ? '...' : formatTime(lastSyncs.entra_groups?.completedAt)}
                                </div>
                                <Button 
                                    size="sm" 
                                    onClick={triggerEntraSync}
                                    isLoading={syncMutation.isPending && syncMutation.variables === 'entra_groups'}
                                >
                                    Sync Starten
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Entra Users */}
                    <Card>
                        <div className="p-5 opacity-75">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900">Entra Users</h3>
                                </div>
                                <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                                    Bald verfügbar
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mb-6">
                                Synchronisiert Benutzerprofile, Job-Titel und Manager aus Azure Entra ID. (Sprint 3)
                            </p>
                            <div className="flex items-center justify-between mt-auto">
                                <span className="text-xs text-gray-400">Noch nicht implementiert</span>
                                <Button size="sm" disabled variant="secondary">Sync Starten</Button>
                            </div>
                        </div>
                    </Card>

                    {/* Personio */}
                    <Card>
                        <div className={`p-5 ${!isPersonioConfigured ? 'opacity-75' : ''}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900">Personio HR</h3>
                                </div>
                                {!isPersonioConfigured ? (
                                    <a href="/admin/integrations" className="inline-flex items-center px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-xs font-medium cursor-pointer transition-colors">
                                        Nicht konfiguriert
                                    </a>
                                ) : lastSyncs.personio_employees ? getStatusBadge(lastSyncs.personio_employees.status) : <span className="text-xs text-gray-500">Unbekannt</span>}
                            </div>
                            <p className="text-sm text-gray-500 mb-6">
                                Synchronisiert Urlaubskontingente und meldet genehmigte Anträge zurück.
                            </p>
                            <div className="flex items-center justify-between mt-auto">
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Zuletzt: {isLoadingStatus ? '...' : formatTime(lastSyncs.personio_employees?.completedAt)}
                                </div>
                                <Button 
                                    size="sm" 
                                    onClick={() => personioSyncMutation.mutate()}
                                    isLoading={personioSyncMutation.isPending}
                                    disabled={!isPersonioConfigured}
                                >
                                    Sync Starten
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* History Table */}
                <Card>
                    <div className="p-5 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">Sync Verlauf</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Typ</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gestartet</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dauer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aktionen</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoadingHistory ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Laden...</td>
                                    </tr>
                                ) : history.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Keine Historie gefunden</td>
                                    </tr>
                                ) : (
                                    history.map((log: any) => (
                                        <tr key={log._id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {log.syncType === 'entra_groups' ? 'Entra Groups' : log.syncType}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Zuletzt von: {log.triggeredBy}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(log.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatTime(log.startedAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {log.durationMs ? `${(log.durationMs / 1000).toFixed(1)}s` : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {/* Stats snippet */}
                                                {(log.stats?.updated > 0 || log.stats?.errors > 0) && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-green-600 font-medium">+{log.stats.updated}</span>
                                                        <span className="text-red-600 font-medium">!{log.stats.errors}</span>
                                                    </div>
                                                )}
                                                {(!log.stats?.updated && !log.stats?.errors) && '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
