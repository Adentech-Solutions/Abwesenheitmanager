import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/rbac';
import { getEntraUsers } from '@/lib/graph-client';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin']);
    await connectDB();

    const entraUsers = await getEntraUsers();
    
    const users = await Promise.all(entraUsers.map(async (u: any) => {
      const email = u.mail ? u.mail.toLowerCase() : '';
      const localUser = email ? await User.findOne({ email }) : null;
      return {
        entraId: u.id,
        name: u.displayName,
        email: u.mail,
        department: u.department,
        jobTitle: u.jobTitle,
        existsLocally: !!localUser
      };
    }));

    // Filter out any users somehow missing emails, even though getEntraUsers should filter them
    const validUsers = users.filter((u: any) => u.email);

    return NextResponse.json({ users: validUsers });
  } catch (error: any) {
    console.error('Error fetching Entra users preview:', error);
    if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to fetch Entra preview' }, { status: 500 });
  }
}
