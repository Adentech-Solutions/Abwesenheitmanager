import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/rbac';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Absence from '@/models/Absence';

export async function GET(request: NextRequest) {
    try {
        // 🔒 Security: Only admins can view metrics
        await requireRole(['admin']);

        await connectDB();

        const [
            totalUsers,
            activeUsers,
            pendingAbsences,
            totalAbsences,
            usersWithManagerRole
        ] = await Promise.all([
            User.countDocuments({}),
            User.countDocuments({ isActive: true }),
            Absence.countDocuments({ status: 'pending' }),
            Absence.countDocuments({}),
            User.countDocuments({ role: 'manager' })
        ]);

        return NextResponse.json({
            totalUsers,
            activeUsers,
            pendingAbsences,
            totalAbsences,
            managerCount: usersWithManagerRole,
        });
    } catch (error: any) {
        console.error('Error fetching admin metrics:', error);
        if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
    }
}
