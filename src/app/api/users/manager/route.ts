import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/rbac';
import { getUserManager } from '@/lib/graph-client';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    // 🔒 Security: Any authenticated user can look up their own manager
    const { dbUser } = await requireRole(['employee', 'manager', 'admin']);

    await connectDB();

    // Get manager from Entra ID
    const manager = await getUserManager(dbUser.entraId);

    if (!manager) {
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
    }

    // Update user's manager info if changed
    if (dbUser.managerId !== manager.id || dbUser.managerEmail !== manager.mail) {
      // requireRole returns IUser (plain type) — fetch the Mongoose doc to call .save()
      const userDoc = await User.findOne({ email: dbUser.email });
      if (userDoc) {
        userDoc.managerId = manager.id;
        userDoc.managerEmail = manager.mail;
        await userDoc.save();
      }
    }

    return NextResponse.json({ manager });
  } catch (error) {
    console.error('Error fetching manager:', error);
    return NextResponse.json({ error: 'Failed to fetch manager' }, { status: 500 });
  }
}