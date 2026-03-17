import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Absence from '@/models/Absence';
import User from '@/models/User';
import { sendApprovalResultNotification } from '@/lib/teams-bot';
import { formatAbsenceType } from '@/lib/utils/format';
import { auditLog } from '@/lib/middleware/audit';
import { requireRole } from '@/lib/rbac';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 🔒 Security: Require Manager, HR Manager, or Admin role
    const { user: sessionUser, dbUser: manager } = await requireRole(['manager', 'teamlead', 'hr_manager', 'admin']);

    await connectDB();

    const body = await request.json();
    const { reason } = body;

    const absence = await Absence.findById(params.id);
    if (!absence) {
      return NextResponse.json({ error: 'Absence not found' }, { status: 404 });
    }

    if (absence.status !== 'pending') {
      return NextResponse.json({ error: 'Absence already processed' }, { status: 400 });
    }

    // 🔒 Security: Managers can only reject their own direct reports' requests (or TeamLeads within their department)
    if (manager.role === 'manager' || manager.role === 'teamlead') {
      const absenceOwner = await User.findOne({ email: absence.userEmail });
      
      if (absenceOwner?.managerId !== manager.entraId) {
        if (manager.role === 'teamlead') {
          if (absenceOwner?.department !== manager.department) {
            return NextResponse.json({ error: 'Forbidden: Team leads can only reject within their department' }, { status: 403 });
          }
        } else {
          return NextResponse.json({ error: 'Forbidden: Not the manager of this employee' }, { status: 403 });
        }
      }
    }
    // hr_manager and admin can reject anyone — no additional check needed

    // Reject absence
    await absence.reject(manager.entraId, manager.email, reason || 'Keine Begründung angegeben');

    // Audit Log
    await auditLog(
      manager.entraId,
      manager.email,
      'rejected',
      'absence',
      params.id,
      [{ field: 'status', oldValue: 'pending', newValue: 'rejected' }],
      request
    );

    // Notify employee via Teams
    try {
      await sendApprovalResultNotification(
        manager.entraId,
        absence.userId,
        'rejected',
        {
          type: formatAbsenceType(absence.type),
          startDate: new Date(absence.startDate).toLocaleDateString('de-DE'),
          endDate: new Date(absence.endDate).toLocaleDateString('de-DE'),
          reason: reason || 'Keine Begründung angegeben',
        }
      );
    } catch (error) {
      console.error('Error sending Teams notification to employee:', error);
    }

    return NextResponse.json({ absence, message: 'Absence rejected' });
  } catch (error: any) {
    console.error('Error rejecting absence:', error);
    if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to reject absence' }, { status: 500 });
  }
}