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
import VacationSuggestions from '@/components/dashboard/VacationSuggestions';

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Willkommen zurück, {session?.user?.name || 'User'}!
          </p>
        </div>

        {/* Welcome Back Widget */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">
          <WelcomeBack />
        </div>

        {/* Stats Cards */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both">
          <StatsCards />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column: Vacation Balance */}
          <div className="lg:col-span-1 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
            <VacationBalance />
          </div>

          {/* Right Column: Upcoming Absences & Substitutions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[450ms] fill-mode-both">
              <UpcomingAbsences />
            </div>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[550ms] fill-mode-both">
              <VacationSuggestions />
            </div>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[600ms] fill-mode-both">
              <MySubstitutions />
            </div>
          </div>
        </div>

        {/* Team Overview */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[750ms] fill-mode-both">
          <TeamOverview />
        </div>
      </div>
    </DashboardLayout>
  );
}