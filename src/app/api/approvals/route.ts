import { NextRequest, NextResponse } from 'next/server';
import { requireRole, getTeamMemberEmails, getDepartmentMemberEmails } from '@/lib/rbac';
import connectDB from '@/lib/mongodb';
import Absence from '@/models/Absence';

export async function GET(request: NextRequest) {
  try {
    // 🔒 Security: Require active approver roles
    const { dbUser } = await requireRole(['manager', 'teamlead', 'hr_manager', 'admin']);

    await connectDB();

    let query: any = { status: 'pending' };

    if (dbUser.role === 'manager') {
      const teamEmails = await getTeamMemberEmails(dbUser.entraId);
      query.userEmail = { $in: teamEmails };
    } else if (dbUser.role === 'teamlead') {
      // Teamleads see pending approvals from their department
      const deptEmails = await getDepartmentMemberEmails(dbUser.department);
      query.userEmail = { $in: deptEmails };
    } else if (dbUser.role === 'hr_manager') {
      // HR managers see ALL pending approvals
      // No filter needed — show everything
    }
    // Admin also sees all requests

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