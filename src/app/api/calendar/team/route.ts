import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Absence from '@/models/Absence';
import User from '@/models/User';
import { requireRole, getTeamMemberEmails } from '@/lib/rbac';

export async function GET(request: NextRequest) {
    try {
        const { user, dbUser } = await requireRole(['employee', 'manager', 'admin']);
        await connectDB();

        const { searchParams } = new URL(request.url);
        const start = searchParams.get('startDate');
        const end = searchParams.get('endDate');
        const department = searchParams.get('department');

        if (!start || !end) {
            return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
        }

        const startDate = new Date(start);
        const endDate = new Date(end);

        // Global Overview Logic: Everyone can see all approved absences
        // If department is specified, filter by that department.

        let targetEmails: string[] | null = null;

        if (department && department !== 'all') {
            const userQuery: any = { isActive: true, department: department };
            const users = await User.find(userQuery).select('email');
            targetEmails = users.map(u => u.email);
        }

        // Query Absences
        const query: any = {
            status: 'approved',
            $or: [
                { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
            ]
        };

        if (targetEmails) {
            query.userEmail = { $in: targetEmails };
        }

        const absences = await Absence.find(query).select('userName userEmail userId startDate endDate type isHalfDay halfDayPeriod totalDays status');

        return NextResponse.json({
            absences: absences.map(a => ({
                _id: a._id,
                userId: a.userId,
                userEmail: a.userEmail,
                userName: a.userName,
                type: a.type,
                startDate: a.startDate,
                endDate: a.endDate,
                totalDays: a.totalDays,
                status: a.status
            }))
        });

    } catch (error) {
        console.error('Error fetching team calendar:', error);
        return NextResponse.json({ error: 'Failed to fetch team calendar' }, { status: 500 });
    }
}
