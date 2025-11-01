import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserManager } from '@/lib/graph-client';
import connectDB from '@/lib/mongodb';
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

    // Get manager from Entra ID
    const manager = await getUserManager(user.entraId);

    if (!manager) {
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
    }

    // Update user's manager info if changed
    if (user.managerId !== manager.id || user.managerEmail !== manager.mail) {
      user.managerId = manager.id;
      user.managerEmail = manager.mail;
      await user.save();
    }

    return NextResponse.json({ manager });
  } catch (error) {
    console.error('Error fetching manager:', error);
    return NextResponse.json({ error: 'Failed to fetch manager' }, { status: 500 });
  }
}