'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Trash2, Plus, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Holiday {
    _id: string;
    name: string;
    date: string;
    type: 'public' | 'company';
    states: string[];
}

export default function HolidaysPage() {
    const queryClient = useQueryClient();
    const [newHoliday, setNewHoliday] = useState({
        name: '',
        date: '',
        type: 'public',
    });

    const { data: holidays, isLoading } = useQuery({
        queryKey: ['holidays'],
        queryFn: async () => {
            const res = await fetch('/api/admin/holidays?year=' + new Date().getFullYear());
            if (!res.ok) throw new Error('Failed to fetch holidays');
            const data = await res.json();
            return data.holidays;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (holiday: any) => {
            const res = await fetch('/api/admin/holidays', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(holiday),
            });
            if (!res.ok) throw new Error('Failed to create holiday');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['holidays'] });
            setNewHoliday({ name: '', date: '', type: 'public' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/admin/holidays?id=${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete holiday');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['holidays'] });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(newHoliday);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Feiertage verwalten</h1>
                    <p className="text-gray-600">Verwalten Sie gesetzliche und betriebliche Feiertage</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Create Form */}
                    <Card className="md:col-span-1 h-fit">
                        <h2 className="text-lg font-semibold mb-4">Neuen Feiertag anlegen</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Name"
                                value={newHoliday.name}
                                onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                                required
                                placeholder="z.B. Betriebsausflug"
                            />
                            <Input
                                type="date"
                                label="Datum"
                                value={newHoliday.date}
                                onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                                required
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
                                <select
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    value={newHoliday.type}
                                    onChange={(e) => setNewHoliday({ ...newHoliday, type: e.target.value as any })}
                                >
                                    <option value="public">Gesetzlich</option>
                                    <option value="company">Betrieblich</option>
                                </select>
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                isLoading={createMutation.isPending}
                                disabled={!newHoliday.name || !newHoliday.date}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Anlegen
                            </Button>
                        </form>
                    </Card>

                    {/* List */}
                    <Card className="md:col-span-2">
                        <h2 className="text-lg font-semibold mb-4">Feiertage {new Date().getFullYear()}</h2>
                        <div className="overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Typ</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktion</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-4 text-center text-gray-500">Laden...</td>
                                        </tr>
                                    ) : holidays?.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-4 text-center text-gray-500">Keine Feiertage gefunden</td>
                                        </tr>
                                    ) : (
                                        holidays?.map((holiday: Holiday) => (
                                            <tr key={holiday._id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {format(new Date(holiday.date), 'dd.MM.yyyy', { locale: de })}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                    {holiday.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${holiday.type === 'public' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                                        {holiday.type === 'public' ? 'Gesetzlich' : 'Betrieblich'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => deleteMutation.mutate(holiday._id)}
                                                        className="text-red-600 hover:text-red-900 transition-colors"
                                                        disabled={deleteMutation.isPending}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
