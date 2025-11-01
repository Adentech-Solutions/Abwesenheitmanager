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

    // Get current user
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('📋 Fetching approvals for manager:', currentUser.email);

    // Find all users where current user is manager
    const teamMembers = await User.find({ managerId: currentUser.entraId });
    const teamEmails = teamMembers.map((u) => u.email);

    console.log('👥 Team members:', teamMembers.length);
    console.log('📧 Team emails:', teamEmails);

    // Get pending absences for team members
    const pendingApprovals = await Absence.find({
      userEmail: { $in: teamEmails },
      status: 'pending',
    }).sort({ createdAt: -1 });

    console.log('📋 Found pending approvals:', pendingApprovals.length);

    // ⚠️ WICHTIG: Frontend erwartet "absences" nicht "approvals"
    return NextResponse.json({ absences: pendingApprovals });
  } catch (error) {
    console.error('Error fetching approvals:', error);
    return NextResponse.json({ error: 'Failed to fetch approvals' }, { status: 500 });
  }
}