import { NextRequest, NextResponse } from 'next/server';
import { getGermanHolidays, GermanState } from '@/lib/utils/holidays';
import { requireRole } from '@/lib/rbac';

export async function GET(request: NextRequest) {
    try {
        // 🔒 Security: Require authentication to view holidays
        await requireRole(['employee', 'manager', 'admin']);

        const { searchParams } = new URL(request.url);
        const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
        const state = searchParams.get('state') as GermanState | undefined;

        const holidays = getGermanHolidays(year, state);

        return NextResponse.json({ holidays });
    } catch (error: any) {
        console.error('Error fetching holidays:', error);
        if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to fetch holidays' }, { status: 500 });
    }
}
