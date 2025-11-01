'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      label: 'Urlaub beantragen',
      icon: '🏖️',
      onClick: () => router.push('/absences/new'),
      color: 'primary' as const,
    },
    {
      label: 'Krankmeldung',
      icon: '🤒',
      onClick: () => router.push('/absences/new?type=sick'),
      color: 'danger' as const,
    },
    {
      label: 'Fortbildung',
      icon: '📚',
      onClick: () => router.push('/absences/new?type=training'),
      color: 'info' as const,
    },
  ];

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Schnellaktionen</h3>
      <div className="grid grid-cols-1 gap-3">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant={action.color}
            onClick={action.onClick}
            className="justify-start"
          >
            <span className="mr-2 text-xl">{action.icon}</span>
            {action.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}