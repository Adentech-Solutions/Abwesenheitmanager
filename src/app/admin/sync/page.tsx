'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { 
    RefreshCw, Cloud, Users, FileText, CheckCircle2, 
    XCircle, Clock, Database, AlertCircle, Sparkles, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

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
        return new Date(dateString).toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': 
                return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold px-2 py-0.5 rounded-lg border shadow-sm uppercase text-[9px] tracking-widest"><CheckCircle2 className="w-3 h-3 mr-1" /> OK</Badge>;
            case 'error': 
                return <Badge className="bg-rose-50 text-rose-700 border-rose-100 font-bold px-2 py-0.5 rounded-lg border shadow-sm uppercase text-[9px] tracking-widest"><XCircle className="w-3 h-3 mr-1" /> Error</Badge>;
            case 'running': 
                return <Badge className="bg-amber-50 text-amber-700 border-amber-100 font-bold px-2 py-0.5 rounded-lg border shadow-sm uppercase text-[9px] tracking-widest animate-pulse"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Aktiv</Badge>;
            default: 
                return <Badge className="bg-gray-50 text-gray-500 border-gray-100 font-bold px-2 py-0.5 rounded-lg border shadow-sm uppercase text-[9px] tracking-widest">{status}</Badge>;
        }
    };

    if (isLoadingStatus && !statusData) {
        return (
            <DashboardLayout>
                <div className="h-[60vh] flex items-center justify-center">
                    <LoadingSpinner text="Synchronisations-Status wird geladen..." />
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
                            <Database className="h-7 w-7 text-primary-600" />
                            Sync Center
                        </h1>
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                            Steuerung und Überwachung externer Datenquellen-Anbindungen
                        </p>
                    </div>
                </div>

                {/* Integration Status Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Entra Groups */}
                    <Card className="p-6 hover:shadow-md hover:-translate-y-0.5 transition-all border-gray-100 animate-in slide-in-from-bottom-4 duration-500 delay-0">
                        <div className="flex items-start justify-between mb-6">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shadow-sm">
                                <Cloud className="w-6 h-6" />
                            </div>
                            {lastSyncs.entra_groups ? getStatusBadge(lastSyncs.entra_groups.status) : <Badge variant="outline" className="text-gray-300 font-bold text-[9px] border-gray-100 uppercase tracking-widest">Inaktiv</Badge>}
                        </div>
                        <h3 className="text-lg font-black text-gray-900 tracking-tight mb-2">Microsoft Entra</h3>
                        <p className="text-xs font-medium text-gray-400 leading-relaxed mb-6">
                            Abgleich von Abteilungen und Team-Mitgliedschaften aus Azure Entra ID.
                        </p>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Zuletzt</span>
                                <span className="text-xs font-bold text-gray-700">{formatTime(lastSyncs.entra_groups?.completedAt)}</span>
                            </div>
                            <Button 
                                size="sm" 
                                className="h-9 rounded-xl font-bold px-4 shadow-sm"
                                onClick={() => syncMutation.mutate('entra_groups')}
                                disabled={syncMutation.isPending && syncMutation.variables === 'entra_groups'}
                            >
                                {syncMutation.isPending && syncMutation.variables === 'entra_groups' ? (
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    'Jetzt Abgleichen'
                                )}
                            </Button>
                        </div>
                    </Card>

                    {/* Entra Users */}
                    <Card className="p-6 opacity-60 bg-gray-50/50 border-dashed border-gray-100 transition-all animate-in slide-in-from-bottom-4 duration-500 delay-75">
                         <div className="flex items-start justify-between mb-6">
                            <div className="p-3 bg-indigo-50 text-indigo-400 rounded-2xl border border-indigo-100/50">
                                <Users className="w-6 h-6" />
                            </div>
                            <Badge className="bg-gray-100 text-gray-400 font-bold border-gray-200 text-[9px] tracking-widest uppercase">Coming Soon</Badge>
                        </div>
                        <h3 className="text-lg font-black text-gray-300 tracking-tight mb-2 uppercase">Entra Profiles</h3>
                        <p className="text-xs font-medium text-gray-400 leading-relaxed">
                            Vollständiger Sync von Job-Titeln, Profilbildern und Manager-Hierarchien.
                        </p>
                    </Card>

                    {/* Personio */}
                    <Card className={cn(
                        "p-6 hover:shadow-md hover:-translate-y-0.5 transition-all border-gray-100 animate-in slide-in-from-bottom-4 duration-500 delay-150",
                        !isPersonioConfigured && "grayscale opacity-80"
                    )}>
                        <div className="flex items-start justify-between mb-6">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shadow-sm">
                                <FileText className="w-6 h-6" />
                            </div>
                            {!isPersonioConfigured ? (
                                <a href="/admin/integrations" className="text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-primary-600 transition-colors">
                                    Setup nötig <ChevronRight className="inline h-3 w-3" />
                                </a>
                            ) : lastSyncs.personio_employees ? getStatusBadge(lastSyncs.personio_employees.status) : <Badge variant="outline" className="text-gray-300 font-bold text-[9px] border-gray-100 uppercase tracking-widest">Warten</Badge>}
                        </div>
                        <h3 className="text-lg font-black text-gray-900 tracking-tight mb-2">Personio API</h3>
                        <p className="text-xs font-medium text-gray-400 leading-relaxed mb-6">
                            Abgleich von Urlaubskontingenten und Rückmeldung genehmigter Anträge.
                        </p>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Zuletzt</span>
                                <span className="text-xs font-bold text-gray-700">{formatTime(lastSyncs.personio_employees?.completedAt)}</span>
                            </div>
                            <Button 
                                size="sm" 
                                className="h-9 rounded-xl font-bold px-4 shadow-sm bg-primary-600 hover:bg-primary-700"
                                onClick={() => personioSyncMutation.mutate()}
                                disabled={!isPersonioConfigured || personioSyncMutation.isPending}
                            >
                                {personioSyncMutation.isPending ? (
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    'Starten'
                                )}
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* History Table */}
                <Card className="overflow-hidden border-gray-100 shadow-sm animate-in slide-in-from-bottom-4 duration-500 delay-300">
                    <div className="px-6 py-5 border-b border-gray-50/50 flex items-center justify-between bg-white">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                             <Clock className="h-3.5 w-3.5" /> Synchronisations-Historie
                        </h3>
                         <div className="p-2 bg-primary-50 rounded-xl">
                            <Sparkles className="h-4 w-4 text-primary-500" />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-50">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Datenquelle</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Gestartet</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Dauer</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Ergebnis</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                                {history.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm font-bold">Keine Verlaufshistorie vorhanden</td>
                                    </tr>
                                ) : (
                                    history.map((log: any) => (
                                        <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-7 w-7 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                                                         {log.syncType === 'entra_groups' ? <Cloud className="h-3.5 w-3.5 text-blue-500" /> : <FileText className="h-3.5 w-3.5 text-emerald-500" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 tracking-tight">
                                                            {log.syncType === 'entra_groups' ? 'Azure Entra ID' : 'Personio HR API'}
                                                        </p>
                                                        <p className="text-[10px] font-black text-gray-400 tracking-tighter uppercase">{log.triggeredBy}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(log.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-500">
                                                {formatTime(log.startedAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-xs font-black text-gray-400 tabular-nums">
                                                {log.durationMs ? `${(log.durationMs / 1000).toFixed(1)}s` : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {(log.stats?.updated > 0 || log.stats?.errors > 0) ? (
                                                    <div className="flex items-center gap-2">
                                                        {log.stats.updated > 0 && <Badge variant="outline" className="text-[9px] font-black bg-emerald-50/50 text-emerald-600 border-emerald-100/50">+{log.stats.updated} Updated</Badge>}
                                                        {log.stats.errors > 0 && <Badge variant="outline" className="text-[9px] font-black bg-rose-50/50 text-rose-600 border-rose-100/50">!{log.stats.errors} Errors</Badge>}
                                                    </div>
                                                ) : <span className="text-gray-300 font-bold text-[10px]">No Changes</span>}
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
