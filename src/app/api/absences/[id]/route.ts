import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Absence from '@/models/Absence';
import { requireRole, canViewUserData } from '@/lib/rbac';
import User from '@/models/User';
import { sendTeamsMessageDelegated } from '@/lib/graph-client-delegated';

// GET /api/absences/[id] - Get single absence
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, dbUser } = await requireRole(['employee', 'teamlead', 'manager', 'hr_manager', 'admin']);

    await connectDB();

    const absence = await Absence.findById(params.id);
    if (!absence) {
      return NextResponse.json({ error: 'Absence not found' }, { status: 404 });
    }

    const canView = await canViewUserData(dbUser, absence.userId);
    if (!canView) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ absence });
  } catch (error) {
    console.error('Error fetching absence:', error);
    return NextResponse.json({ error: 'Failed to fetch absence' }, { status: 500 });
  }
}

// PUT /api/absences/[id] - Update absence
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, dbUser } = await requireRole(['employee', 'manager', 'admin']);

    await connectDB();

    const body = await request.json();
    const absence = await Absence.findById(params.id);

    if (!absence) {
      return NextResponse.json({ error: 'Absence not found' }, { status: 404 });
    }

    // Only allow updates to pending absences by the owner
    // 🔒 Security: Ownership & Status Check
    const isOwner = absence.userEmail === user.email;
    const isAdmin = dbUser.role === 'admin';

    // Admin can update anything, Owner can only update 'pending'
    if (!isAdmin) {
      if (!isOwner) {
        return NextResponse.json({ error: 'Forbidden: Not your absence' }, { status: 403 });
      }
      if (absence.status !== 'pending') {
        return NextResponse.json({ error: 'Cannot update non-pending absence' }, { status: 403 });
      }
    }

    Object.assign(absence, body);
    await absence.save();

    return NextResponse.json({ absence });
  } catch (error) {
    console.error('Error updating absence:', error);
    return NextResponse.json({ error: 'Failed to update absence' }, { status: 500 });
  }
}

// DELETE /api/absences/[id] - Delete/Cancel absence
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, dbUser } = await requireRole(['employee', 'manager', 'admin']);

    await connectDB();

    const absence = await Absence.findById(params.id);
    if (!absence) {
      return NextResponse.json({ error: 'Absence not found' }, { status: 404 });
    }

    // Only allow cancellation by owner
    // 🔒 Security: Admin or Owner
    const isOwner = absence.userEmail === user.email;
    const isAdmin = dbUser.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const wasApproved = absence.status === 'approved';

    absence.status = 'cancelled';
    
    // 1. Refund vacation days if it was previously approved
    if (wasApproved && absence.type === 'vacation') {
      const absenceOwner = await User.findOne({ email: absence.userEmail });
      if (absenceOwner) {
        // updateVacationBalance subtracts days if positive, so we pass negative
        await absenceOwner.updateVacationBalance(-absence.totalDays);
      }
    }

    // Notify Manager if an approved absence is cancelled
    if (wasApproved && user.email === absence.userEmail) { // If owner cancelled it
      try {
        const employee = await User.findOne({ email: user.email });
        if (employee && employee.managerId) {
          await sendTeamsMessageDelegated(
            employee.managerId,
            `<h3>ℹ️ Abwesenheit storniert</h3>
                      <p><strong>${absence.userName}</strong> hat den genehmigten Urlaub storniert.</p>
                      <p>Zeitraum: ${new Date(absence.startDate).toLocaleDateString('de-DE')} - ${new Date(absence.endDate).toLocaleDateString('de-DE')}</p>`
          );
        }
      } catch (e) {
        console.error('Failed to send cancellation notification', e);
      }
    }

    // Personio cancellation (if absence was synced)
    if (absence.personioAbsenceId) {
      try {
        const { cancelAbsenceInPersonio } = await import('@/lib/services/personioSync');
        await cancelAbsenceInPersonio(absence);
        
        // Unset the ID to ensure clean state after cancellation
        absence.personioAbsenceId = undefined;
      } catch (error) {
        console.error('Personio cancellation failed:', error);
      }
    }

    await absence.save();

    return NextResponse.json({ message: 'Absence cancelled' });
  } catch (error) {
    console.error('Error deleting absence:', error);
    return NextResponse.json({ error: 'Failed to delete absence' }, { status: 500 });
  }
}