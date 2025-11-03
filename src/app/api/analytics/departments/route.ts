// ========================================
// FILE: src/app/api/analytics/departments/route.ts
// Department Statistics API
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ CHECK: Only managers and admins can see department analytics
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