import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Absence from '@/models/Absence';

// GET /api/absences/[id] - Get single absence
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const absence = await Absence.findById(params.id);
    if (!absence) {
      return NextResponse.json({ error: 'Absence not found' }, { status: 404 });
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const absence = await Absence.findById(params.id);

    if (!absence) {
      return NextResponse.json({ error: 'Absence not found' }, { status: 404 });
    }

    // Only allow updates to pending absences by the owner
    if (absence.status !== 'pending' || absence.userEmail !== session.user.email) {
      return NextResponse.json({ error: 'Cannot update this absence' }, { status: 403 });
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const absence = await Absence.findById(params.id);
    if (!absence) {
      return NextResponse.json({ error: 'Absence not found' }, { status: 404 });
    }

    // Only allow cancellation by owner
    if (absence.userEmail !== session.user.email) {
      return NextResponse.json({ error: 'Cannot delete this absence' }, { status: 403 });
    }

    absence.status = 'cancelled';
    await absence.save();

    return NextResponse.json({ message: 'Absence cancelled' });
  } catch (error) {
    console.error('Error deleting absence:', error);
    return NextResponse.json({ error: 'Failed to delete absence' }, { status: 500 });
  }
}