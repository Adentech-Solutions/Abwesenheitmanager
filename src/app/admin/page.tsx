'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import { Users, Calendar, Clock, Shield, ChevronRight, Building2, Settings, RefreshCw } from 'lucide-react';
import StatsCard from '@/components/shared/StatsCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Metrics {
  totalUsers: number;
  activeUsers: number;
  pendingAbsences: number;
  totalAbsences: number;
  managerCount: number;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface QuickAction {
  href: string;
  label: string;
  description: string;
  iconBg: string;
  icon: React.ReactNode;
  badge?: string;
}

function QuickActionRow({ action }: { action: QuickAction }) {
  return (
    <Link
      href={action.href}
      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all group border border-transparent hover:border-gray-100"
    >
      <div className="flex items-center gap-4">
        <div className={cn("p-2.5 rounded-lg flex-shrink-0 transition-colors", action.iconBg)}>
          {action.icon}
        </div>
        <div>
          <p className="font-semibold text-gray-900 flex items-center gap-2 tracking-tight">
            {action.label}
            {action.badge && (
              <span className="text-[10px] px-1.5 py-0.5 bg-primary-50 text-primary-600 rounded-full font-bold uppercase tracking-wider">
                {action.badge}
              </span>
            )}
          </p>
          <p className="text-sm text-gray-500">{action.description}</p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-primary-500 transition-colors flex-shrink-0" />
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { data: metrics, isLoading, isError } = useQuery<Metrics>({
    queryKey: ['admin-metrics'],
    queryFn: async () => {
      const res = await fetch('/api/admin/metrics');
      if (!res.ok) throw new Error('Failed to fetch metrics');
      return res.json();
    },
    staleTime: 30_000,
  });

  const statCards = [
    {
      title: 'Benutzer gesamt',
      value: metrics?.totalUsers ?? 0,
      description: 'Registrierte Konten',
      bgColor: 'bg-blue-50',
      color: 'text-blue-600',
      icon: Users,
      href: '/admin/users',
      delay: 'delay-0',
    },
    {
      title: 'Aktive Benutzer',
      value: metrics?.activeUsers ?? 0,
      description: 'Aktive Konten',
      bgColor: 'bg-emerald-50',
      color: 'text-emerald-600',
      icon: Users,
      href: '/admin/users',
      delay: 'delay-75',
    },
    {
      title: 'Offene Anträge',
      value: metrics?.pendingAbsences ?? 0,
      description: 'Warten auf Genehmigung',
      bgColor: 'bg-amber-50',
      color: 'text-amber-600',
      icon: Clock,
      href: '/manager',
      delay: 'delay-150',
    },
    {
      title: 'Abwesenheiten',
      value: metrics?.totalAbsences ?? 0,
      description: 'Gesamt erfasst',
      bgColor: 'bg-violet-50',
      color: 'text-violet-600',
      icon: Calendar,
      href: '/admin/audit?entityType=absence',
      delay: 'delay-[225ms]',
    },
    {
      title: 'Manager',
      value: metrics?.managerCount ?? 0,
      description: 'Benutzer mit Manager-Rolle',
      bgColor: 'bg-rose-50',
      color: 'text-rose-600',
      icon: Shield,
      href: '/admin/users?role=manager',
      delay: 'delay-300',
    },
  ];

  const quickActions: QuickAction[] = [
    {
      href: '/admin/users',
      label: 'Benutzerverwaltung',
      description: 'Rollen und Berechtigungen verwalten',
      iconBg: 'bg-blue-50',
      icon: <Users className="h-5 w-5 text-blue-600" />,
    },
    {
      href: '/admin/holidays',
      label: 'Feiertage',
      description: 'Gesetzliche Feiertage pflegen',
      iconBg: 'bg-emerald-50',
      icon: <Calendar className="h-5 w-5 text-emerald-600" />,
    },
    {
      href: '/admin/audit',
      label: 'Audit Logs',
      description: 'Sicherheitsprotokolle einsehen',
      iconBg: 'bg-purple-50',
      icon: <Shield className="h-5 w-5 text-purple-600" />,
    },
    {
      href: '/settings',
      label: 'Einstellungen',
      description: 'Systemkonfiguration anpassen',
      iconBg: 'bg-gray-50',
      icon: <Settings className="h-5 w-5 text-gray-600" />,
    },
    {
      href: '/admin/departments',
      label: 'Abteilungen',
      description: 'Abteilungsstruktur verwalten',
      iconBg: 'bg-cyan-50',
      icon: <Building2 className="h-5 w-5 text-cyan-600" />,
    },
    {
      href: '/admin/sync',
      label: 'Sync Center',
      description: 'Entra ID Synchronisation',
      iconBg: 'bg-orange-50',
      icon: <RefreshCw className="h-5 w-5 text-orange-600" />,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-500">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Systemübersicht und Verwaltung</p>
        </div>

        {/* Error banner */}
        {isError && (
          <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700 animate-in shake duration-500">
            Metriken konnten nicht geladen werden. Bitte die Seite neu laden.
          </div>
        )}

        {/* Metrics Grid — 5 cards, responsive */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
            Systemmetriken
          </h2>
          {isLoading ? (
            <div className="py-12">
              <LoadingSpinner text="Systemmetriken werden geladen..." />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {statCards.map((card) => (
                <Link key={card.title} href={card.href} className="block group">
                  <StatsCard 
                    title={card.title}
                    value={card.value}
                    description={card.description}
                    icon={card.icon}
                    color={card.color}
                    bgColor={card.bgColor}
                    delay={card.delay}
                    className="h-full"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
            Schnellzugriff
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, idx) => (
              <div 
                key={action.href} 
                className={cn(
                  "animate-in fade-in slide-in-from-bottom-2 fill-mode-both",
                  `delay-[${idx * 50}ms]`
                )}
              >
                <QuickActionRow action={action} />
              </div>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}