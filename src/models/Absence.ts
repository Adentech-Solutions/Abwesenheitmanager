// ========================================
// FILE: src/models/Absence.ts
// Absence MongoDB Model - UPDATED
// ========================================
import mongoose, { Schema, Model } from 'mongoose';
import { IAbsence } from '@/types/absence';

interface IAbsenceDocument extends IAbsence, mongoose.Document {
  approve(approverId: string, approverEmail: string): Promise<this>;
  reject(approverId: string, approverEmail: string, reason: string): Promise<this>;
}

const AbsenceSchema = new Schema<IAbsenceDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    userName: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['vacation', 'sick', 'training', 'parental'],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    isHalfDay: {
      type: Boolean,
      default: false,
    },
    halfDayPeriod: {
      type: String,
      enum: ['morning', 'afternoon'],
    },
    totalDays: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    approvedBy: {
      type: String,
    },
    approvedByEmail: {
      type: String,
      lowercase: true,
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    substitute: {
      userId: String,
      email: String,
      name: String,
      notified: {
        type: Boolean,
        default: false,
      },
      tasks: String,
    },
    // ⭐ UPDATED: Erweiterte Auto-Reply Settings
    autoReplySettings: {
      enabled: {
        type: Boolean,
        default: true,  // ← DEFAULT: true (immer aktiviert)
      },
      
      // Vertretung
      hasSubstitute: {
        type: Boolean,
        default: false,
      },
      substituteInfo: {
        email: String,
        name: String,
        phone: String,
      },
      
      // Empfänger (DEFAULT: beide true)
      recipients: {
        internal: {
          type: Boolean,
          default: true,  // ← DEFAULT: true
        },
        external: {
          type: Boolean,
          default: true,  // ← DEFAULT: true
        },
      },
      
      // Zeitplanung
      timing: {
        activateImmediately: {
          type: Boolean,
          default: false,
        },
        scheduledDate: Date,      // Startdatum der Abwesenheit
        scheduledTime: {
          type: String,
          default: '00:00',        // ← DEFAULT: Mitternacht
        },
      },
      
      // Generierte Nachricht (wird automatisch erstellt)
      generatedMessage: {
        internal: String,
        external: String,
      },
      
      // Legacy-Felder (für Kompatibilität)
      activateAt: Date,
      deactivateAt: Date,
      templateId: String,
      customMessage: String,
      includeSubstitute: {
        type: Boolean,
        default: true,
      },
      forExternal: {
        type: Boolean,
        default: true,
      },
      forInternal: {
        type: Boolean,
        default: true,
      },
    },
    conflictWarning: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
AbsenceSchema.index({ userId: 1, startDate: -1 });
AbsenceSchema.index({ status: 1, startDate: 1 });
AbsenceSchema.index({ userEmail: 1 });
AbsenceSchema.index({ startDate: 1, endDate: 1 });

// Methods
AbsenceSchema.methods.approve = function(approverId: string, approverEmail: string) {
  this.status = 'approved';
  this.approvedBy = approverId;
  this.approvedByEmail = approverEmail;
  this.approvedAt = new Date();
  return this.save();
};

AbsenceSchema.methods.reject = function(approverId: string, approverEmail: string, reason: string) {
  this.status = 'rejected';
  this.approvedBy = approverId;
  this.approvedByEmail = approverEmail;
  this.rejectionReason = reason;
  this.approvedAt = new Date();
  return this.save();
};

const Absence = (mongoose.models.Absence as Model<IAbsenceDocument>) || mongoose.model<IAbsenceDocument>('Absence', AbsenceSchema);

export default Absence;
export type { IAbsenceDocument };