// ========================================
// FILE: src/app/api/analytics/departments/route.ts
// Department Statistics API
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/rbac';
import { getAnalyticsByDepartment } from '@/lib/services/analyticsService';

/**
 * GET /api/analytics/departments
 * Get analytics grouped by department
 * 
 * Query params:
 * - year: number (required)
 * - month: number (optional, if omitted returns yearly stats)
 */
export async function GET(request: NextRequest) {
  try {
    // 🔒 Security: Only managers and admins can see department analytics
    await requireRole(['manager', 'admin']);

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const monthParam = searchParams.get('month');
    const month = monthParam ? parseInt(monthParam) : undefined;

    const stats = await getAnalyticsByDepartment(year, month);

    return NextResponse.json({ departments: stats });
  } catch (error) {
    console.error('Error fetching department analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch department analytics' },
      { status: 500 }
    );
  }
}