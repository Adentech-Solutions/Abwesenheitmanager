import { NextRequest, NextResponse } from 'next/server';
import { requireRole, getTeamMemberEmails } from '@/lib/rbac';
import connectDB from '@/lib/mongodb';
import Absence from '@/models/Absence';

export async function GET(request: NextRequest) {
  try {
    // 🔒 Security: Require Manager or Admin role
    const { dbUser } = await requireRole(['manager', 'admin']);

    await connectDB();

    let query: any = { status: 'pending' };

    // 🔒 Security: Managers only see their team's requests
    if (dbUser.role === 'manager') {
      const teamEmails = await getTeamMemberEmails(dbUser.entraId);
      query.userEmail = { $in: teamEmails };
    }
    // Admins see all pending requests (no additional filter needed)

    const pendingApprovals = await Absence.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ absences: pendingApprovals });
  } catch (error: any) {
    console.error('Error fetching approvals:', error);
    if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to fetch approvals' }, { status: 500 });
  }
}