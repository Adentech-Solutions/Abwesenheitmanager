import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Absence from '@/models/Absence';
import User from '@/models/User';
import { sendApprovalResultNotification } from '@/lib/teams-bot';
import { formatAbsenceType } from '@/lib/utils/format';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('❌ POST /api/approvals/[id]/reject - START');
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { reason } = body;

    const manager = await User.findOne({ email: session.user.email });
    if (!manager) {
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
    }

    console.log('❌ Manager:', manager.email);

    const absence = await Absence.findById(params.id);
    if (!absence) {
      return NextResponse.json({ error: 'Absence not found' }, { status: 404 });
    }

    if (absence.status !== 'pending') {
      return NextResponse.json({ error: 'Absence already processed' }, { status: 400 });
    }

    console.log('❌ Rejecting absence for:', absence.userEmail);

    // Reject absence
    await absence.reject(manager.entraId, manager.email, reason || 'Keine Begründung angegeben');
    console.log('❌ Absence rejected in DB');

    // Notify employee via Teams
    try {
      console.log('💬 Sending Teams notification to employee...');
      await sendApprovalResultNotification(
        manager.entraId,  // ← VON: Manager (der abgelehnt hat)
        absence.userId,   // ← AN: Employee (der den Antrag gestellt hat)
        'rejected',
        {
          type: formatAbsenceType(absence.type),
          startDate: new Date(absence.startDate).toLocaleDateString('de-DE'),
          endDate: new Date(absence.endDate).toLocaleDateString('de-DE'),
          reason: reason || 'Keine Begründung angegeben',
        }
      );
      console.log('✅ Teams notification sent to employee');
    } catch (error) {
      console.error('❌ Error sending notification:', error);
    }

    console.log('❌ POST /api/approvals/[id]/reject - SUCCESS');

    return NextResponse.json({ absence, message: 'Absence rejected' });
  } catch (error) {
    console.error('❌ Error rejecting absence:', error);
    return NextResponse.json({ error: 'Failed to reject absence' }, { status: 500 });
  }
}