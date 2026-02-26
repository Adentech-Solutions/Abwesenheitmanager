'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCards from '@/components/dashboard/StatsCard';
import VacationBalance from '@/components/dashboard/VacationBalance';
import UpcomingAbsences from '@/components/dashboard/UpcomingAbsences';
import TeamOverview from '@/components/dashboard/TeamCalendar';
import MySubstitutions from '@/components/dashboard/MySubstitutions';
import WelcomeBack from '@/components/dashboard/WelcomeBack';

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Willkommen zurück, {session?.user?.name || 'User'}! 👋
          </p>
        </div>

        {/* Welcome Back Widget (only renders if applicable) */}
        <WelcomeBack />

        {/* Stats Cards */}
        <StatsCards />

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Vacation Balance */}
          <VacationBalance />

          {/* Upcoming Absences */}
          <div className="space-y-6">
            <UpcomingAbsences />
            <MySubstitutions />
          </div>
        </div>

        {/* Team Overview */}
        <TeamOverview />
      </div>
    </DashboardLayout>
  );
}