import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SyncLog from '@/models/SyncLog';
import { requireRole } from '@/lib/rbac';

export async function GET(request: NextRequest) {
    try {
        await requireRole(['admin']);
        await connectDB();

        const { searchParams } = new URL(request.url);
        const typeFilter = searchParams.get('type');

        const query: any = {};
        if (typeFilter) {
            query.syncType = typeFilter;
        }

        const history = await SyncLog.find(query)
            .sort({ startedAt: -1 })
            .limit(20)
            .lean();

        return NextResponse.json({ history });
    } catch (error: any) {
        console.error('Error fetching sync history (Admin):', error);
        if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to fetch sync history' }, { status: 500 });
    }
}
