'use client';

import { useState, useEffect } from 'react';

interface VacationStats {
  total: number;
  used: number;
  remaining: number;
  pending: number;
  approved: number;
}

export function useVacationBalance() {
  const [stats, setStats] = useState<VacationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/absences/stats');
        if (!response.ok) throw new Error('Failed to fetch stats');
        const data = await response.json();
        setStats({
          ...data.stats.vacationDays,
          pending: data.stats.pending,
          approved: data.stats.approved,
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, isLoading, error };
}