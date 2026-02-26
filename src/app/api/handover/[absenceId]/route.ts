import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Absence from '@/models/Absence';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { absenceId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        await connectDB();
        const absence = await Absence.findById(params.absenceId).lean();

        if (!absence) {
            return new NextResponse('Absence not found', { status: 404 });
        }

        // Only allow access if user is the employee, substitute, manager, or an admin
        const isEmployee = absence.userId === session.user.id;
        const isSubstitute = absence.substitute?.userId === session.user.id;
        // In reality we should check for manager role or if session user is manager of the employee
        const userRole = (session.user as any).role;
        const isAdmin = userRole === 'admin' || userRole === 'manager';

        if (!isEmployee && !isSubstitute && !isAdmin) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        if (!absence.handover) {
            return new NextResponse('No handover data found for this absence', { status: 404 });
        }

        return NextResponse.json({
            ...absence.handover,
            absenceDetails: {
                id: absence._id,
                employeeName: absence.userName,
                startDate: absence.startDate,
                endDate: absence.endDate,
                substituteName: absence.substitute?.name,
                isSubstitutedByMe: isSubstitute,
                isMyAbsence: isEmployee,
            }
        });

    } catch (error) {
        console.error('Error fetching handover:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
