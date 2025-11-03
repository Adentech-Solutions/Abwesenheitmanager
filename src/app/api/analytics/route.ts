// ========================================
// FILE: src/app/api/analytics/route.ts
// Analytics API Endpoints
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  calculateAnalytics,
  getAnalyticsByDepartment,
  getSickLeaveTrends,
  getCachedAnalytics,
} from '@/lib/services/analyticsService';

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
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ CHECK: Only managers and admins can see analytics
    const { default: connectDB } = await import('@/lib/mongodb');
    const { default: User } = await import('@/models/User');
    await connectDB();
    
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser || (currentUser.role !== 'manager' && currentUser.role !== 'admin')) {
      return NextResponse.json({ 
        error: 'Forbidden - Only managers and admins can access analytics' 
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const monthParam = searchParams.get('month');
    const month = monthParam ? parseInt(monthParam) : undefined;
    const department = searchParams.get('department') || undefined;
    const useCached = searchParams.get('cached') !== 'false';

    const query = { year, month, department };

    const analytics = useCached
      ? await getCachedAnalytics(query)
      : await calculateAnalytics(query);

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}