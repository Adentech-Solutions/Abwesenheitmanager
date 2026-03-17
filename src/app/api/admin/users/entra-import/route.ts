import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/rbac';
import { getUserDirectReports, getUserManager } from '@/lib/graph-client';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin']);
    await connectDB();

    const body = await request.json();
    const { users } = body;

    if (!users || !Array.isArray(users)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const u of users) {
      if (!u.email) {
        skipped++;
        continue;
      }

      try {
        const existingUser = await User.findOne({ email: u.email.toLowerCase() });
        if (existingUser) {
          skipped++;
          continue;
        }

        const reports = await getUserDirectReports(u.entraId);
        const role = reports && reports.length > 0 ? 'manager' : 'employee';

        const manager = await getUserManager(u.entraId);
        const managerId = manager?.id;
        const managerEmail = manager?.mail;

        await User.create({
          entraId: u.entraId,
          email: u.email.toLowerCase(),
          name: u.name,
          department: u.department,
          jobTitle: u.jobTitle,
          managerId,
          managerEmail: managerEmail?.toLowerCase(),
          role,
          isActive: true,
          vacationDays: { total: 30, used: 0, remaining: 30, carryOver: 0, source: 'local' }
        });

        imported++;
      } catch (err) {
        console.error(`Error importing user ${u.email}:`, err);
        errors++;
      }
    }

    return NextResponse.json({ imported, skipped, errors });
  } catch (error: any) {
    console.error('Error importing Entra users:', error);
    if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to import users' }, { status: 500 });
  }
}
