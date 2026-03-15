import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/rbac';
import { setAutomaticReplies } from '@/lib/graph-client';
import connectDB from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    // 🔒 Security: Any authenticated user can set their own auto-reply
    const { dbUser } = await requireRole(['employee', 'manager', 'admin']);

    await connectDB();

    const body = await request.json();
    await setAutomaticReplies(dbUser.entraId, body);

    return NextResponse.json({ message: 'Auto-reply set successfully' });
  } catch (error) {
    console.error('Error setting auto-reply:', error);
    return NextResponse.json({ error: 'Failed to set auto-reply' }, { status: 500 });
  }
}