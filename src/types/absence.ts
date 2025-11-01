// src/types/absence.ts - UPDATED

export type AbsenceType = 'vacation' | 'sick' | 'training' | 'parental';
export type AbsenceStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
import { Document } from 'mongoose';

// ⭐ NEUE Interfaces für Auto-Reply
export interface AutoReplySubstitute {
  email: string;
  name: string;
  phone?: string;
}

export interface AutoReplyRecipients {
  internal: boolean;  // Kollegen innerhalb Firma
  external: boolean;  // Externe Kontakte
}

export interface AutoReplyTiming {
  activateImmediately: boolean;
  scheduledDate?: Date;     // Datum der Aktivierung
  scheduledTime?: string;   // Zeit (z.B. "00:00")
}

export interface AutoReplyGeneratedMessage {
  internal?: string;
  external?: string;
}

// ⭐ UPDATED: Erweiterte Auto-Reply Settings
export interface AutoReplySettings {
  enabled: boolean;
  
  // Vertretung
  hasSubstitute: boolean;
  substituteInfo?: AutoReplySubstitute;
  
  // Empfänger
  recipients: AutoReplyRecipients;
  
  // Zeitplanung
  timing: AutoReplyTiming;
  
  // Generierte Nachricht
  generatedMessage?: AutoReplyGeneratedMessage;
  
  // Legacy-Felder (für Kompatibilität)
  activateAt?: Date;
  deactivateAt?: Date;
  templateId?: string;
  customMessage?: string;
  includeSubstitute?: boolean;
  forExternal?: boolean;
  forInternal?: boolean;
}

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
    tasks?: string;
  };
  autoReplySettings?: AutoReplySettings;  // ⭐ UPDATED Type
  conflictWarning?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// ⭐ UPDATED: CreateAbsenceInput mit neuen Auto-Reply Feldern
export interface CreateAbsenceInput {
  type: AbsenceType;
  startDate: Date;
  endDate: Date;
  isHalfDay: boolean;
  halfDayPeriod?: 'morning' | 'afternoon';
  reason?: string;
  substitute?: {
    email: string;
    tasks?: string;
  };
  autoReplySettings?: {
    enabled?: boolean;
    hasSubstitute?: boolean;
    substituteInfo?: AutoReplySubstitute;
    recipients?: AutoReplyRecipients;
    timing?: AutoReplyTiming;
  };
}