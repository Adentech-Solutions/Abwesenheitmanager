import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/rbac';
import connectDB from '@/lib/mongodb';
import Absence from '@/models/Absence';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { absenceId: string } }
) {
    try {
        const { dbUser } = await requireRole(['employee', 'manager', 'admin']);

        await connectDB();
        const absence = await Absence.findById(params.absenceId).lean();

        if (!absence) {
            return new NextResponse('Absence not found', { status: 404 });
        }

        // Only allow access if user is the employee, substitute, manager, or an admin
        const isEmployee = absence.userId === dbUser.entraId;
        const isSubstitute = absence.substitute?.userId === dbUser.entraId;
        const isAdmin = dbUser.role === 'admin' || dbUser.role === 'manager';

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
