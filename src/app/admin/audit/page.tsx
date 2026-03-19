'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
    Search, Filter, Download, ChevronLeft, ChevronRight, 
    History, User, Activity, Database, AlertCircle,
    CheckCircle2, XCircle, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AuditLogPage() {
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({
        action: '',
        entityType: '',
    });

    const { data, isLoading } = useQuery({
        queryKey: ['audit-logs', page, filters],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...filters,
            });
            if (!filters.action) params.delete('action');
            if (!filters.entityType) params.delete('entityType');

            const res = await fetch(`/api/admin/audit?${params}`);
            if (!res.ok) throw new Error('Failed to fetch logs');
            return res.json();
        },
    });

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPage(1);
    };

    if (isLoading && page === 1) {
        return (
            <DashboardLayout>
                <div className="h-[60vh] flex items-center justify-center">
                    <LoadingSpinner text="Audit-Logs werden geladen..." />
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
                            <History className="h-7 w-7 text-primary-600" />
                            Audit-Protokoll
                        </h1>
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                            Vollständige Historie aller Systemaktivitäten und Datenänderungen
                        </p>
                    </div>
                    <Button variant="outline" className="rounded-xl border-gray-100 shadow-sm hover:bg-gray-50 transition-all font-bold">
                        <Download className="h-4 w-4 mr-2" />
                        Exportieren
                    </Button>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1.5 animate-in slide-in-from-left-4 duration-500 delay-0">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Aktion</label>
                        <select
                            className="w-full h-11 rounded-xl border border-gray-100 bg-white px-3 py-2 text-sm font-bold text-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-all cursor-pointer"
                            value={filters.action}
                            onChange={(e) => handleFilterChange('action', e.target.value)}
                        >
                            <option value="">Alle Aktionen</option>
                            <option value="created">Erstellt</option>
                            <option value="updated">Aktualisiert</option>
                            <option value="deleted">Gelöscht</option>
                            <option value="approved">Genehmigt</option>
                            <option value="rejected">Abgelehnt</option>
                            <option value="login">Login</option>
                        </select>
                    </div>
                    <div className="space-y-1.5 animate-in slide-in-from-left-4 duration-500 delay-75">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Objekt-Typ</label>
                        <select
                            className="w-full h-11 rounded-xl border border-gray-100 bg-white px-3 py-2 text-sm font-bold text-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-all cursor-pointer"
                            value={filters.entityType}
                            onChange={(e) => handleFilterChange('entityType', e.target.value)}
                        >
                            <option value="">Alle Typen</option>
                            <option value="absence">Abwesenheit</option>
                            <option value="user">Benutzer</option>
                            <option value="settings">Einstellungen</option>
                        </select>
                    </div>
                </div>

                {/* Main Content */}
                <Card className="overflow-hidden border-gray-100 shadow-sm animate-in slide-in-from-bottom-4 duration-500 delay-150">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-50">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Zeitstempel</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Benutzer</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Aktion</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Objekt</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Details</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                                {data?.logs?.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="p-4 bg-gray-50 rounded-full">
                                                    <AlertCircle className="h-8 w-8 text-gray-300" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 tracking-tight">Keine Einträge gefunden</p>
                                                    <p className="text-xs text-gray-400">Versuchen Sie andere Filtereinstellungen</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    data?.logs?.map((log: any, idx: number) => (
                                        <tr key={log._id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2.5">
                                                    <Clock className="h-3.5 w-3.5 text-gray-300" />
                                                    <span className="text-sm font-bold text-gray-700 tracking-tight">
                                                        {format(new Date(log.timestamp), 'dd.MM.yyyy HH:mm', { locale: de })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-lg bg-primary-50 flex items-center justify-center text-[10px] font-black text-primary-700 border border-primary-100 uppercase tracking-tighter">
                                                        {log.userEmail?.[0] || 'U'}
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-900 tracking-tight">{log.userEmail}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge 
                                                    className={cn(
                                                        "text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-lg border shadow-sm",
                                                        log.action === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                        log.action === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                        log.action === 'created' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                        log.action === 'deleted' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                        'bg-gray-50 text-gray-600 border-gray-100'
                                                    )}
                                                >
                                                    {log.action}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Database className="h-3.5 w-3.5 text-gray-300" />
                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{log.entityType}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="max-w-xs space-y-1.5">
                                                    {log.changes?.map((change: any, i: number) => (
                                                        <div key={i} className="flex items-center gap-2 text-xs">
                                                            <span className="font-bold text-gray-400 bg-gray-50 px-1.5 rounded">{change.field}</span>
                                                            <span className="text-gray-900 font-bold truncate">{String(change.newValue)}</span>
                                                        </div>
                                                    )) || <span className="text-gray-300 text-xs">-</span>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {data?.pagination && (
                        <div className="flex items-center justify-between border-t border-gray-50 bg-gray-50/30 px-6 py-4">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <Button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl font-bold"
                                >
                                    Zurück
                                </Button>
                                <Button
                                    onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
                                    disabled={page === data.pagination.pages}
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl font-bold"
                                >
                                    Weiter
                                </Button>
                            </div>
                            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    Seite <span className="text-gray-900">{page}</span> von{' '}
                                    <span className="text-gray-900">{data.pagination.pages}</span>
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        variant="outline"
                                        size="icon"
                                        className="h-9 w-9 rounded-xl border-gray-100 shadow-sm hover:bg-white transition-all disabled:opacity-30"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
                                        disabled={page === data.pagination.pages}
                                        variant="outline"
                                        size="icon"
                                        className="h-9 w-9 rounded-xl border-gray-100 shadow-sm hover:bg-white transition-all disabled:opacity-30"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
}
