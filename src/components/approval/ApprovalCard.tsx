'use client';

import React, { useState } from 'react';
import { IAbsence } from '@/types/absence';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { formatAbsenceType } from '@/lib/utils/format';
import { formatDateRange } from '@/lib/utils/date';

interface ApprovalCardProps {
  absence: IAbsence;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
}

export default function ApprovalCard({ absence, onApprove, onReject }: ApprovalCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Sichere ID-Konvertierung
  const absenceId = (absence as any)._id?.toString() || '';

  const handleApprove = async () => {
    if (!absenceId) return;
    setIsProcessing(true);
    try {
      await onApprove(absenceId);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!absenceId) return;
    if (!rejectReason.trim()) {
      alert('Bitte gib einen Ablehnungsgrund an');
      return;
    }
    setIsProcessing(true);
    try {
      await onReject(absenceId, rejectReason);
      setShowRejectDialog(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Card>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="text-lg font-semibold text-gray-900">{absence.userName}</h4>
            <p className="text-sm text-gray-600">{absence.userEmail}</p>
          </div>
          <Badge variant="warning">Ausstehend</Badge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Art:</span>
            <span className="text-sm font-medium">{formatAbsenceType(absence.type)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Zeitraum:</span>
            <span className="text-sm font-medium">
              {formatDateRange(absence.startDate, absence.endDate)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Dauer:</span>
            <span className="text-sm font-medium">{absence.totalDays} Tage</span>
          </div>
        </div>

        {absence.reason && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">{absence.reason}</p>
          </div>
        )}

        {absence.conflictWarning && (
          <div className="mb-4 p-3 bg-warning-50 rounded-lg">
            <p className="text-sm text-warning-800">
              ⚠️ Warnung: Mehrere Mitarbeiter gleichzeitig abwesend
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="success"
            onClick={handleApprove}
            isLoading={isProcessing}
            className="flex-1"
          >
            Genehmigen
          </Button>
          <Button
            variant="danger"
            onClick={() => setShowRejectDialog(true)}
            disabled={isProcessing}
            className="flex-1"
          >
            Ablehnen
          </Button>
        </div>
      </Card>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Antrag ablehnen</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Bitte gib einen Grund für die Ablehnung an..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Abbrechen
              </Button>
              <Button variant="danger" onClick={handleReject} isLoading={isProcessing}>
                Ablehnen
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}