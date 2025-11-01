import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Absence from '@/models/Absence';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

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