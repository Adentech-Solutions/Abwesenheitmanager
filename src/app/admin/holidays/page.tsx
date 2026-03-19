'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Trash2, Plus, Calendar as CalendarIcon, AlertCircle, CheckCircle2, Star } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

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
        type: 'public' as const,
    });

    const { data: holidays, isLoading } = useQuery({
        queryKey: ['holidays'],
        queryFn: async () => {
            const res = await fetch('/api/admin/holidays?year=' + new Date().getFullYear());
            if (!res.ok) throw new Error('Failed to fetch holidays');
            const data = await res.json();
            return data.holidays as Holiday[];
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
            toast.success('Feiertag erfolgreich angelegt');
        },
        onError: () => toast.error('Fehler beim Anlegen des Feiertags'),
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
            toast.success('Feiertag gelöscht');
        },
        onError: () => toast.error('Fehler beim Löschen'),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(newHoliday);
    };

    if (isLoading && !holidays) {
        return (
            <DashboardLayout>
                <div className="h-[60vh] flex items-center justify-center">
                    <LoadingSpinner text="Feiertage werden geladen..." />
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
                            <CalendarIcon className="h-7 w-7 text-primary-600" />
                            Feiertage verwalten
                        </h1>
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                            Definition von gesetzlichen und betriebsinternen freien Tagen für {new Date().getFullYear()}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Create Form */}
                    <Card className="lg:col-span-1 h-fit p-6 border-gray-100 shadow-sm animate-in slide-in-from-left-4 duration-500 delay-0">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-primary-50 text-primary-600 rounded-xl border border-primary-100">
                                <Plus className="w-5 h-5" />
                            </div>
                            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Neuer Eintrag</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Bezeichnung</label>
                                <Input
                                    value={newHoliday.name}
                                    onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                                    required
                                    placeholder="z.B. Team-Event"
                                    className="h-11 rounded-xl border-gray-100 bg-white font-bold text-gray-700 shadow-sm transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Datum</label>
                                <Input
                                    type="date"
                                    value={newHoliday.date}
                                    onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                                    required
                                    className="h-11 rounded-xl border-gray-100 bg-white font-bold text-gray-700 shadow-sm transition-all cursor-pointer"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Kategorie</label>
                                <select
                                    className="w-full h-11 rounded-xl border border-gray-100 bg-white px-3 py-2 text-sm font-bold text-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-all cursor-pointer"
                                    value={newHoliday.type}
                                    onChange={(e) => setNewHoliday({ ...newHoliday, type: e.target.value as any })}
                                >
                                    <option value="public">Gesetzlicher Feiertag</option>
                                    <option value="company">Betriebliche Schließung</option>
                                </select>
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-11 rounded-xl font-bold shadow-md shadow-primary-100 bg-primary-600 hover:bg-primary-700 mt-2"
                                isLoading={createMutation.isPending}
                                disabled={!newHoliday.name || !newHoliday.date}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Feiertag hinzufügen
                            </Button>
                        </form>
                    </Card>

                    {/* List */}
                    <Card className="lg:col-span-2 overflow-hidden border-gray-100 shadow-sm animate-in slide-in-from-right-4 duration-500 delay-150">
                        <div className="px-6 py-5 border-b border-gray-50/50 flex items-center justify-between bg-white">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                Aktuelle Feiertage {new Date().getFullYear()}
                            </h3>
                            <div className="p-2 bg-amber-50 rounded-xl">
                                <Star className="h-4 w-4 text-amber-500" />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-50">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Datum</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Feiertag</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Kategorie</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Optionen</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-50">
                                    {holidays?.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <AlertCircle className="h-8 w-8 text-gray-200" />
                                                    <p className="text-sm font-bold text-gray-400 tracking-tight uppercase">Keine Einträge für dieses Jahr</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        holidays?.map((holiday: Holiday) => (
                                            <tr key={holiday._id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2.5">
                                                        <CalendarIcon className="h-3.5 w-3.5 text-gray-300" />
                                                        <span className="text-sm font-bold text-gray-700 tracking-tight tabular-nums">
                                                            {format(new Date(holiday.date), 'dd.MM.yyyy', { locale: de })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-black text-gray-900 tracking-tight">{holiday.name}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Badge className={cn(
                                                        "font-bold px-2.5 py-0.5 rounded-lg border shadow-sm uppercase text-[9px] tracking-widest",
                                                        holiday.type === 'public' 
                                                            ? 'bg-blue-50 text-blue-700 border-blue-100' 
                                                            : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                                    )}>
                                                        {holiday.type === 'public' ? 'Gesetzlich' : 'Betrieblich'}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <Button
                                                        onClick={() => {
                                                            if (window.confirm('Diesen Feiertag wirklich löschen?')) {
                                                                deleteMutation.mutate(holiday._id);
                                                            }
                                                        }}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 rounded-lg text-rose-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                                                        disabled={deleteMutation.isPending}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
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
