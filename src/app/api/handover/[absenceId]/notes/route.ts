import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/rbac';
import connectDB from '@/lib/mongodb';
import Absence from '@/models/Absence';

export const dynamic = 'force-dynamic';

export async function POST(
    request: Request,
    { params }: { params: { absenceId: string } }
) {
    try {
        const { dbUser } = await requireRole(['employee', 'manager', 'admin']);

        await connectDB();
        const absence = await Absence.findById(params.absenceId);
        if (!absence || !absence.handover) {
            return new NextResponse('Absence or handover not found', { status: 404 });
        }

        // Only substitute or admin can add notes
        const isSubstitute = absence.substitute?.userId === dbUser.entraId;
        const isAdmin = dbUser.role === 'admin' || dbUser.role === 'manager';
        if (!isSubstitute && !isAdmin) {
            return new NextResponse('Forbidden: Only the substitute can add notes', { status: 403 });
        }

        const body = await request.json();
        if (!body.content?.trim()) {
            return new NextResponse('Note content is required', { status: 400 });
        }

        const newNote = {
            id: crypto.randomUUID(),
            content: body.content.trim(),
            createdAt: new Date(),
            createdBy: dbUser.entraId,
            createdByName: dbUser.name || 'Unbekannt',
        };

        if (!absence.handover.activityNotes) {
            absence.handover.activityNotes = [];
        }
        absence.handover.activityNotes.push(newNote);
        absence.markModified('handover.activityNotes');

        await absence.save();

        return NextResponse.json(newNote);
    } catch (error) {
        console.error('Error adding note:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
