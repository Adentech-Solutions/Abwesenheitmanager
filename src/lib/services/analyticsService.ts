// ========================================
// FILE: src/lib/services/analyticsService.ts
// Service for Calculating Absence Analytics
// ========================================

import { startOfMonth, endOfMonth, startOfYear, endOfYear, differenceInCalendarDays } from 'date-fns';
import Absence from '@/models/Absence';
import User from '@/models/User';
import AbsenceAnalytics from '@/models/AbsenceAnalytics';
import connectDB from '@/lib/mongodb';

export interface AnalyticsQuery {
  year?: number;
  month?: number;
  department?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface DepartmentStats {
  department: string;
  totalAbsences: number;
  totalDays: number;
  averageDuration: number;
  vacationRate: number; // Percentage of vacation days used
  sickLeaveRate: number;
  employeeCount: number;
}

export interface SickLeaveTrend {
  month: string;
  year: number;
  sickDays: number;
  trend: 'up' | 'down' | 'stable';
  percentageChange: number;
}

/**
 * Calculate comprehensive analytics for absences
 */
export async function calculateAnalytics(query: AnalyticsQuery) {
  await connectDB();

  const currentYear = query.year || new Date().getFullYear();
  const currentMonth = query.month || new Date().getMonth() + 1;

  const startDate = query.startDate || startOfMonth(new Date(currentYear, currentMonth - 1));
  const endDate = query.endDate || endOfMonth(new Date(currentYear, currentMonth - 1));

  // Build MongoDB query
  const absenceQuery: any = {
    startDate: { $gte: startDate },
    endDate: { $lte: endDate },
    status: { $in: ['approved', 'pending'] },
  };

  if (query.department) {
    // Get users from department
    const departmentUsers = await User.find({ 
      department: query.department,
      isActive: true 
    });
    const userEmails = departmentUsers.map(u => u.email);
    absenceQuery.userEmail = { $in: userEmails };
  }

  const absences = await Absence.find(absenceQuery);

  // Calculate statistics
  const totalAbsences = absences.length;
  const totalDays = absences.reduce((sum, a) => sum + a.totalDays, 0);
  const averageDuration = totalAbsences > 0 ? totalDays / totalAbsences : 0;

  // By Type
  const byType = {
    vacation: absences.filter(a => a.type === 'vacation').length,
    sick: absences.filter(a => a.type === 'sick').length,
    training: absences.filter(a => a.type === 'training').length,
    parental: absences.filter(a => a.type === 'parental').length,
  };

  // By Status
  const byStatus = {
    pending: absences.filter(a => a.status === 'pending').length,
    approved: absences.filter(a => a.status === 'approved').length,
    rejected: absences.filter(a => a.status === 'rejected').length,
    cancelled: absences.filter(a => a.status === 'cancelled').length,
  };

  // Compare to last month
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  
  const lastMonthStart = startOfMonth(new Date(lastMonthYear, lastMonth - 1));
  const lastMonthEnd = endOfMonth(new Date(lastMonthYear, lastMonth - 1));

  const lastMonthAbsences = await Absence.find({
    ...absenceQuery,
    startDate: { $gte: lastMonthStart },
    endDate: { $lte: lastMonthEnd },
  });

  const lastMonthTotal = lastMonthAbsences.length;
  const totalChange = totalAbsences - lastMonthTotal;
  const percentageChange = lastMonthTotal > 0 
    ? ((totalChange / lastMonthTotal) * 100) 
    : 0;

  const lastMonthSick = lastMonthAbsences.filter(a => a.type === 'sick').length;
  const currentSick = byType.sick;
  const sickLeaveChange = currentSick - lastMonthSick;

  // Find peak days (days with most concurrent absences)
  const peakDays = findPeakDays(absences);

  // Calculate vacation score (how much vacation is being used)
  const vacationScore = await calculateVacationScore(query.department);

  return {
    year: currentYear,
    month: currentMonth,
    department: query.department,
    totalAbsences,
    totalDays,
    averageDuration: Math.round(averageDuration * 10) / 10,
    byType,
    byStatus,
    comparedToLastMonth: {
      totalChange,
      percentageChange: Math.round(percentageChange * 10) / 10,
      sickLeaveChange,
    },
    peakDays,
    vacationScore,
  };
}

/**
 * Get analytics by department
 */
export async function getAnalyticsByDepartment(
  year: number,
  month?: number
): Promise<DepartmentStats[]> {
  await connectDB();

  const startDate = month 
    ? startOfMonth(new Date(year, month - 1))
    : startOfYear(new Date(year, 0));
  
  const endDate = month
    ? endOfMonth(new Date(year, month - 1))
    : endOfYear(new Date(year, 0));

  // Get all departments
  const departments = await User.distinct('department', { 
    isActive: true,
    department: { $ne: null, $exists: true }
  }).then(depts => depts.filter(d => d !== ''));

  const stats: DepartmentStats[] = [];

  for (const dept of departments) {
    const deptUsers = await User.find({ 
      department: dept,
      isActive: true 
    });
    
    const userEmails = deptUsers.map(u => u.email);
    
    const absences = await Absence.find({
      userEmail: { $in: userEmails },
      startDate: { $gte: startDate },
      endDate: { $lte: endDate },
      status: { $in: ['approved', 'pending'] },
    });

    const totalDays = absences.reduce((sum, a) => sum + a.totalDays, 0);
    const vacationDays = absences
      .filter(a => a.type === 'vacation')
      .reduce((sum, a) => sum + a.totalDays, 0);
    const sickDays = absences
      .filter(a => a.type === 'sick')
      .reduce((sum, a) => sum + a.totalDays, 0);

    const totalVacationDaysAvailable = deptUsers.reduce(
      (sum, u) => sum + (u.vacationDays?.total || 30),
      0
    );

    stats.push({
      department: dept,
      totalAbsences: absences.length,
      totalDays,
      averageDuration: absences.length > 0 
        ? Math.round((totalDays / absences.length) * 10) / 10 
        : 0,
      vacationRate: totalVacationDaysAvailable > 0
        ? Math.round((vacationDays / totalVacationDaysAvailable) * 100)
        : 0,
      sickLeaveRate: deptUsers.length > 0
        ? Math.round((sickDays / deptUsers.length) * 10) / 10
        : 0,
      employeeCount: deptUsers.length,
    });
  }

  return stats.sort((a, b) => b.totalAbsences - a.totalAbsences);
}

/**
 * Get sick leave trends over time
 */
export async function getSickLeaveTrends(
  year: number,
  months: number = 12
): Promise<SickLeaveTrend[]> {
  await connectDB();

  const trends: SickLeaveTrend[] = [];
  const currentDate = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(year, currentDate.getMonth() - i, 1);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    const sickAbsences = await Absence.find({
      type: 'sick',
      startDate: { $gte: monthStart },
      endDate: { $lte: monthEnd },
      status: { $in: ['approved', 'pending'] },
    });

    const sickDays = sickAbsences.reduce((sum, a) => sum + a.totalDays, 0);

    // Calculate trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let percentageChange = 0;

    if (trends.length > 0) {
      const lastMonthDays = trends[trends.length - 1].sickDays;
      const change = sickDays - lastMonthDays;
      percentageChange = lastMonthDays > 0 
        ? Math.round((change / lastMonthDays) * 100) 
        : 0;

      if (percentageChange > 10) trend = 'up';
      else if (percentageChange < -10) trend = 'down';
    }

    trends.push({
      month: date.toLocaleDateString('de-DE', { month: 'long' }),
      year: date.getFullYear(),
      sickDays,
      trend,
      percentageChange,
    });
  }

