'use client';

import React from 'react';
import Card from '../ui/Card';
import { useVacationBalance } from '@/hooks/useVacationBalance';
import LoadingSpinner from '../shared/LoadingSpinner';

export default function VacationBalance() {
  const { stats, isLoading } = useVacationBalance();

  if (isLoading) return <LoadingSpinner size="sm" />;
  if (!stats) return null;

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Urlaubsübersicht</h3>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Verfügbar</span>
            <span className="text-2xl font-bold text-success-600">{stats.remaining}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-success-600 h-2 rounded-full transition-all"
              style={{ width: `${(stats.remaining / stats.total) * 100}%` }}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-500">Gesamt</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{stats.used}</div>
            <div className="text-xs text-gray-500">Genutzt</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning-600">{stats.pending}</div>
            <div className="text-xs text-gray-500">Ausstehend</div>
          </div>
        </div>
      </div>
    </Card>
  );
}