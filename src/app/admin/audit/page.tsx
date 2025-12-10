'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Search, Filter, Download, ChevronLeft, ChevronRight } from 'lucide-react';

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
            // Remove empty filters
            if (!filters.action) params.delete('action');
            if (!filters.entityType) params.delete('entityType');

            const res = await fetch(`/api/admin/audit?${params}`);
            if (!res.ok) throw new Error('Failed to fetch logs');
            return res.json();
        },
    });

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPage(1); // Reset to first page on filter change
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Audit-Protokoll</h1>
                        <p className="text-gray-600">Überwachung aller Systemaktivitäten</p>
                    </div>
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Exportieren
                    </Button>
                </div>

                <Card>
                    {/* Filters */}
                    <div className="flex gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Aktion</label>
                            <select
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
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
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
                            <select
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
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

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Zeitstempel
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Benutzer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aktion
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Objekt
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Details
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                            Laden...
                                        </td>
                                    </tr>
                                ) : data?.logs?.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                            Keine Einträge gefunden
                                        </td>
                                    </tr>
                                ) : (
                                    data?.logs?.map((log: any) => (
                                        <tr key={log._id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {format(new Date(log.timestamp), 'dd.MM.yyyy HH:mm', { locale: de })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {log.userEmail}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${log.action === 'approved' ? 'bg-green-100 text-green-800' :
                                                        log.action === 'rejected' ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800'}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {log.entityType}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {log.changes?.map((change: any, i: number) => (
                                                    <div key={i} className="text-xs">
                                                        {change.field}: {String(change.oldValue)} → {String(change.newValue)}
                                                    </div>
                                                )) || '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {data?.pagination && (
                        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
                            <div className="flex flex-1 justify-between sm:hidden">
                                <Button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    variant="outline"
                                    size="sm"
                                >
                                    Zurück
                                </Button>
                                <Button
                                    onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
                                    disabled={page === data.pagination.pages}
                                    variant="outline"
                                    size="sm"
                                >
                                    Weiter
                                </Button>
                            </div>
                            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Seite <span className="font-medium">{page}</span> von{' '}
                                        <span className="font-medium">{data.pagination.pages}</span>
                                    </p>
                                </div>
                                <div>
                                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                        <button
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                        >
                                            <span className="sr-only">Zurück</span>
                                            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                        </button>
                                        <button
                                            onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
                                            disabled={page === data.pagination.pages}
                                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                        >
                                            <span className="sr-only">Weiter</span>
                                            <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
}