  return trends;
}

/**
 * Find peak absence days
 */
function findPeakDays(absences: any[]): Array<{ date: Date; absenceCount: number }> {
  const dayMap = new Map<string, number>();

  absences.forEach(absence => {
    const start = new Date(absence.startDate);
    const end = new Date(absence.endDate);
    const days = differenceInCalendarDays(end, start) + 1;

    for (let i = 0; i < days; i++) {
      const currentDay = new Date(start);
      currentDay.setDate(start.getDate() + i);
      const dayKey = currentDay.toISOString().split('T')[0];
      
      dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + 1);
    }
  });

  // Get top 5 peak days
  const peakDays = Array.from(dayMap.entries())
    .map(([dateStr, count]) => ({
      date: new Date(dateStr),
      absenceCount: count,
    }))
    .sort((a, b) => b.absenceCount - a.absenceCount)
    .slice(0, 5);

  return peakDays;
}

/**
 * Calculate vacation score (encouragement metric)
 */
async function calculateVacationScore(department?: string): Promise<number> {
  const query: any = { isActive: true };
  if (department) query.department = department;

  const users = await User.find(query);
  
  if (users.length === 0) return 0;

  const totalVacationDays = users.reduce(
    (sum, u) => sum + (u.vacationDays?.total || 30),
    0
  );

  const usedVacationDays = users.reduce(
    (sum, u) => sum + (u.vacationDays?.used || 0),
    0
  );

  const score = (usedVacationDays / totalVacationDays) * 100;
  return Math.min(Math.round(score), 100);
}

/**
 * Save/Update analytics in database
 */
export async function saveAnalytics(analyticsData: any) {
  await connectDB();

  const filter = {
    year: analyticsData.year,
    month: analyticsData.month,
    department: analyticsData.department || null,
  };

  await AbsenceAnalytics.findOneAndUpdate(
    filter,
    analyticsData,
    { upsert: true, new: true }
  );
}

/**
 * Get cached analytics (faster)
 */
export async function getCachedAnalytics(query: AnalyticsQuery) {
  await connectDB();

  const filter: any = {
    year: query.year || new Date().getFullYear(),
    month: query.month || new Date().getMonth() + 1,
  };

  if (query.department) filter.department = query.department;
  else filter.department = { $exists: false };

  let analytics = await AbsenceAnalytics.findOne(filter);

  // If not cached or outdated, calculate fresh
  if (!analytics || isOutdated(analytics.updatedAt)) {
    const freshData = await calculateAnalytics(query);
    await saveAnalytics(freshData);
    analytics = await AbsenceAnalytics.findOne(filter);
  }

  return analytics;
}

function isOutdated(date?: Date): boolean {
  if (!date) return true;
  const hoursSinceUpdate = (Date.now() - date.getTime()) / (1000 * 60 * 60);
  return hoursSinceUpdate > 24; // Refresh every 24 hours
}