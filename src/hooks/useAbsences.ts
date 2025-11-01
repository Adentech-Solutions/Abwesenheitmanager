'use client';

import { useState, useEffect } from 'react';
import { IAbsence } from '@/types/absence';

export function useAbsences() {
  const [absences, setAbsences] = useState<IAbsence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAbsences = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/absences');
      if (!response.ok) throw new Error('Failed to fetch absences');
      const data = await response.json();
      setAbsences(data.absences);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAbsences();
  }, []);

  const createAbsence = async (absenceData: any) => {
    const response = await fetch('/api/absences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(absenceData),
    });
    if (!response.ok) throw new Error('Failed to create absence');
    await fetchAbsences();
    return response.json();
  };

  const deleteAbsence = async (id: string) => {
    const response = await fetch(`/api/absences/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete absence');
    await fetchAbsences();
  };

  return {
    absences,
    isLoading,
    error,
    createAbsence,
    deleteAbsence,
    refetch: fetchAbsences,
  };
}
