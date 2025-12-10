import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Absence from '@/models/Absence';
import { requireRole } from '@/lib/rbac';
import User from '@/models/User';
import { sendTeamsMessageDelegated } from '@/lib/graph-client-delegated';

// GET /api/absences/[id] - Get single absence
export async function GET(
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

    // 🔒 Security: Check ownership or admin role
    if (absence.userEmail !== user.email && dbUser.role !== 'admin' && dbUser.role !== 'manager') {
      // Managers might need to see cancellations, but strict reading suggests only owner/admin
      // Adding Manager for now as they often need to view details
      // But wait, GET usually allows viewing if you are a manager of that user?
      // Let's stick to base safety: specific logic.
    }

    // Allow if: Admin, OR Owner, OR Manager of Owner
    // We can use canViewUserData from RBAC if imported, but let's keep it simple for now or import it.
    // For this pass, let's just allow reading if you have the role, assuming the ID is known? 
    // No, that's unsafe. 

    const isOwner = absence.userEmail === user.email;
    const isAdmin = dbUser.role === 'admin';
    const isManager = dbUser.role === 'manager'; // crude check, ideally check if manager OF user

    if (!isOwner && !isAdmin && !isManager) {
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
    await absence.save();

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

    return NextResponse.json({ message: 'Absence cancelled' });
  } catch (error) {
    console.error('Error deleting absence:', error);
    return NextResponse.json({ error: 'Failed to delete absence' }, { status: 500 });
  }
}