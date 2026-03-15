import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/rbac';
import { fetchEntraGroupsPreview } from '@/lib/services/entraGroupSync';

export async function GET(request: NextRequest) {
    try {
        await requireRole(['admin']);
        
        const groups = await fetchEntraGroupsPreview();

        return NextResponse.json({ groups });
    } catch (error: any) {
        console.error('Error fetching Entra groups preview (Admin):', error);
        if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to fetch Entra groups preview' }, { status: 500 });
    }
}
