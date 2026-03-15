'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import { Users, Calendar, Clock, Shield, ChevronRight, Building2, Settings, RefreshCw } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Metrics {
  totalUsers: number;
  activeUsers: number;
  pendingAbsences: number;
  totalAbsences: number;
  managerCount: number;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SkeletonStatCard() {
  return (
    <Card className="h-full">
      <div className="flex items-start justify-between animate-pulse">
        <div className="space-y-2">
          <div className="h-3 w-24 bg-gray-200 rounded" />
          <div className="h-7 w-12 bg-gray-200 rounded mt-2" />
          <div className="h-3 w-32 bg-gray-200 rounded mt-1" />
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-lg" />
      </div>
    </Card>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  label: string;
  iconBg: string;
  icon: React.ReactNode;
  href: string;
}

function StatCard({ title, value, label, iconBg, icon, href }: StatCardProps) {
  return (
    <Link href={href} className="block h-full">
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2 tabular-nums">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
          <div className={`p-3 rounded-xl ${iconBg} text-white flex-shrink-0`}>
            {icon}
          </div>
        </div>
      </Card>
    </Link>
  );
}

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
      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${action.iconBg} flex-shrink-0`}>
          {action.icon}
        </div>
        <div>
          <p className="font-medium text-gray-900 flex items-center gap-2">
            {action.label}
            {action.badge && (
              <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-500 rounded font-normal">
                {action.badge}
              </span>
            )}
          </p>
          <p className="text-sm text-gray-500">{action.description}</p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
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
      value: metrics?.totalUsers ?? '—',
      label: 'Registrierte Konten',
      iconBg: 'bg-blue-500',
      icon: <Users className="h-6 w-6" />,
      href: '/admin/users',
    },
    {
      title: 'Aktive Benutzer',
      value: metrics?.activeUsers ?? '—',
      label: 'Aktive Konten',
      iconBg: 'bg-emerald-500',
      icon: <Users className="h-6 w-6" />,
      href: '/admin/users',
    },
    {
      title: 'Offene Anträge',
      value: metrics?.pendingAbsences ?? '—',
      label: 'Warten auf Genehmigung',
      iconBg: 'bg-amber-500',
      icon: <Clock className="h-6 w-6" />,
      href: '/manager',
    },
    {
      title: 'Abwesenheiten',
      value: metrics?.totalAbsences ?? '—',
      label: 'Gesamt erfasst',
      iconBg: 'bg-violet-500',
      icon: <Calendar className="h-6 w-6" />,
      href: '/admin/audit?entityType=absence',
    },
    {
      title: 'Manager',
      value: metrics?.managerCount ?? '—',
      label: 'Benutzer mit Manager-Rolle',
      iconBg: 'bg-rose-500',
      icon: <Shield className="h-6 w-6" />,
      href: '/admin/users?role=manager',
    },
  ];

  const quickActions: QuickAction[] = [
    {
      href: '/admin/users',
      label: 'Benutzerverwaltung',
      description: 'Rollen und Berechtigungen verwalten',
      iconBg: 'bg-blue-100',
      icon: <Users className="h-5 w-5 text-blue-600" />,
    },
    {
      href: '/admin/holidays',
      label: 'Feiertage',
      description: 'Gesetzliche Feiertage pflegen',
      iconBg: 'bg-emerald-100',
      icon: <Calendar className="h-5 w-5 text-emerald-600" />,
    },
    {
      href: '/admin/audit',
      label: 'Audit Logs',
      description: 'Sicherheitsprotokolle einsehen',
      iconBg: 'bg-purple-100',
      icon: <Shield className="h-5 w-5 text-purple-600" />,
    },
    {
      href: '/settings',
      label: 'Einstellungen',
      description: 'Systemkonfiguration anpassen',
      iconBg: 'bg-gray-100',
      icon: <Settings className="h-5 w-5 text-gray-600" />,
    },
    {
      href: '/admin/departments',
      label: 'Abteilungen',
      description: 'Abteilungsstruktur verwalten',
      iconBg: 'bg-cyan-100',
      icon: <Building2 className="h-5 w-5 text-cyan-600" />,
      badge: 'Sprint 2',
    },
    {
      href: '/admin/sync',
      label: 'Sync Center',
      description: 'Entra ID Synchronisation',
      iconBg: 'bg-orange-100',
      icon: <RefreshCw className="h-5 w-5 text-orange-600" />,
      badge: 'Sprint 2',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Systemübersicht und Verwaltung</p>
        </div>

        {/* Error banner */}
        {isError && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            Metriken konnten nicht geladen werden. Bitte die Seite neu laden.
          </div>
        )}

        {/* Metrics Grid — 5 cards, responsive */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Systemmetriken
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonStatCard key={i} />)
              : statCards.map((card) => <StatCard key={card.title} {...card} />)
            }
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Schnellzugriff
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <QuickActionRow key={action.href} action={action} />
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}