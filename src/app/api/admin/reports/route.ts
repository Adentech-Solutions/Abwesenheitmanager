import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/rbac';
import connectDB from '@/lib/mongodb';
import Absence from '@/models/Absence';
import User from '@/models/User';
import { startOfYear, endOfYear, format } from 'date-fns';

export async function GET(request: NextRequest) {
    try {
        // 🔒 Security: Only admins can generate reports
        await requireRole(['admin']);
        await connectDB();

        const { searchParams } = new URL(request.url);
        const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
        const type = searchParams.get('type') || 'annual_leave';

        const startDate = startOfYear(new Date(year, 0));
        const endDate = endOfYear(new Date(year, 0));

        let data: any[] = [];
        let filename = `report_${type}_${year}.csv`;
        let headers = '';

        if (type === 'annual_leave') {
            // Annual Leave Report: User, Department, Total Vacation Days, Used, Remaining
            const users = await User.find({ isActive: true });
            headers = 'Name,Email,Department,Total Vacation Days,Used Days,Remaining Days\n';

            data = users.map(user => {
                const total = user.vacationDays?.total || 30;
                const used = user.vacationDays?.used || 0;
                const remaining = total - used;
                return `${user.name},${user.email},${user.department || '-'},${total},${used},${remaining}`;
            });

        } else if (type === 'sick_leave') {
            // Sick Leave Report: User, Department, Sick Days Count
            const absences = await Absence.find({
                type: 'sick',
                startDate: { $gte: startDate },
                endDate: { $lte: endDate },
                status: 'approved'
            });

            // Aggregate by user
            const userStats = new Map<string, { name: string, email: string, days: number }>();

            for (const absence of absences) {
                const current = userStats.get(absence.userEmail) || {
                    name: absence.userName,
                    email: absence.userEmail,
                    days: 0
                };
                current.days += absence.totalDays;
                userStats.set(absence.userEmail, current);
            }

            headers = 'Name,Email,Sick Days\n';
            data = Array.from(userStats.values()).map(stat =>
                `${stat.name},${stat.email},${stat.days}`
            );
        }

        const csvContent = headers + data.join('\n');

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });

    } catch (error: any) {
        console.error('Error generating report:', error);
        if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}
