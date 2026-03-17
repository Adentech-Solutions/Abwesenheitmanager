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
    const { dbUser } = await requireRole(['manager', 'hr_manager', 'admin']);

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const monthParam = searchParams.get('month');
    const month = monthParam ? parseInt(monthParam) : undefined;
    const department = searchParams.get('department') || undefined;
    const useCached = searchParams.get('cached') !== 'false';

    const query: AnalyticsQuery = { year, month, department };

    // 🔒 Security: Managers can only see their own team's analytics
    if (dbUser.role === 'manager') {
      // Limit to direct reports by default
      query.managerId = dbUser.entraId;

      // If a specific department is requested, verify the manager belongs to it
      if (department && dbUser.department !== department) {
        return NextResponse.json(
          { error: 'Forbidden: Managers can only view their own department' },
          { status: 403 }
        );
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