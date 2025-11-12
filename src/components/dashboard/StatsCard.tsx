'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Card from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/skeleton';
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
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Genehmigte Anträge',
      value: stats?.stats?.approved || 0,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Verfügbare Urlaubstage',
      value: stats?.stats?.vacationDays?.remaining || 0,
      description: `von ${stats?.stats?.vacationDays?.total || 0} Tagen`,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Gesamt Anträge',
      value: stats?.stats?.total || 0,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <div className="mt-4">
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">
                {card.title}
              </h3>
              <div className={`p-2 rounded-full ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            {card.description && (
              <p className="text-xs text-gray-500 mt-1">
                {card.description}
              </p>
            )}
          </Card>
        );
      })}
    </div>
  );
}