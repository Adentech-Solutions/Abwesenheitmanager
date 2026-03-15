import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SyncLog from '@/models/SyncLog';
import { requireRole } from '@/lib/rbac';
import { syncEntraGroups } from '@/lib/services/entraGroupSync';

export async function POST(request: NextRequest) {
    try {
        const { dbUser } = await requireRole(['admin']);
        await connectDB();

        const body = await request.json();
        const { type } = body;

        if (type === 'entra_groups') {
            const syncLog = await syncEntraGroups('admin', dbUser.email);
            return NextResponse.json(syncLog, { status: 200 });
        } else if (type === 'entra_users') {
            return NextResponse.json({ message: 'Not yet implemented' }, { status: 501 });
        } else {
            return NextResponse.json({ error: 'Invalid sync type' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('Error triggering sync (Admin):', error);
        if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to trigger sync' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        await requireRole(['admin']);
        await connectDB();

        // Find the most recent SyncLog for each syncType
        const syncTypes = ['entra_groups', 'entra_users', 'personio_vacation'];
        const lastSyncs: any = {};

        for (const type of syncTypes) {
            const lastLog = await SyncLog.findOne({ syncType: type })
                .sort({ startedAt: -1 })
                .lean();
            lastSyncs[type] = lastLog || null;
        }

        return NextResponse.json({ lastSyncs });
    } catch (error: any) {
        console.error('Error fetching latest sync statuses (Admin):', error);
        if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to fetch latest sync statuses' }, { status: 500 });
    }
}
