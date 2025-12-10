import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireRole } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    // 🔒 Security: Only Admin and Manager can list users
    // Regular employees should NOT be able to see the full user list
    const { user, dbUser } = await requireRole(['admin', 'manager']);

    await connectDB();

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    const query: any = { isActive: true };
    if (role) query.role = role;

    const users = await User.find(query).select('-__v').sort({ name: 1 });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}