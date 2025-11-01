// ========================================
// FILE: src/types/user.ts
// User Type Definitions
// ========================================
import { Document } from 'mongoose';

export interface IUser {
  entraId: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  jobTitle?: string;
  managerId?: string;
  managerEmail?: string;
  role: 'employee' | 'manager' | 'admin';
  vacationDays: {
    total: number;
    used: number;
    remaining: number;
    carryOver?: number;
  };
  startDate?: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// ⭐ NEU: Interface mit Methods


export interface VacationBalance {
  total: number;
  used: number;
  remaining: number;
  carryOver?: number;
}