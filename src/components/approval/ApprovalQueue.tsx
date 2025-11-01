// ========================================
// FILE: src/components/approval/ApprovalQueue.tsx
// ========================================
'use client';

import React from 'react';
import { IAbsence } from '@/types/absence';
import ApprovalCard from './ApprovalCard';
import EmptyState from '../shared/EmptyState';

interface ApprovalQueueProps {
  approvals: IAbsence[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
}

export default function ApprovalQueue({ approvals, onApprove, onReject }: ApprovalQueueProps) {
  if (approvals.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        }
        title="Keine offenen Genehmigungen"
        description="Alle Anträge wurden bearbeitet."
      />
    );
  }

  return (
    <div className="space-y-4">
      {approvals.map((approval) => {
        // Sichere ID-Konvertierung
        const key = (approval as any)._id?.toString() || Math.random().toString();
        return (
          <ApprovalCard
            key={key}
            absence={approval}
            onApprove={onApprove}
            onReject={onReject}
          />
        );
      })}
    </div>
  );
}