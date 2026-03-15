'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { Search, User as UserIcon, Plus, Edit2, Shield, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import { IUser } from '@/types/user'; // Ensure this type exists or substitute with any
// If types/user doesn't exist, I'll define a local interface.
// Listing files earlier showed src/models/User.ts, usually types are in src/types. 
// Just in case, I will define a local interface to be safe.

interface UserData {
    _id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'employee';
    department?: string;
    vacationDays: {
        total: number;
        used: number;
        remaining: number;
        carryOver: number;
    } | number; // Handle both cases for backward compatibility, though model enforces object
    isActive: boolean;
    entraId?: string;
    managerId?: string;
}

export default function UserManagementPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form States
    const [formData, setFormData] = useState<Partial<UserData>>({});

    // Fetch Users
    const { data, isLoading } = useQuery({
        queryKey: ['admin-users', search],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            params.append('limit', '100'); // Simple pagination for now

            const res = await fetch(`/api/admin/users?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch users');
            return res.json();
        },
    });

    const users: UserData[] = data?.users || [];

    // Create User Mutation
    const createMutation = useMutation({
        mutationFn: async (newUser: Partial<UserData>) => {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create user');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast.success('Benutzer erfolgreich erstellt');
            setIsCreateModalOpen(false);
            setFormData({});
        },
        onError: (error: any) => {
            toast.error(error.message);
        },
    });

    // Update User Mutation
    const updateMutation = useMutation({
        mutationFn: async (userData: Partial<UserData>) => {
            // For update, we use the specific user endpoint
            // We need to use the entraId if available, or fall back to _id if the API supports it
            // My API implementation supports both.
            const id = userData.entraId || userData._id;
            if (!id) throw new Error("User ID missing");

            const res = await fetch(`/api/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to update user');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast.success('Benutzer aktualisiert');
            setIsEditModalOpen(false);
            setSelectedUser(null);
            setFormData({});
        },
        onError: (error: any) => {
            toast.error(error.message);
        },
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate({ ...formData, _id: selectedUser?._id, entraId: selectedUser?.entraId });
    };

    const openEditModal = (user: UserData) => {
        setSelectedUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            vacationDays: typeof user.vacationDays === 'object' ? user.vacationDays.total : user.vacationDays,
            isActive: user.isActive
        });
        setIsEditModalOpen(true);
    };

    const openCreateModal = () => {
        setFormData({
            role: 'employee',
            vacationDays: 30, // Default number, will need handling if API expects full object or just total
            isActive: true
        });
        setIsCreateModalOpen(true);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Benutzerverwaltung</h1>
                        <p className="text-gray-600">Benutzerrollen, Abteilungen und Urlaubstage verwalten</p>
                    </div>
                    <Button onClick={openCreateModal}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nutzer hinzufügen
                    </Button>
                </div>

                <Card>
                    <div className="mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Suchen nach Name oder E-Mail..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rolle</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abteilung</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urlaub</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Laden...</td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Keine Benutzer gefunden</td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 shadow-sm">
                                                        <UserIcon className="h-5 w-5" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                        <div className="text-sm text-gray-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${user.role === 'admin'
                                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                    : user.role === 'manager'
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                        : 'bg-green-50 text-green-700 border-green-200'
                                                    }`}>
                                                    {user.role === 'admin' && <Shield className="w-3 h-3 mr-1 self-center" />}
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    {user.department && <Briefcase className="w-3 h-3" />}
                                                    {user.department || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className="font-medium text-gray-900">
                                                    {typeof user.vacationDays === 'object' ? user.vacationDays.total : user.vacationDays}
                                                </span> Tage
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => openEditModal(user)}
                                                    className="text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    )))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Create Modal */}
                <Modal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    title="Neuen Benutzer anlegen"
                >
                    <form onSubmit={handleCreate} className="space-y-4">
                        <Input
                            label="Name"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <Input
                            type="email"
                            label="E-Mail"
                            value={formData.email || ''}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">Rolle</label>
                            <select
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                            >
                                <option value="employee">Mitarbeiter</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Administrator</option>
                            </select>
                        </div>
                        <Input
                            label="Abteilung"
                            value={formData.department || ''}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        />
                        <Input
                            type="number"
                            label="Urlaubstage"
                            value={typeof formData.vacationDays === 'object' ? formData.vacationDays.total : formData.vacationDays || 30}
                            onChange={(e) => setFormData({ ...formData, vacationDays: parseInt(e.target.value) })}
                            required
                        />

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
                    title="Benutzer bearbeiten"
                >
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <Input
                            label="Name"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">Rolle</label>
                            <select
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                            >
                                <option value="employee">Mitarbeiter</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Administrator</option>
                            </select>
                        </div>
                        <Input
                            label="Abteilung"
                            value={formData.department || ''}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        />
                        <Input
                            type="number"
                            label="Urlaubstage"
                            value={typeof formData.vacationDays === 'object' ? formData.vacationDays.total : formData.vacationDays || 0}
                            onChange={(e) => setFormData({ ...formData, vacationDays: parseInt(e.target.value) })}
                            required
                        />
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                            />
                            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Aktiv</label>
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
