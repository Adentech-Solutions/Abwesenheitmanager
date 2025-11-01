import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { setAutomaticReplies } from '@/lib/graph-client';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    await setAutomaticReplies(user.entraId, body);

    return NextResponse.json({ message: 'Auto-reply set successfully' });
  } catch (error) {
    console.error('Error setting auto-reply:', error);
    return NextResponse.json({ error: 'Failed to set auto-reply' }, { status: 500 });
  }
}