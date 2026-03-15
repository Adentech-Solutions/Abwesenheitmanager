import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGraphUser } from '@/lib/graph-client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Not available' }, { status: 404 });
    }

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const graphUser = await getGraphUser(session.user.email);

        return NextResponse.json({
            sessionUser: session.user,
            graphData: graphUser
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
