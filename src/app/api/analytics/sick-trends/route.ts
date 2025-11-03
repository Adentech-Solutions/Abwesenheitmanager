// ========================================
// FILE: src/app/api/analytics/sick-trends/route.ts
// Sick Leave Trends API
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ CHECK: Only managers and admins can see sick trends
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