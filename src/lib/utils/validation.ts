import { z } from 'zod';

// ⭐ NEU: Auto-Reply Settings Schema
const autoReplySettingsSchema = z.object({
  enabled: z.boolean().optional().default(true),
  
  // Vertretung
  hasSubstitute: z.boolean().optional().default(false),
  substituteInfo: z.object({
    email: z.string().email(),
    name: z.string().min(1).max(100),
    phone: z.string().max(20).optional(),
  }).optional(),
  
  // Empfänger
  recipients: z.object({
    internal: z.boolean().optional().default(true),
    external: z.boolean().optional().default(true),
  }).optional(),
  
  // Zeitplanung
  timing: z.object({
    activateImmediately: z.boolean().optional().default(false),
    scheduledDate: z.string().or(z.date()).optional(),
    scheduledTime: z.string().regex(/^\d{2}:\d{2}$/).optional().default('00:00'),
  }).optional(),
}).optional();

// ⭐ UPDATED: Absence Schema mit Auto-Reply Settings
export const absenceSchema = z.object({
  type: z.enum(['vacation', 'sick', 'training', 'parental']),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  isHalfDay: z.boolean().default(false),
  halfDayPeriod: z.enum(['morning', 'afternoon']).optional(),
  reason: z.string().max(500).optional(),
  substituteEmail: z.string().email().optional(),
  substituteTasks: z.string().max(1000).optional(),
  
  // ⭐ NEU: Auto-Reply Settings
  autoReplySettings: autoReplySettingsSchema,
}).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end >= start;
  },
  {
    message: 'End date must be after or equal to start date',
    path: ['endDate'],
  }
);

export const approvalSchema = z.object({
  absenceId: z.string(),
  action: z.enum(['approve', 'reject']),
  reason: z.string().max(500).optional(),
});

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateDateRange(startDate: Date, endDate: Date): boolean {
  return endDate >= startDate;
}

export function isValidAbsenceType(type: string): boolean {
  return ['vacation', 'sick', 'training', 'parental'].includes(type);
}