'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { 
  User, 
  Mail, 
  Briefcase, 
  Building, 
  Calendar, 
  Users, 
  Shield, 
  MapPin, 
  Clock, 
  Star,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
                <div className="h-[60vh] flex items-center justify-center">
                    <LoadingSpinner text="Profil wird geladen..." />
                </div>
            </DashboardLayout>
        );
    }

    if (!profile) return null;

    const initials = `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}` || profile.name.slice(0, 2).toUpperCase();

    return (
        <DashboardLayout>
            <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-700">
                
                {/* Profile Header */}
                <div className="relative overflow-hidden bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50/50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-50/50 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
                    
                    <div className="relative flex flex-col md:flex-row items-center md:items-end gap-8">
                        <div className="relative">
                            <Avatar className="h-32 w-32 rounded-3xl border-4 border-white shadow-xl ring-1 ring-gray-100 scale-100 hover:scale-105 transition-transform duration-500">
                                <AvatarFallback className="text-4xl bg-gradient-to-br from-primary-500 to-primary-700 text-white font-black">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-xl border-4 border-white shadow-lg">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                        </div>
                        
                        <div className="flex-1 text-center md:text-left space-y-2">
                            <div className="flex flex-col md:flex-row md:items-center gap-3">
                                <h1 className="text-4xl font-black text-gray-900 tracking-tight">{profile.name}</h1>
                                <Badge className="w-fit mx-auto md:mx-0 bg-primary-50 text-primary-700 border-primary-100 font-bold uppercase tracking-widest text-[10px] px-3 py-1 rounded-lg shadow-sm">
                                    {profile.role === 'admin' ? 'Administrator' : 
                                     profile.role === 'manager' ? 'Vorgesetzter' : 'Mitarbeiter'}
                                </Badge>
                            </div>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                <div className="flex items-center gap-2 text-gray-400 group cursor-default">
                                    <Mail className="h-4 w-4 group-hover:text-primary-500 transition-colors" />
                                    <span className="text-sm font-bold group-hover:text-gray-900 transition-colors leading-none pt-0.5">{profile.email}</span>
                                </div>
                                <div className="h-1 w-1 bg-gray-200 rounded-full hidden md:block" />
                                <div className="flex items-center gap-2 text-gray-400 group cursor-default">
                                    <Building className="h-4 w-4 group-hover:text-primary-500 transition-colors" />
                                    <span className="text-sm font-bold group-hover:text-gray-900 transition-colors leading-none pt-0.5">{profile.department}</span>
                                </div>
                            </div>
                        </div>

                        <div className="hidden lg:flex items-center gap-4 pb-2">
                             <div className="text-right">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Dienstbeginn</p>
                                <p className="text-sm font-black text-gray-900">{profile.startDate ? new Date(profile.startDate).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Januar 2024'}</p>
                             </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Vacation Balance Grid */}
                    <Card className="lg:col-span-2 p-0 overflow-hidden border-none shadow-2xl group">
                        <div className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] p-8 text-white relative">
                            {/* Branded Wordmark Backdrop */}
                            <div className="absolute top-4 right-4 opacity-10 font-bold text-6xl select-none pointer-events-none tracking-tighter">
                                freyetag
                            </div>
                            
                            <div className="relative flex items-center justify-between mb-10">
                                <div>
                                    <h2 className="text-xl font-black tracking-tight flex items-center gap-2.5">
                                        <Calendar className="h-6 w-6 text-primary-400" />
                                        Urlaubsstatistik {new Date().getFullYear()}
                                    </h2>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Status Ihres Kontigents</p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                                    <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                                </div>
                            </div>

                            <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-12 pb-4">
                                <div className="space-y-2">
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Verfügbar</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
                                            {profile.vacationDays.remaining}
                                        </span>
                                        <span className="text-xl font-bold text-slate-500 uppercase">Tage</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Gesamt</p>
                                        <p className="text-2xl font-black text-white">{profile.vacationDays.total}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Genommen</p>
                                        <p className="text-2xl font-black text-white">{profile.vacationDays.used}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Restvorjahr</p>
                                        <p className="text-2xl font-black text-white">{profile.vacationDays.carryOver}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Aktiv</p>
                                        <p className="text-2xl font-black text-primary-400">0</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Progress bar visual */}
                            <div className="mt-8 pt-8 border-t border-white/5">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Urlaubsfortschritt</span>
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{Math.round((profile.vacationDays.used / profile.vacationDays.total) * 100)}%</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden shadow-inner ring-1 ring-white/5">
                                    <div 
                                        className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full transition-all duration-1000"
                                        style={{ width: `${(profile.vacationDays.used / profile.vacationDays.total) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Job Details Sidebar */}
                    <div className="space-y-6">
                        <Card className="p-6 hover:shadow-md transition-all border-gray-100 group">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <Briefcase className="h-3 w-3" />
                                Organisation
                            </h3>
                            
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-2.5 bg-gray-50 rounded-xl text-gray-400 group-hover:text-primary-600 group-hover:bg-primary-50 transition-all duration-300">
                                        <Briefcase className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Position</p>
                                        <p className="text-sm font-black text-gray-900 tracking-tight">{profile.jobTitle}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-start gap-4">
                                    <div className="p-2.5 bg-gray-50 rounded-xl text-gray-400 group-hover:text-primary-600 group-hover:bg-primary-50 transition-all duration-300">
                                        <Building className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Abteilung</p>
                                        <p className="text-sm font-black text-gray-900 tracking-tight">{profile.department}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-2.5 bg-gray-50 rounded-xl text-gray-400 group-hover:text-primary-600 group-hover:bg-primary-50 transition-all duration-300">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Manager</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-black text-gray-900 tracking-tight">{profile.manager.name}</p>
                                            <Badge variant="outline" className="text-[9px] font-black bg-gray-50 border-gray-100 text-gray-400 p-0.5 px-1 rounded">L1</Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6 hover:shadow-md transition-all border-gray-100 group bg-gray-50/50">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Account Sicherheit</h3>
                            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <Shield className="h-4 w-4 text-emerald-500" />
                                    <span className="text-xs font-bold text-gray-700">MFA Status</span>
                                </div>
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md">Gesichert</span>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
