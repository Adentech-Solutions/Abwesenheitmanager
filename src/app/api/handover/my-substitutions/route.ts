import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Absence from '@/models/Absence';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        await connectDB();

        const now = new Date();

        // Find absences where the current user is the substitute
        const substitutions = await Absence.find({
            'substitute.userId': session.user.id,
            'handover.enabled': true,
        }).sort({ startDate: 1 }).lean();

        // Separate active vs past ones
        const active = substitutions.filter(sub => {
            const end = new Date(sub.endDate);
            end.setHours(23, 59, 59, 999);
            return sub.status === 'approved' && end >= now;
        });

        const history = substitutions.filter(sub => {
            const end = new Date(sub.endDate);
            end.setHours(23, 59, 59, 999);
            return sub.status === 'approved' && end < now;
        });

        return NextResponse.json({
            active,
            history
        });

    } catch (error) {
        console.error('Error fetching substitutions:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
