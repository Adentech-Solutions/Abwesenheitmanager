'use client';

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Willkommen zurück, {session?.user?.name || 'User'}!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ausstehende Anträge</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
              </div>
              <div className="p-3 rounded-full bg-warning-100 text-warning-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Verfügbare Urlaubstage</p>
                <p className="mt-2 text-3xl font-bold text-success-600">25</p>
                <p className="text-xs text-gray-500">von 30 Tagen</p>
              </div>
              <div className="p-3 rounded-full bg-success-100 text-success-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Kommende Abwesenheiten</p>
                <p className="mt-2 text-3xl font-bold text-primary-600">0</p>
              </div>
              <div className="p-3 rounded-full bg-primary-100 text-primary-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Meine Abwesenheiten</h2>
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Abwesenheiten</h3>
                <p className="mt-1 text-sm text-gray-500">Beginne mit dem Erstellen deines ersten Urlaubsantrags.</p>
                <div className="mt-6">
                  <Button variant="primary" onClick={() => router.push('/absences/new')}>
                    Urlaub beantragen
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Schnellaktionen</h3>
              <div className="space-y-3">
                <Button
                  variant="primary"
                  onClick={() => router.push('/absences/new?type=vacation')}
                  className="w-full justify-start"
                >
                  <span className="mr-2">🏖️</span>
                  Urlaub beantragen
                </Button>
                <Button
                  variant="danger"
                  onClick={() => router.push('/absences/new?type=sick')}
                  className="w-full justify-start"
                >
                  <span className="mr-2">🤒</span>
                  Krankmeldung
                </Button>
                <Button
                  variant="info"
                  onClick={() => router.push('/absences/new?type=training')}
                  className="w-full justify-start"
                >
                  <span className="mr-2">📚</span>
                  Fortbildung
                </Button>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipps</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>💡 Brückentage optimal nutzen</li>
                <li>📅 Frühzeitig planen für beliebte Zeiten</li>
                <li>👥 Team-Kalender vor Antragstellung prüfen</li>
              </ul>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
