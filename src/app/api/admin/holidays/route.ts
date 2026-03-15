import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/rbac';
import connectDB from '@/lib/mongodb';
import Holiday from '@/models/Holiday';

export async function GET(request: NextRequest) {
    try {
        // 🔒 Security: All authenticated users can read holidays (needed for absence/calendar calculations)
        await requireRole(['employee', 'manager', 'admin']);
        await connectDB();

        const { searchParams } = new URL(request.url);
        const year = searchParams.get('year');

        let query: any = {};
        if (year) {
            const startDate = new Date(`${year}-01-01`);
            const endDate = new Date(`${year}-12-31`);
            query.date = { $gte: startDate, $lte: endDate };
        }

        const holidays = await Holiday.find(query).sort({ date: 1 });
        return NextResponse.json({ holidays });
    } catch (error) {
        console.error('Error fetching holidays:', error);
        return NextResponse.json({ error: 'Failed to fetch holidays' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // 🔒 Security: Only admins can manage holidays
        await requireRole(['admin']);
        await connectDB();

        const body = await request.json();
        const holiday = await Holiday.create(body);

        return NextResponse.json({ holiday }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating holiday:', error);
        if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to create holiday' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        // 🔒 Security: Only admins can manage holidays
        await requireRole(['admin']);
        await connectDB();

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await Holiday.findByIdAndDelete(id);

        return NextResponse.json({ message: 'Holiday deleted' });
    } catch (error: any) {
        console.error('Error deleting holiday:', error);
        if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to delete holiday' }, { status: 500 });
    }
}
