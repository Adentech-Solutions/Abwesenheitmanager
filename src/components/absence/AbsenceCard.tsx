'use client';

import React from 'react';
import { IAbsence } from '@/types/absence';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { formatAbsenceType, formatAbsenceStatus } from '@/lib/utils/format';
import { formatDateRange } from '@/lib/utils/date';

interface AbsenceCardProps {
  absence: IAbsence;
  onCancel?: (id: string) => void;
}

export default function AbsenceCard({ absence, onCancel }: AbsenceCardProps) {
  const statusVariants = {
    pending: 'warning' as const,
    approved: 'success' as const,
    rejected: 'danger' as const,
    cancelled: 'default' as const,
  };

  // Sichere ID-Konvertierung
  const absenceId = (absence as any)._id?.toString() || '';

  return (
    <Card hover>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="text-lg font-semibold text-gray-900">
              {formatAbsenceType(absence.type)}
            </h4>
            <Badge variant={statusVariants[absence.status]}>
              {formatAbsenceStatus(absence.status)}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            {formatDateRange(absence.startDate, absence.endDate)}
          </p>
          <p className="text-sm text-gray-500">
            {absence.totalDays} {absence.totalDays === 1 ? 'Tag' : 'Tage'}
          </p>
          {absence.reason && (
            <p className="text-sm text-gray-600 mt-2 italic">{absence.reason}</p>
          )}
          {absence.rejectionReason && (
            <div className="mt-3 p-3 bg-danger-50 rounded-lg">
              <p className="text-sm text-danger-800">
                <strong>Ablehnungsgrund:</strong> {absence.rejectionReason}
              </p>
            </div>
          )}
        </div>
        {absence.status === 'pending' && onCancel && absenceId && (
          <button
            onClick={() => onCancel(absenceId)}
            className="text-danger-600 hover:text-danger-700 text-sm font-medium"
          >
            Stornieren
          </button>
        )}
      </div>
    </Card>
  );
}