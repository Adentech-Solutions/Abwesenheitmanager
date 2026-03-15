import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/rbac';
import connectDB from '@/lib/mongodb';
import Absence from '@/models/Absence';

export const dynamic = 'force-dynamic';

export async function PATCH(
    request: Request,
    { params }: { params: { absenceId: string, itemId: string } }
) {
    try {
        const { dbUser } = await requireRole(['employee', 'manager', 'admin']);

        await connectDB();
        const absence = await Absence.findById(params.absenceId);
        if (!absence || !absence.handover) {
            return new NextResponse('Absence or handover not found', { status: 404 });
        }

        // Only substitute or admin can mark done
        const isSubstitute = absence.substitute?.userId === dbUser.entraId;
        const isAdmin = dbUser.role === 'admin' || dbUser.role === 'manager';
        if (!isSubstitute && !isAdmin) {
            return new NextResponse('Forbidden: Only the substitute can update tasks', { status: 403 });
        }

        const item = absence.handover.items.find((i: any) => i.id === params.itemId);
        if (!item) {
            return new NextResponse('Item not found', { status: 404 });
        }

        const body = await request.json();

        if (body.status === 'done') {
            item.status = 'done';
            item.completedAt = new Date();
        } else if (body.status === 'open') {
            item.status = 'open';
            item.completedAt = undefined;
        }

        absence.markModified('handover.items');
        await absence.save();

        return NextResponse.json(item);
    } catch (error) {
        console.error('Error updating item:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
