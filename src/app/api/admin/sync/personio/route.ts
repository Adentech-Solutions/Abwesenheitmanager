import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/rbac';
import connectDB from '@/lib/mongodb';
import { syncPersonioEmployees } from '@/lib/services/personioSync';
import SyncLog from '@/models/SyncLog';

export async function POST(request: NextRequest) {
    try {
        const { dbUser } = await requireRole(['admin']);
        await connectDB();

        const result = await syncPersonioEmployees('admin', dbUser.email);
        
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error syncing Personio employees:', error);
        if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to trigger employee sync' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        await requireRole(['admin']);
        await connectDB();

        const lastLog = await SyncLog.findOne({ syncType: 'personio_employees' })
            .sort({ startedAt: -1 })
            .lean();

        return NextResponse.json({ lastSync: lastLog || null });
    } catch (error: any) {
        console.error('Error fetching latest Personio sync status:', error);
        if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to fetch latest status' }, { status: 500 });
    }
}
