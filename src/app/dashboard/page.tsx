'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCards from '@/components/dashboard/StatsCard';
import VacationBalance from '@/components/dashboard/VacationBalance';
import YearPlannerWidget from '@/components/dashboard/YearPlannerWidget';
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Willkommen zurück, {session?.user?.name || 'User'}!
          </p>
        </div>

        <WelcomeBack />

        <StatsCards />

        {/* First Row: Balance & Upcoming */}
        <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
          <div className="lg:col-span-1">
            <VacationBalance className="h-full" />
          </div>
          <div className="lg:col-span-2">
            <UpcomingAbsences className="h-full" />
          </div>
        </div>

        {/* Second Row: Planner & Suggestions */}
        <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
          <div className="lg:col-span-1">
            <YearPlannerWidget className="h-full" />
          </div>
          <div className="lg:col-span-2">
            <VacationSuggestions className="h-full" />
          </div>
        </div>

        {/* Third Row: Substitutions (if any) */}
        <MySubstitutions />

        <TeamOverview />
      </div>
    </DashboardLayout>
  );
}