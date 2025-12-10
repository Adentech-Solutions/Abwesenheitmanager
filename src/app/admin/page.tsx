'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import { Users, Calendar, Clock, Shield, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: async () => {
      const res = await fetch('/api/admin/metrics');
      if (!res.ok) throw new Error('Failed to fetch metrics');
      return res.json();
    },
  });

  const cards = [
    {
      title: 'Benutzer',
      value: metrics?.totalUsers || '-',
      label: 'Registrierte Benutzer',
      icon: Users,
      color: 'bg-blue-500',
      href: '/admin/users',
    },
    {
      title: 'Offene Anträge',
      value: metrics?.pendingAbsences || '-',
      label: 'Warten auf Genehmigung',
      icon: Clock,
      color: 'bg-yellow-500',
      href: '/manager', // Admins can also approve
    },
    {
      title: 'Abwesenheiten',
      value: metrics?.totalAbsences || '-',
      label: 'Gesamt erfasst',
      icon: Calendar,
      color: 'bg-green-500',
      href: '/admin/audit?entityType=absence',
    },
    {
      title: 'Audit Logs',
      value: 'Log',
      label: 'Systemaktivitäten',
      icon: Shield,
      color: 'bg-purple-500',
      href: '/admin/audit',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Systemübersicht und Verwaltung</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.title} href={card.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{card.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {isLoading ? '...' : card.value}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{card.label}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${card.color} text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold mb-4">Benutzerverwaltung</h3>
            <div className="space-y-4">
              <Link
                href="/admin/users"
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Alle Benutzer</p>
                    <p className="text-sm text-gray-500">Rollen und Berechtigungen verwalten</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </Link>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-4">System & Sicherheit</h3>
            <div className="space-y-4">
              <Link
                href="/admin/audit"
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-full">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Audit Logs</p>
                    <p className="text-sm text-gray-500">Sicherheitsprotokolle einsehen</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}