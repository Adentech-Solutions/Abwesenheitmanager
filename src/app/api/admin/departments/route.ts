import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Department from '@/models/Department';
import { requireRole } from '@/lib/rbac';

const VALID_BUNDESLAND = ['BW','BY','BE','BB','HB','HH','HE','MV','NI','NW','RP','SL','SN','ST','SH','TH'];

export async function GET(request: NextRequest) {
    try {
        await requireRole(['admin']);
        await connectDB();

        const { searchParams } = new URL(request.url);
        const activeFilter = searchParams.get('active');

        const query: any = {};
        if (activeFilter === 'true') query.isActive = true;
        else if (activeFilter === 'false') query.isActive = false;

        const departments = await Department.find(query)
            .sort({ name: 1 })
            .lean();

        // Count for stats can be done on the fly, but model has memberCount
        return NextResponse.json({ departments });
    } catch (error: any) {
        console.error('Error fetching departments (Admin):', error);
        if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await requireRole(['admin']);
        await connectDB();

        const body = await request.json();

        // Validation
        if (!body.name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }
        if (!body.bundesland || !VALID_BUNDESLAND.includes(body.bundesland)) {
            return NextResponse.json({ error: 'Valid Bundesland is required' }, { status: 400 });
        }

        const existingDept = await Department.findOne({ name: body.name });
        if (existingDept) {
            return NextResponse.json({ error: 'Department with this name already exists' }, { status: 409 });
        }

        const newDept = await Department.create({
            name: body.name,
            bundesland: body.bundesland,
            managerId: body.managerId,
            managerName: body.managerName,
            isActive: true,
            memberCount: 0,
            syncSource: 'manual'
        });

        return NextResponse.json({ department: newDept }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating department (Admin):', error);
        if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to create department' }, { status: 500 });
    }
}
