import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Department from '@/models/Department';
import { requireRole } from '@/lib/rbac';

const VALID_BUNDESLAND = ['BW','BY','BE','BB','HB','HH','HE','MV','NI','NW','RP','SL','SN','ST','SH','TH'];

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await requireRole(['admin']);
        await connectDB();

        const department = await Department.findById(params.id).lean();

        if (!department) {
            return NextResponse.json({ error: 'Department not found' }, { status: 404 });
        }

        return NextResponse.json({ department });
    } catch (error: any) {
        console.error('Error fetching department details (Admin):', error);
        if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to fetch department details' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await requireRole(['admin']);
        await connectDB();

        const body = await request.json();

        if (body.bundesland && !VALID_BUNDESLAND.includes(body.bundesland)) {
            return NextResponse.json({ error: 'Invalid Bundesland' }, { status: 400 });
        }

        const updateData: any = {};
        if (body.name !== undefined) updateData.name = body.name;
        if (body.bundesland !== undefined) updateData.bundesland = body.bundesland;
        if (body.managerId !== undefined) updateData.managerId = body.managerId;
        if (body.managerName !== undefined) updateData.managerName = body.managerName;
        if (body.entraGroupId !== undefined) updateData.entraGroupId = body.entraGroupId;
        if (body.isActive !== undefined) updateData.isActive = body.isActive;

        const updated = await Department.findByIdAndUpdate(
            params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updated) {
            return NextResponse.json({ error: 'Department not found' }, { status: 404 });
        }

        return NextResponse.json({ department: updated });
    } catch (error: any) {
        console.error('Error updating department (Admin):', error);
        if (error.code === 11000) {
            return NextResponse.json({ error: 'A department with this name or Entra ID already exists' }, { status: 409 });
        }
        if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to update department' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await requireRole(['admin']);
        await connectDB();

        // Soft delete: set isActive to false
        const department = await Department.findByIdAndUpdate(
            params.id,
            { $set: { isActive: false } },
            { new: true }
        );

        if (!department) {
            return NextResponse.json({ error: 'Department not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Department deactivated successfully' });
    } catch (error: any) {
        console.error('Error disabling department (Admin):', error);
        if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to disable department' }, { status: 500 });
    }
}
