// ========================================
// FILE: src/app/api/analytics/route.ts
// Analytics API Endpoints
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import {
  calculateAnalytics,
  getAnalyticsByDepartment,
  getSickLeaveTrends,
  getCachedAnalytics,
  AnalyticsQuery,
} from '@/lib/services/analyticsService';
import { requireRole } from '@/lib/rbac';

/**
 * GET /api/analytics
 * Get absence analytics with optional filters
 * 
 * Query params:
 * - year: number (default: current year)
 * - month: number (1-12, optional)
 * - department: string (optional)
 * - cached: boolean (default: true)
 */
export async function GET(request: NextRequest) {
  try {
    // 🔒 Security: Only managers and admins can see analytics
    const { dbUser } = await requireRole(['manager', 'admin']);

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const monthParam = searchParams.get('month');
    const month = monthParam ? parseInt(monthParam) : undefined;
    const department = searchParams.get('department') || undefined;
    const useCached = searchParams.get('cached') !== 'false';

    const query: AnalyticsQuery = { year, month, department };

    // 🔒 Security: Managers can only see their own team's analytics (unless filtering by department)
    if (dbUser.role === 'manager') {
      // If manager tries to view a department, we should check if they are allowed (e.g. head of department)
      // For now, we restrict managers to their direct reports if no department is specified
      // If department is specified, we might want to restrict it too, but let's assume for now managers see their team stats

      // Simplification: Managers always see their team stats unless they are admins
      // If we want to allow managers to see department stats, we need more complex logic
      // For this iteration, we enforce managerId filter for managers
      query.managerId = dbUser.entraId;

      // If department is requested, we might want to block it or allow it if it matches their department
      if (department && dbUser.department !== department) {
        // Optional: Block access to other departments
        // return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const analytics = useCached
      ? await getCachedAnalytics(query)
      : await calculateAnalytics(query);

    return NextResponse.json({ analytics });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}