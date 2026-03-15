import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/rbac';
import connectDB from '@/lib/mongodb';
import Absence from '@/models/Absence';
import User from '@/models/User';
import { getGraphUser } from '@/lib/graph-client';
import { sendWelcomeBackCard } from '@/lib/teams-bot';

export const dynamic = 'force-dynamic';

export async function POST(
    request: NextRequest,
    { params }: { params: { absenceId: string } }
) {
    try {
        const { dbUser } = await requireRole(['employee', 'manager', 'admin']);

        const body = await request.json();
        const summary = body.summary;

        if (!summary?.trim()) return new NextResponse('Missing summary', { status: 400 });

        await connectDB();
        const absence = await Absence.findById(params.absenceId);
        if (!absence || !absence.handover) return new NextResponse('Not found', { status: 404 });

        const isSubstitute = absence.substitute?.userId === dbUser.entraId;
        const isAdmin = dbUser.role === 'admin' || dbUser.role === 'manager';
        if (!isSubstitute && !isAdmin) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        // Save Summary
        absence.handover.returnSummary = {
            content: summary.trim(),
            createdAt: new Date(),
            createdBy: dbUser.entraId,
        };
        absence.markModified('handover.returnSummary');
        await absence.save();

        // Send Welcome Back Card
        const employeeUser = await User.findOne({ email: absence.userEmail });
        let employeeEntraId = employeeUser?.entraId;

        if (!employeeEntraId) {
            try {
                const graphUser = await getGraphUser(absence.userEmail);
                if (graphUser?.id) employeeEntraId = graphUser.id;
            } catch (e) { }
        }

        if (employeeEntraId) {
            const substituteName = absence.substitute?.name || 'Ihre Vertretung';
            await sendWelcomeBackCard(employeeEntraId, {
                employeeName: absence.userName,
                substituteName: substituteName,
                summary: summary.trim()
            });
        }

        return NextResponse.json({ success: true });

    } catch (e) {
        console.error('Error in auth return summary:', e);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
