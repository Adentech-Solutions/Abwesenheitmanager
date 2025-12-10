'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Mail, Briefcase, Building, Calendar, Users, Shield } from 'lucide-react';

interface UserProfile {
    name: string;
    email: string;
    firstName?: string;
    lastName?: string;
    department: string;
    jobTitle: string;
    manager: {
        name: string;
        email?: string;
    };
    vacationDays: {
        total: number;
        used: number;
        remaining: number;
        carryOver: number;
    };
    role: string;
    startDate?: string;
}

export default function ProfilePage() {
    const { data: profile, isLoading } = useQuery<UserProfile>({
        queryKey: ['profile'],
        queryFn: async () => {
            const res = await fetch('/api/profile');
            if (!res.ok) throw new Error('Failed to load profile');
            return res.json();
        }
    });

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="space-y-6 max-w-4xl mx-auto">
                    <Skeleton className="h-12 w-48" />
                    <div className="grid md:grid-cols-2 gap-6">
                        <Skeleton className="h-64" />
                        <Skeleton className="h-64" />
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!profile) return null;

    return (
        <DashboardLayout>
            <div className="space-y-8 max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-2xl font-bold">
                        {profile.firstName?.[0]}{profile.lastName?.[0]}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                        <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="h-4 w-4" />
                            <span>{profile.email}</span>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Key Stats / Vacation Balance */}
                    <Card className="bg-gradient-to-br from-primary-600 to-primary-800 text-white border-none">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Urlaubsanspruch {new Date().getFullYear()}
                        </h2>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <p className="text-primary-100 text-sm mb-1">Verfügbar</p>
                                <p className="text-4xl font-bold">{profile.vacationDays.remaining}</p>
                            </div>
                            <div>
                                <p className="text-primary-100 text-sm mb-1">Gesamtanspruch</p>
                                <p className="text-2xl font-semibold">{profile.vacationDays.total}</p>
                            </div>
                            <div>
                                <p className="text-primary-100 text-sm mb-1">Bereits Genommen</p>
                                <p className="text-2xl font-semibold">{profile.vacationDays.used}</p>
                            </div>
                            <div>
                                <p className="text-primary-100 text-sm mb-1">Übertrag</p>
                                <p className="text-2xl font-semibold">{profile.vacationDays.carryOver}</p>
                            </div>
                        </div>
                    </Card>

                    {/* Job Details */}
                    <Card>
                        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-gray-500" />
                            Position & Team
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-600 flex items-center gap-2">
                                    <Briefcase className="h-4 w-4" /> Position
                                </span>
                                <span className="font-medium text-gray-900">{profile.jobTitle}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-600 flex items-center gap-2">
                                    <Building className="h-4 w-4" /> Abteilung
                                </span>
                                <span className="font-medium text-gray-900">{profile.department}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-600 flex items-center gap-2">
                                    <Users className="h-4 w-4" /> Vorgesetzter
                                </span>
                                <span className="font-medium text-gray-900">{profile.manager.name}</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-gray-600 flex items-center gap-2">
                                    <Shield className="h-4 w-4" /> Rolle
                                </span>
                                <span className="capitalize px-2 py-1 bg-gray-100 rounded text-sm font-medium text-gray-700">
                                    {profile.role}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
