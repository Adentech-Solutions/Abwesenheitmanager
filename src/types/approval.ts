import { IAbsence, AbsenceStatus } from './absence';

export interface IApproval {
  absenceId: string;
  absence: IAbsence;
  requestedBy: string;
  requestedByName: string;
  approverId: string;
  approverEmail: string;
  status: AbsenceStatus;
  conflictWarning?: {
    hasConflict: boolean;
    concurrentAbsences: number;
    maxAllowed: number;
    conflictingUsers: string[];
  };
  notificationSent: boolean;
  createdAt: Date;
}

export interface ApprovalAction {
  absenceId: string;
  action: 'approve' | 'reject';
  reason?: string;
  approverId: string;
}