import React from 'react';
import Card from '../ui/Card';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: {
    value: string;
    trend: 'up' | 'down';
  };
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

export default function StatsCard({ title, value, icon, change, color = 'blue' }: StatsCardProps) {
  const colors = {
    blue: 'bg-primary-100 text-primary-600',
    green: 'bg-success-100 text-success-600',
    yellow: 'bg-warning-100 text-warning-600',
    red: 'bg-danger-100 text-danger-600',
  };

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className="mt-2 text-sm">
              <span className={change.trend === 'up' ? 'text-success-600' : 'text-danger-600'}>
                {change.trend === 'up' ? '↑' : '↓'} {change.value}
              </span>
              <span className="text-gray-500 ml-1">vs. letzter Monat</span>
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${colors[color]}`}>{icon}</div>
      </div>
    </Card>
  );
}
