// src/types/absence.ts - UPDATED WITH HANDOVER

export type AbsenceType = 'vacation' | 'sick' | 'training' | 'parental';
export type AbsenceStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
import { Document } from 'mongoose';

// ========================================
// Auto-Reply Interfaces
// ========================================

export interface AutoReplySubstitute {
  email: string;
  name: string;
  phone?: string;
}

export interface AutoReplyRecipients {
  internal: boolean;
  external: boolean;
}

export interface AutoReplyTiming {
  activateImmediately: boolean;
  scheduledDate?: Date;
  scheduledTime?: string;
}

export interface AutoReplyGeneratedMessage {
  internal?: string;
  external?: string;
}

export interface AutoReplySettings {
  enabled: boolean;
  hasSubstitute: boolean;
  substituteInfo?: AutoReplySubstitute;
  recipients: AutoReplyRecipients;
  timing: AutoReplyTiming;
  generatedMessage?: AutoReplyGeneratedMessage;
  // Legacy
  activateAt?: Date;
  deactivateAt?: Date;
  templateId?: string;
  customMessage?: string;
  includeSubstitute?: boolean;
  forExternal?: boolean;
  forInternal?: boolean;
}

// ========================================
// Handover Interfaces
// ========================================

export interface HandoverItemLink {
  title: string;
  url: string;
}

export interface HandoverItem {
  id: string;
  title: string;
  description?: string;
  links?: HandoverItemLink[];
  isUrgent: boolean;
  status: 'open' | 'done';
  completedAt?: Date;
  completedNote?: string;
}

export interface HandoverActivityNote {
  id: string;
  content: string;
  createdAt: Date;
  createdBy: string;
  createdByName: string;
}

export interface HandoverEmergencyContact {
  availability: 'unavailable' | 'emergency_only' | 'limited_email';
  phone?: string;
  note?: string;
}

export interface HandoverReturnSummary {
  content: string;
  createdAt: Date;
  createdBy: string;
}

export interface Handover {
  enabled: boolean;
  items: HandoverItem[];
  generalNotes?: string;
  activityNotes: HandoverActivityNote[];
  emergencyContact?: HandoverEmergencyContact;
  returnSummary?: HandoverReturnSummary;
  createdBy: 'employee' | 'manager';
  notifiedAt?: Date;
  acknowledgedAt?: Date;
}

// ========================================
// Absence Interfaces
// ========================================

export interface IAbsence {
  userId: string;
  userEmail: string;
  userName: string;
  type: AbsenceType;
  startDate: Date;
  endDate: Date;
  isHalfDay: boolean;
  halfDayPeriod?: 'morning' | 'afternoon';
  totalDays: number;
  status: AbsenceStatus;
  reason?: string;
  approvedBy?: string;
  approvedByEmail?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  substitute?: {
    userId: string;
    email: string;
    name: string;
    notified: boolean;
    acknowledgedAt?: Date;
    tasks?: string; // Legacy
  };
  handover?: Handover;
  autoReplySettings?: AutoReplySettings;
  conflictWarning?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateAbsenceInput {
  type: AbsenceType;
  startDate: Date;
  endDate: Date;
  isHalfDay: boolean;
  halfDayPeriod?: 'morning' | 'afternoon';
  reason?: string;
  substitute?: {
    email: string;
    name?: string;
    tasks?: string;
  };
  handover?: {
    enabled: boolean;
    items: Omit<HandoverItem, 'status' | 'completedAt' | 'completedNote'>[];
    generalNotes?: string;
    emergencyContact?: HandoverEmergencyContact;
  };
  autoReplySettings?: {
    enabled?: boolean;
    hasSubstitute?: boolean;
    substituteInfo?: AutoReplySubstitute;
    recipients?: AutoReplyRecipients;
    timing?: AutoReplyTiming;
  };
}