import { z } from 'zod';

// Auto-Reply Settings Schema
const autoReplySettingsSchema = z.object({
  enabled: z.boolean().optional().default(true),
  hasSubstitute: z.boolean().optional().default(false),
  substituteInfo: z.object({
    email: z.string().email(),
    name: z.string().min(1).max(100),
    phone: z.string().max(20).optional(),
  }).optional(),
  recipients: z.object({
    internal: z.boolean().optional().default(true),
    external: z.boolean().optional().default(true),
  }).optional(),
  timing: z.object({
    activateImmediately: z.boolean().optional().default(false),
    scheduledDate: z.string().or(z.date()).optional(),
    scheduledTime: z.string().regex(/^\d{2}:\d{2}$/).optional().default('00:00'),
  }).optional(),
}).optional();

// Substitute Schema
const substituteSchema = z.preprocess(
  (val: any) => {
    if (!val || !val.email || val.email.trim() === '') return undefined;
    return val;
  },
  z.object({
    email: z.string().email(),
    name: z.string().min(1).max(100).optional(),
    tasks: z.string().max(1000).optional(),
  }).optional()
);

// Handover Item Link Schema
const handoverLinkSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.string().url(),
});

// Handover Item Schema
const handoverItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  links: z.array(handoverLinkSchema).max(10).optional(),
  isUrgent: z.boolean().default(false),
});

// Emergency Contact Schema
export const emergencyContactSchema = z.object({
  availability: z.enum(['unavailable', 'emergency_only', 'limited_email']),
  phone: z.string().max(20).optional(),
  note: z.string().max(500).optional(),
}).refine(
  (data) => {
    // Phone is required when availability is emergency_only
    if (data.availability === 'emergency_only' && !data.phone) {
      return false;
    }
    return true;
  },
  {
    message: 'Telefonnummer ist erforderlich bei Notfall-Erreichbarkeit',
    path: ['phone'],
  }
).optional();

// Handover Schema
const handoverSchema = z.object({
  enabled: z.boolean(),
  items: z.array(handoverItemSchema).max(20).default([]),
  generalNotes: z.string().max(5000).optional(),
  emergencyContact: z.object({
    availability: z.enum(['unavailable', 'emergency_only', 'limited_email']),
    phone: z.string().max(20).optional(),
    note: z.string().max(500).optional(),
  }).optional(),
}).refine(
  (data) => {
    // If handover is enabled, must have at least one item OR general notes
    if (data.enabled && data.items.length === 0 && !data.generalNotes) {
      return false;
    }
    return true;
  },
  {
    message: 'Übergabe muss mindestens einen Vorgang oder allgemeine Hinweise enthalten',
    path: ['items'],
  }
).optional();

// Main Absence Schema
export const absenceSchema = z.object({
  type: z.enum(['vacation', 'sick', 'training', 'parental']),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  isHalfDay: z.boolean().default(false),
  halfDayPeriod: z.enum(['morning', 'afternoon']).optional(),
  reason: z.string().max(500).optional(),
  substituteEmail: z.string().email().optional(),
  substituteTasks: z.string().max(1000).optional(),
  substitute: substituteSchema,
  handover: handoverSchema,
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