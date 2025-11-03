// ========================================
// FILE: src/models/AbsenceAnalytics.ts
// Analytics Model for Absence Statistics
// ========================================

import mongoose, { Schema, Model } from 'mongoose';

export interface IAbsenceAnalytics {
  _id?: string;
  year: number;
  month: number;
  department?: string;
  
  // Statistiken
  totalAbsences: number;
  totalDays: number;
  averageDuration: number;
  
  // Nach Type
  byType: {
    vacation: number;
    sick: number;
    training: number;
    parental: number;
  };
  
  // Nach Status
  byStatus: {
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
  };
  
  // Trends
  comparedToLastMonth: {
    totalChange: number;      // +5 oder -3
    percentageChange: number; // +15% oder -10%
    sickLeaveChange: number;
  };
  
  // Peak Times
  peakDays: Array<{
    date: Date;
    absenceCount: number;
  }>;
  
  // Vacation Score (wie viel % vom Team hat Urlaub genommen)
  vacationScore: number; // 0-100
  
  updatedAt?: Date;
  createdAt?: Date;
}

const AbsenceAnalyticsSchema = new Schema<IAbsenceAnalytics>(
  {
    year: {
      type: Number,
      required: true,
      index: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
      index: true,
    },
    department: {
      type: String,
      index: true,
    },
    totalAbsences: {
      type: Number,
      default: 0,
    },
    totalDays: {
      type: Number,
      default: 0,
    },
    averageDuration: {
      type: Number,
      default: 0,
    },
    byType: {
      vacation: { type: Number, default: 0 },
      sick: { type: Number, default: 0 },
      training: { type: Number, default: 0 },
      parental: { type: Number, default: 0 },
    },
    byStatus: {
      pending: { type: Number, default: 0 },
      approved: { type: Number, default: 0 },
      rejected: { type: Number, default: 0 },
      cancelled: { type: Number, default: 0 },
    },
    comparedToLastMonth: {
      totalChange: { type: Number, default: 0 },
      percentageChange: { type: Number, default: 0 },
      sickLeaveChange: { type: Number, default: 0 },
    },
    peakDays: [
      {
        date: { type: Date, required: true },
        absenceCount: { type: Number, required: true },
      },
    ],
    vacationScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Composite Index für schnelle Queries
AbsenceAnalyticsSchema.index({ year: 1, month: 1, department: 1 }, { unique: true });

const AbsenceAnalytics: Model<IAbsenceAnalytics> =
  mongoose.models.AbsenceAnalytics ||
  mongoose.model<IAbsenceAnalytics>('AbsenceAnalytics', AbsenceAnalyticsSchema);

export default AbsenceAnalytics;