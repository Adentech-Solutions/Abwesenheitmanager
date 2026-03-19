'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Search, User as UserIcon, Plus, Edit2, Shield, Briefcase, RefreshCw, Mail, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface UserData {
    _id: string;
    name: string;
    email: string;
    role: 'admin' | 'hr_manager' | 'manager' | 'teamlead' | 'employee';
    department?: string;
    vacationDays: {
        total: number;
        used: number;
        remaining: number;
        carryOver: number;
    } | number;
    isActive: boolean;
    entraId?: string;
    managerId?: string;
}

const ROLE_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; icon?: any }> = {
    admin: { label: 'Administrator', variant: 'danger', icon: Shield },
    hr_manager: { label: 'HR-Manager', variant: 'info', icon: Shield },
    manager: { label: 'Manager', variant: 'info' },
    teamlead: { label: 'Team Lead', variant: 'warning' },
    employee: { label: 'Mitarbeiter', variant: 'success' },
};

export default function UserManagementPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<UserData>>({});

    const { data, isLoading } = useQuery({
        queryKey: ['admin-users', search],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            params.append('limit', '100');
            const res = await fetch(`/api/admin/users?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch users');
            return res.json();
        },
    });

    const users: UserData[] = data?.users || [];

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

    const updateMutation = useMutation({
        mutationFn: async (userData: Partial<UserData>) => {
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

    const { data: entraData, isLoading: isLoadingEntra, refetch: refetchEntra } = useQuery({
        queryKey: ['admin-entra-users'],
        queryFn: async () => {
            const res = await fetch('/api/admin/users/entra-preview');
            if (!res.ok) throw new Error('Failed to fetch Entra users');
            return res.json();
        },
        enabled: false,
    });

    const entraUsers = entraData?.users || [];
    const newEntraUsers = entraUsers.filter((u: any) => !u.existsLocally);

    const importMutation = useMutation({
        mutationFn: async (usersToImport: any[]) => {
            const res = await fetch('/api/admin/users/entra-import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ users: usersToImport }),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to import users');
            }
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            refetchEntra();
            toast.success(`${data.imported} importiert, ${data.skipped} übersprungen, ${data.errors} Fehler`);
        },
        onError: (error: any) => {
            toast.error(`Import fehlgeschlagen: ${error.message}`);
        },
    });

    const handleImportSingle = (user: any) => {
        importMutation.mutate([user]);
    };

    const handleImportAll = () => {
        if (newEntraUsers.length > 0) {
            importMutation.mutate(newEntraUsers);
        }
    };

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
            vacationDays: 30,
            isActive: true
        });
        setIsCreateModalOpen(true);
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Benutzerverwaltung</h1>
                        <p className="text-sm text-gray-500 mt-1">Benutzerrollen, Abteilungen und Urlaubstage verwalten</p>
                    </div>
                    <Button onClick={openCreateModal} className="shadow-sm hover:shadow transition-all">
                        <Plus className="h-4 w-4 mr-2" />
                        Nutzer hinzufügen
                    </Button>
                </div>

                <Card className="hover:shadow-md transition-all">
                    <div className="mb-6">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 group-focus-within:text-primary-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Suchen nach Name oder E-Mail..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead>
                                <tr className="bg-gray-50/50 rounded-lg">
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Benutzer</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Rolle</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Abteilung</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Urlaub (G)</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Aktionen</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12">
                                            <LoadingSpinner text="Benutzer werden geladen..." />
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-2 text-gray-400">
                                                <UserIcon className="h-8 w-8 opacity-20" />
                                                <p className="text-sm font-medium">Keine Benutzer gefunden</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user, idx) => {
                                        const role = ROLE_CONFIG[user.role] || ROLE_CONFIG.employee;
                                        const RoleIcon = role.icon;
                                        return (
                                            <tr 
                                                key={user._id} 
                                                className={cn(
                                                    "hover:bg-gray-50/50 transition-colors group animate-in fade-in slide-in-from-bottom-2 fill-mode-both",
                                                    `delay-[${Math.min(idx * 30, 300)}ms]`
                                                )}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-gray-100">
                                                            <AvatarFallback className="bg-primary-50 text-primary-600 font-bold">
                                                                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-bold text-gray-900 tracking-tight">{user.name}</div>
                                                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                                                <Mail className="h-3 w-3" />
                                                                {user.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Badge variant={role.variant as any} className="gap-1.5 px-2.5 py-0.5 font-bold uppercase text-[10px] tracking-wider">
                                                        {RoleIcon && <RoleIcon className="h-3 w-3" />}
                                                        {role.label}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    <div className="flex items-center gap-2 font-medium">
                                                        {user.department ? (
                                                            <>
                                                                <div className="p-1 bg-gray-100 rounded-md">
                                                                    <Briefcase className="w-3 h-3 text-gray-500" />
                                                                </div>
                                                                {user.department}
                                                            </>
                                                        ) : (
                                                            <span className="text-gray-300 italic font-normal">Nicht zugewiesen</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-gray-900">
                                                            {typeof user.vacationDays === 'object' ? user.vacationDays.total : user.vacationDays}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Tage</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openEditModal(user)}
                                                        className="h-8 w-8 p-0 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Entra User Import Section */}
                <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
                                <RefreshCw className={cn("h-5 w-5 text-primary-600", isLoadingEntra && "animate-spin")} />
                                Entra ID Benutzer importieren
                            </h2>
                            <p className="text-sm text-gray-500 mt-0.5">Synchronisiere Benutzer direkt aus deinem Microsoft Tenant</p>
                        </div>
                        <Button 
                            variant="outline" 
                            onClick={() => refetchEntra()} 
                            disabled={isLoadingEntra}
                            className="bg-white"
                        >
                            <RefreshCw className={cn("h-4 w-4 mr-2", isLoadingEntra && "animate-spin")} />
                            Sync Center
                        </Button>
                    </div>

                    {entraUsers.length > 0 && (
                        <Card className="p-0 overflow-hidden hover:shadow-md transition-all">
                            {newEntraUsers.length > 0 && (
                                <div className="p-4 bg-primary-50/50 border-b border-primary-100 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1 bg-primary-100 rounded-full">
                                            <CheckCircle2 className="h-4 w-4 text-primary-600" />
                                        </div>
                                        <span className="text-sm text-primary-900 font-bold">{newEntraUsers.length} neue Benutzer zur Auswahl</span>
                                    </div>
                                    <Button 
                                        size="sm" 
                                        onClick={handleImportAll}
                                        disabled={importMutation.isPending}
                                        className="h-8 text-xs px-4"
                                    >
                                        Alle importieren
                                    </Button>
                                </div>
                            )}
                            <ul className="divide-y divide-gray-100">
                                {entraUsers.map((u: any, idx: number) => (
                                    <li 
                                        key={u.entraId} 
                                        className={cn(
                                            "p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition-colors gap-4 animate-in fade-in slide-in-from-right-4 fill-mode-both",
                                            `delay-[${idx * 30}ms]`
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-blue-50">
                                                <AvatarFallback className="bg-blue-50 text-blue-600 font-bold">
                                                    {u.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-bold text-gray-900 tracking-tight">{u.name}</p>
                                                <p className="text-xs text-gray-500">{u.email}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1 text-xs text-gray-500 sm:text-center grid grid-cols-2 sm:block">
                                            <div className="flex items-center sm:justify-center gap-1.5">
                                                <Briefcase className="h-3 w-3" />
                                                {u.department || <span className="italic opacity-30">Keine Abteilung</span>}
                                            </div>
                                            <div className="flex items-center sm:justify-center gap-1.5 mt-0.5">
                                                <UserIcon className="h-3 w-3" />
                                                {u.jobTitle || <span className="italic opacity-30">Kein Jobtitel</span>}
                                            </div>
                                        </div>

                                        <div className="shrink-0 flex items-center justify-end">
                                            {u.existsLocally ? (
                                                <Badge variant="success" className="font-bold uppercase text-[10px] tracking-wider py-1 px-3">
                                                    Aktiv
                                                </Badge>
                                            ) : (
                                                <Button 
                                                    size="sm" 
                                                    variant="secondary"
                                                    onClick={() => handleImportSingle(u)}
                                                    disabled={importMutation.isPending}
                                                    className="h-8 text-xs font-bold"
                                                >
                                                    Import
                                                </Button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}
                </div>

                {/* Modals remain mostly same but could use styling updates if needed */}
                <Modal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    title="Neuen Benutzer anlegen"
                >
                    <form onSubmit={handleCreate} className="space-y-4">
                        <Input
                            label="Name"
                            placeholder="Max Mustermann"
                            value={formData.name || ''}
                            onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <Input
                            type="email"
                            label="E-Mail"
                            placeholder="max@example.com"
                            value={formData.email || ''}
                            onChange={(e: any) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700 tracking-tight">Rolle</label>
                            <select
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                            >
                                <option value="employee">Mitarbeiter</option>
                                <option value="teamlead">Team Lead</option>
                                <option value="manager">Manager</option>
                                <option value="hr_manager">HR-Manager</option>
                                <option value="admin">Administrator</option>
                            </select>
                        </div>
                        <Input
                            label="Abteilung"
                            placeholder="z.B. IT, HR, Marketing"
                            value={formData.department || ''}
                            onChange={(e: any) => setFormData({ ...formData, department: e.target.value })}
                        />
                        <Input
                            type="number"
                            label="Urlaubstage (Anspruch)"
                            value={typeof formData.vacationDays === 'object' ? formData.vacationDays.total : formData.vacationDays || 30}
                            onChange={(e: any) => setFormData({ ...formData, vacationDays: parseInt(e.target.value) })}
                            required
                        />

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
                    title="Benutzer bearbeiten"
                >
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <Input
                            label="Name"
                            value={formData.name || ''}
                            onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700 tracking-tight">Rolle</label>
                            <select
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                            >
                                <option value="employee">Mitarbeiter</option>
                                <option value="teamlead">Team Lead</option>
                                <option value="manager">Manager</option>
                                <option value="hr_manager">HR-Manager</option>
                                <option value="admin">Administrator</option>
                            </select>
                            {selectedUser?.role === 'manager' && (
                                <p className="text-[10px] text-primary-500 mt-1 font-bold uppercase tracking-wider bg-primary-50 p-2 rounded-lg">
                                    Manager-Rolle wird auch aus Entra ID synchronisiert.
                                </p>
                            )}
                        </div>
                        <Input
                            label="Abteilung"
                            value={formData.department || ''}
                            onChange={(e: any) => setFormData({ ...formData, department: e.target.value })}
                        />
                        <Input
                            type="number"
                            label="Urlaubstage (Anspruch)"
                            value={typeof formData.vacationDays === 'object' ? formData.vacationDays.total : formData.vacationDays || 0}
                            onChange={(e: any) => setFormData({ ...formData, vacationDays: parseInt(e.target.value) })}
                            required
                        />
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 transition-all cursor-pointer"
                            />
                            <label htmlFor="isActive" className="text-sm font-bold text-gray-700 cursor-pointer">Benutzerkonto aktiv</label>
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
