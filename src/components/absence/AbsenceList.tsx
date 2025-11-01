'use client';

import React from 'react';
import { IAbsence } from '@/types/absence';
import AbsenceCard from './AbsenceCard';
import EmptyState from '../shared/EmptyState';

interface AbsenceListProps {
  absences: IAbsence[];
  onCancel?: (id: string) => void;
}

export default function AbsenceList({ absences, onCancel }: AbsenceListProps) {
  if (absences.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
        }
        title="Keine Abwesenheiten"
        description="Du hast noch keine Abwesenheiten beantragt."
      />
    );
  }

  return (
    <div className="space-y-4">
      {absences.map((absence) => {
        // Sichere ID-Konvertierung
        const key = (absence as any)._id?.toString() || Math.random().toString();
        return (
          <AbsenceCard key={key} absence={absence} onCancel={onCancel} />
        );
      })}
    </div>
  );
}