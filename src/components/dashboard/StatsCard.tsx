'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import Card from '@/components/ui/Card';
import StatsCard from '@/components/shared/StatsCard';
import { Clock, Calendar, CheckCircle2, TrendingUp } from 'lucide-react';

export default function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['absences', 'stats'],
    queryFn: async () => {
      const response = await fetch('/api/absences/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  const cards = [
    {
      title: 'Ausstehende Anträge',
      value: stats?.stats?.pending || 0,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      delay: 'delay-0',
    },
    {
      title: 'Genehmigte Anträge',
      value: stats?.stats?.approved || 0,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      delay: 'delay-75',
    },
    {
      title: 'Verfügbare Urlaubstage',
      value: stats?.stats?.vacationDays?.remaining || 0,
      description: `von ${stats?.stats?.vacationDays?.total || 0} Tagen`,
      icon: Calendar,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      delay: 'delay-150',
    },
    {
      title: 'Gesamt Anträge',
      value: stats?.stats?.total || 0,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      delay: 'delay-[225ms]',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-8 w-12" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <StatsCard 
          key={card.title}
          title={card.title}
          value={card.value}
          icon={card.icon}
          color={card.color}
          bgColor={card.bgColor}
          delay={card.delay}
          description={card.description}
        />
      ))}
    </div>
  );
}