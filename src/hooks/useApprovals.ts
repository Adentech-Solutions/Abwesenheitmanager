'use client';

import { useState, useEffect } from 'react';
import { IAbsence } from '@/types/absence';

export function useApprovals() {
  const [approvals, setApprovals] = useState<IAbsence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApprovals = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/approvals');
      if (!response.ok) throw new Error('Failed to fetch approvals');
      const data = await response.json();
      setApprovals(data.approvals);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const approveAbsence = async (id: string) => {
    const response = await fetch(`/api/approvals/${id}/approve`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to approve absence');
    await fetchApprovals();
  };

  const rejectAbsence = async (id: string, reason: string) => {
    const response = await fetch(`/api/approvals/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) throw new Error('Failed to reject absence');
    await fetchApprovals();
  };

  return {
    approvals,
    isLoading,
    error,
    approveAbsence,
    rejectAbsence,
    refetch: fetchApprovals,
  };
}