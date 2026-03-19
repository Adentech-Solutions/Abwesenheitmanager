'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import StatsCard from '@/components/shared/StatsCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Building, Plus, Edit2, Trash2, Cloud, RefreshCw, Users, MapPin, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface DepartmentData {
    _id: string;
    name: string;
    bundesland: string;
    managerId?: string;
    managerName?: string;
    entraGroupId?: string;
    personioId?: number;
    syncSource: 'manual' | 'entra' | 'personio' | 'scim';
    memberCount: number;
    isActive: boolean;
}

const BUNDESLAND_OPTIONS = [
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
    { code: 'TH', name: 'Thüringen' }
];

export default function DepartmentsPage() {
    const queryClient = useQueryClient();
    
    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    // Data States
    const [selectedDept, setSelectedDept] = useState<DepartmentData | null>(null);
    const [formData, setFormData] = useState<Partial<DepartmentData>>({});

    // 1. Queries
    const { data: deptData, isLoading: isLoadingDepts } = useQuery({
        queryKey: ['admin-departments'],
        queryFn: async () => {
            const res = await fetch('/api/admin/departments');
            if (!res.ok) throw new Error('Failed to fetch departments');
            return res.json();
        },
    });

    const { data: entraData, isLoading: isLoadingEntra, refetch: refetchEntra } = useQuery({
        queryKey: ['admin-entra-groups'],
        queryFn: async () => {
            const res = await fetch('/api/admin/departments/entra-groups');
            if (!res.ok) throw new Error('Failed to fetch Entra groups');
            return res.json();
        },
        enabled: false,
    });

    const departments: DepartmentData[] = deptData?.departments || [];
    const entraGroups = entraData?.groups || [];

    // Stats calculations
    const stats = {
        total: departments.length,
        active: departments.filter(d => d.isActive).length,
        inactive: departments.filter(d => !d.isActive).length,
        entraSynced: departments.filter(d => d.syncSource === 'entra' || d.entraGroupId).length,
    };

    // 2. Mutations
    const createMutation = useMutation({
        mutationFn: async (newDept: Partial<DepartmentData>) => {
            const res = await fetch('/api/admin/departments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newDept),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create department');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-departments'] });
            toast.success('Abteilung erfolgreich erstellt');
            setIsCreateModalOpen(false);
            setFormData({});
        },
        onError: (error: any) => {
            toast.error(error.message);
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (dept: Partial<DepartmentData>) => {
            const res = await fetch(`/api/admin/departments/${dept._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dept),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to update department');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-departments'] });
            toast.success('Abteilung aktualisiert');
            setIsEditModalOpen(false);
            setSelectedDept(null);
            setFormData({});
        },
        onError: (error: any) => {
            toast.error(error.message);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/admin/departments/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to deactivate department');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-departments'] });
            toast.success('Abteilung deaktiviert');
        },
        onError: (error: any) => {
            toast.error(error.message);
        },
    });

    // 3. Handlers
    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate({ ...formData, _id: selectedDept?._id });
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Möchten Sie diese Abteilung wirklich deaktivieren?')) {
            deleteMutation.mutate(id);
        }
    };

    const openEditModal = (dept: DepartmentData) => {
        setSelectedDept(dept);
        setFormData({
            name: dept.name,
            bundesland: dept.bundesland,
            managerName: dept.managerName || '',
            isActive: dept.isActive,
            entraGroupId: dept.entraGroupId || '',
        });
        setIsEditModalOpen(true);
    };

    const openCreateModal = (groupInfo?: { name: string, id: string }) => {
        setFormData({
            name: groupInfo?.name || '',
            bundesland: 'BY',
            managerName: '',
            entraGroupId: groupInfo?.id || '',
        });
        setIsCreateModalOpen(true);
    };

    const getBundeslandName = (code: string) => {
        return BUNDESLAND_OPTIONS.find(b => b.code === code)?.name || code;
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Abteilungen</h1>
                        <p className="text-sm text-gray-500 mt-1">Verwalten Sie Abteilungen, Standorte und Entra ID Verknüpfungen</p>
                    </div>
                    <Button onClick={() => openCreateModal()} className="shadow-sm hover:shadow transition-all">
                        <Plus className="h-4 w-4 mr-2" />
                        Neues Department
                    </Button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatsCard 
                        title="Gesamt" 
                        value={isLoadingDepts ? '-' : stats.total} 
                        icon={Building} 
                        color="text-gray-500" 
                        bgColor="bg-gray-50"
                        delay="delay-0"
                    />
                    <StatsCard 
                        title="Aktiv" 
                        value={isLoadingDepts ? '-' : stats.active} 
                        icon={CheckCircle2} 
                        color="text-emerald-600" 
                        bgColor="bg-emerald-50"
                        delay="delay-75"
                    />
                    <StatsCard 
                        title="Inaktiv" 
                        value={isLoadingDepts ? '-' : stats.inactive} 
                        icon={XCircle} 
                        color="text-gray-400" 
                        bgColor="bg-gray-100"
                        delay="delay-150"
                    />
                    <StatsCard 
                        title="Mit Entra Sync" 
                        value={isLoadingDepts ? '-' : stats.entraSynced} 
                        icon={Cloud} 
                        color="text-primary-600" 
                        bgColor="bg-primary-50"
                        delay="delay-[225ms]"
                    />
                </div>

                {/* Main Table */}
                <Card className="hover:shadow-md transition-all">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead>
                                <tr className="bg-gray-50/50 rounded-lg">
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Standort</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Mitglieder</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Sync</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Aktionen</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                                {isLoadingDepts ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12">
                                            <LoadingSpinner text="Abteilungen werden geladen..." />
                                        </td>
                                    </tr>
                                ) : departments.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-2 text-gray-400">
                                                <Building className="h-8 w-8 opacity-20" />
                                                <p className="text-sm font-medium">Keine Abteilungen gefunden</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    departments.map((dept, idx) => (
                                        <tr 
                                            key={dept._id} 
                                            className={cn(
                                                "hover:bg-gray-50 transition-colors group animate-in fade-in slide-in-from-bottom-2 fill-mode-both",
                                                !dept.isActive && "opacity-50",
                                                `delay-[${Math.min(idx * 30, 300)}ms]`
                                            )}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-9 w-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 shadow-sm ring-1 ring-primary-100 transition-colors">
                                                        <Building className="h-5 w-5" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-bold text-gray-900 tracking-tight">{dept.name}</div>
                                                        <div className="text-[10px] uppercase font-bold text-gray-400 tracking-tighter mt-0.5">
                                                            {dept.managerName ? `Manager: ${dept.managerName}` : 'Kein Manager'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                                    {getBundeslandName(dept.bundesland)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge variant="outline" className="gap-1.5 bg-gray-50 border-gray-100 text-gray-600 font-bold px-2 py-0.5">
                                                    <Users className="w-3 h-3 text-gray-400" />
                                                    {dept.memberCount}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge variant={dept.isActive ? 'success' : 'default'} className="font-bold uppercase text-[10px] tracking-wider">
                                                    {dept.isActive ? 'Aktiv' : 'Inaktiv'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {dept.entraGroupId ? (
                                                    <Badge variant="info" className="gap-1 px-2 py-0.5 font-bold uppercase text-[10px] tracking-wider">
                                                        <Cloud className="w-3 h-3" /> Entra ID
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="gap-1 px-2 py-0.5 font-bold uppercase text-[10px] tracking-wider bg-gray-50 border-gray-200 text-gray-400">
                                                        Manuell
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex justify-end gap-2 overflow-hidden">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openEditModal(dept)}
                                                        className="h-8 w-8 p-0 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    {dept.isActive && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            title="Deaktivieren"
                                                            onClick={() => handleDelete(dept._id)}
                                                            disabled={deleteMutation.isPending}
                                                            className="h-8 w-8 p-0 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Entra Group Import Section */}
                <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
                                <Cloud className="h-5 w-5 text-primary-600" />
                                Entra Groups importieren
                            </h2>
                            <p className="text-sm text-gray-500 mt-0.5">Synchronisiere Abteilungsstrukturen aus Microsoft Entra ID</p>
                        </div>
                        <Button 
                            variant="outline" 
                            onClick={() => refetchEntra()} 
                            disabled={isLoadingEntra}
                            className="bg-white"
                        >
                            <RefreshCw className={cn("h-4 w-4 mr-2", isLoadingEntra && "animate-spin")} />
                            Gruppen laden
                        </Button>
                    </div>

                    {entraGroups.length > 0 && (
                        <Card className="p-0 overflow-hidden hover:shadow-md transition-all">
                            <ul className="divide-y divide-gray-100">
                                {entraGroups.map((group: any, idx: number) => {
                                    const isMapped = departments.some(d => d.entraGroupId === group.id);
                                    return (
                                        <li 
                                            key={group.id} 
                                            className={cn(
                                                "p-4 flex items-center justify-between hover:bg-gray-50 transition-colors gap-4 animate-in fade-in slide-in-from-right-4 fill-mode-both",
                                                `delay-[${idx * 30}ms]`
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm ring-1 ring-blue-100">
                                                    <Cloud className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 tracking-tight">{group.displayName}</p>
                                                    {group.description && <p className="text-xs text-gray-500 line-clamp-1">{group.description}</p>}
                                                </div>
                                            </div>
                                            {isMapped ? (
                                                <Badge variant="success" className="font-bold uppercase text-[10px] tracking-wider py-1 px-3">
                                                    Verknüpft
                                                </Badge>
                                            ) : (
                                                <Button 
                                                    size="sm" 
                                                    variant="secondary"
                                                    onClick={() => openCreateModal({ name: group.displayName, id: group.id })}
                                                    className="h-8 text-xs font-bold"
                                                >
                                                    Import
                                                </Button>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </Card>
                    )}
                </div>

                {/* Modals remain mostly same but could use styling updates if needed */}
                <Modal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    title="Neues Department erstellen"
                >
                    <form onSubmit={handleCreate} className="space-y-4">
                        <Input
                            label="Name"
                            placeholder="z.B. IT-Infrastruktur"
                            value={formData.name || ''}
                            onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        
                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700 tracking-tight">Bundesland</label>
                            <select
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                value={formData.bundesland}
                                onChange={(e) => setFormData({ ...formData, bundesland: e.target.value })}
                                required
                            >
                                {BUNDESLAND_OPTIONS.map(b => (
                                    <option key={b.code} value={b.code}>{b.name}</option>
                                ))}
                            </select>
                        </div>

                        <Input
                            label="Manager Name (Optional)"
                            placeholder="Name des Verantwortlichen"
                            value={formData.managerName || ''}
                            onChange={(e: any) => setFormData({ ...formData, managerName: e.target.value })}
                        />

                        {formData.entraGroupId && (
                            <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded-xl border border-blue-100 flex items-center gap-2 font-medium">
                                <Cloud className="w-4 h-4" />
                                Verknüpft mit Entra ID Group ({formData.entraGroupId})
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-8">
                            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                                Abbrechen
                            </Button>
                            <Button type="submit" isLoading={createMutation.isPending}>
                                Erstellen
                            </Button>
                        </div>
                    </form>
                </Modal>

                <Modal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    title="Department bearbeiten"
                >
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <Input
                            label="Name"
                            value={formData.name || ''}
                            onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        
                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700 tracking-tight">Bundesland</label>
                            <select
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
                                value={formData.bundesland}
                                onChange={(e) => setFormData({ ...formData, bundesland: e.target.value })}
                                required
                            >
                                {BUNDESLAND_OPTIONS.map(b => (
                                    <option key={b.code} value={b.code}>{b.name}</option>
                                ))}
                            </select>
                        </div>

                        <Input
                            label="Manager Name (Optional)"
                            value={formData.managerName || ''}
                            onChange={(e: any) => setFormData({ ...formData, managerName: e.target.value })}
                        />

                        <div className="pt-2">
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive || false}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                />
                                <label htmlFor="isActive" className="text-sm font-bold text-gray-700 cursor-pointer">
                                    Abteilung aktiv
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                                Abbrechen
                            </Button>
                            <Button type="submit" isLoading={updateMutation.isPending}>
                                Speichern
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </DashboardLayout>
    );
}
