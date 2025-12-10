import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Absence from '@/models/Absence';
import User from '@/models/User';
import { requireRole } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    // 🔒 Security: RBAC check
    const { user, dbUser } = await requireRole(['employee', 'manager', 'admin']);

    await connectDB();

    // Use dbUser from requireRole instead of refetching
    // const user = await User.findOne({ email: session.user.email }); // Removed redundant fetch

    // Get stats
    const totalAbsences = await Absence.countDocuments({ userEmail: user.email });
    const pendingAbsences = await Absence.countDocuments({
      userEmail: user.email,
      status: 'pending'
    });
    const approvedAbsences = await Absence.countDocuments({
      userEmail: user.email,
      status: 'approved'
    });

    // Get upcoming absences
    const upcomingAbsences = await Absence.find({
      userEmail: user.email,
      status: 'approved',
      startDate: { $gte: new Date() },
    })
      .sort({ startDate: 1 })
      .limit(5);

    return NextResponse.json({
      stats: {
        total: totalAbsences,
        pending: pendingAbsences,
        approved: approvedAbsences,
        vacationDays: user.vacationDays,
      },
      upcomingAbsences,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}