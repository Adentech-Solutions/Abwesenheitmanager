// ========================================
// FILE: src/app/api/analytics/sick-trends/route.ts
// Sick Leave Trends API
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/rbac';
import { getSickLeaveTrends } from '@/lib/services/analyticsService';

/**
 * GET /api/analytics/sick-trends
 * Get sick leave trends over time
 * 
 * Query params:
 * - year: number (default: current year)
 * - months: number (default: 12, how many months back)
 */
export async function GET(request: NextRequest) {
  try {
    // 🔒 Security: Only managers and admins can see sick trends
    await requireRole(['manager', 'admin']);

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const months = parseInt(searchParams.get('months') || '12');

    const trends = await getSickLeaveTrends(year, months);

    return NextResponse.json({ trends });
  } catch (error) {
    console.error('Error fetching sick leave trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sick leave trends' },
      { status: 500 }
    );
  }
}