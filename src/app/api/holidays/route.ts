import { NextRequest, NextResponse } from 'next/server';
import { getGermanHolidays, GermanState } from '@/lib/utils/holidays';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
        const state = searchParams.get('state') as GermanState | undefined;

        const holidays = getGermanHolidays(year, state);

        return NextResponse.json({ holidays });
    } catch (error) {
        console.error('Error fetching holidays:', error);
        return NextResponse.json({ error: 'Failed to fetch holidays' }, { status: 500 });
    }
}
