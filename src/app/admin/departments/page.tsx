'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { Building, Plus, Edit2, Trash2, Cloud, RefreshCw, Users } from 'lucide-react';
import toast from 'react-hot-toast';

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
        enabled: false, // Only fetch when button clicked
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
            bundesland: 'BY', // Default to Bayern
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
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Abteilungen</h1>
                        <p className="text-gray-600">Verwalten Sie Abteilungen, Standorte und Entra ID Verknüpfungen</p>
                    </div>
                    <Button onClick={() => openCreateModal()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Neues Department
                    </Button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <div className="p-4">
                            <p className="text-sm font-medium text-gray-500">Gesamt</p>
                            <p className="mt-1 text-3xl font-semibold text-gray-900">
                                {isLoadingDepts ? '-' : stats.total}
                            </p>
                        </div>
                    </Card>
                    <Card>
                        <div className="p-4">
                            <p className="text-sm font-medium text-gray-500">Aktiv</p>
                            <p className="mt-1 text-3xl font-semibold text-green-600">
                                {isLoadingDepts ? '-' : stats.active}
                            </p>
                        </div>
                    </Card>
                    <Card>
                        <div className="p-4">
                            <p className="text-sm font-medium text-gray-500">Inaktiv</p>
                            <p className="mt-1 text-3xl font-semibold text-gray-900">
                                {isLoadingDepts ? '-' : stats.inactive}
                            </p>
                        </div>
                    </Card>
                    <Card>
                        <div className="p-4">
                            <p className="text-sm font-medium text-gray-500">Mit Entra Sync</p>
                            <p className="mt-1 text-3xl font-semibold text-blue-600">
                                {isLoadingDepts ? '-' : stats.entraSynced}
                            </p>
                        </div>
                    </Card>
                </div>

                {/* Main Table */}
                <Card>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Standort</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mitglieder</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sync</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aktionen</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoadingDepts ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Laden...</td>
                                    </tr>
                                ) : departments.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Keine Abteilungen gefunden</td>
                                    </tr>
                                ) : (
                                    departments.map((dept) => (
                                        <tr key={dept._id} className={!dept.isActive ? 'opacity-50' : ''}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                                        <Building className="h-4 w-4" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{dept.name}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {dept.managerName ? `Manager: ${dept.managerName}` : 'Kein Manager'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {getBundeslandName(dept.bundesland)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center gap-1.5">
                                                    <Users className="w-4 h-4" />
                                                    {dept.memberCount}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    dept.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {dept.isActive ? 'Aktiv' : 'Inaktiv'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {dept.entraGroupId ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700">
                                                        <Cloud className="w-3 h-3" /> Entra ID
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                                        Manuell
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openEditModal(dept)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    {dept.isActive && (
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            title="Deaktivieren"
                                                            onClick={() => handleDelete(dept._id)}
                                                            isLoading={deleteMutation.isPending}
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
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Entra Groups importieren</h2>
                        <Button variant="outline" onClick={() => refetchEntra()} isLoading={isLoadingEntra}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingEntra ? 'animate-spin' : ''}`} />
                            Gruppen aus Entra ID laden
                        </Button>
                    </div>

                    {entraGroups.length > 0 && (
                        <Card>
                            <ul className="divide-y divide-gray-200 p-2">
                                {entraGroups.map((group: any) => {
                                    const isMapped = departments.some(d => d.entraGroupId === group.id);
                                    return (
                                        <li key={group.id} className="p-4 flex items-center justify-between hover:bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Cloud className="w-5 h-5 text-blue-500" />
                                                <div>
                                                    <p className="font-medium text-gray-900">{group.displayName}</p>
                                                    {group.description && <p className="text-sm text-gray-500">{group.description}</p>}
                                                </div>
                                            </div>
                                            {isMapped ? (
                                                <span className="text-sm text-green-600 font-medium px-3 py-1 bg-green-50 rounded-full border border-green-200">
                                                    Bereits verknüpft
                                                </span>
                                            ) : (
                                                <Button 
                                                    size="sm" 
                                                    variant="secondary"
                                                    onClick={() => openCreateModal({ name: group.displayName, id: group.id })}
                                                >
                                                    Als Department importieren
                                                </Button>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </Card>
                    )}
                </div>

                {/* Create Modal */}
                <Modal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    title="Neues Department erstellen"
                >
                    <form onSubmit={handleCreate} className="space-y-4">
                        <Input
                            label="Name"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">Bundesland</label>
                            <select
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
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
                            onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                        />

                        {formData.entraGroupId && (
                            <div className="p-3 bg-blue-50 text-blue-800 text-sm rounded-md border border-blue-200 flex items-center gap-2">
                                <Cloud className="w-4 h-4" />
                                Wird mit Entra ID Group verknüpft ({formData.entraGroupId})
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-6">
                            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                                Abbrechen
                            </Button>
                            <Button type="submit" isLoading={createMutation.isPending}>
                                Erstellen
                            </Button>
                        </div>
                    </form>
                </Modal>

                {/* Edit Modal */}
                <Modal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    title="Department bearbeiten"
                >
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <Input
                            label="Name"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">Bundesland</label>
                            <select
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
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
                            onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                        />

                        <div className="pt-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive || false}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                                    Aktiv Status
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
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
