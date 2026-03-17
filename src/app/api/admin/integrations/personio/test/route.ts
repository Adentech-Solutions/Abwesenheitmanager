import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/rbac';
import { testConnection } from '@/lib/services/personioClient';

export async function POST(request: NextRequest) {
    try {
        await requireRole(['admin']);

        const body = await request.json();
        const { clientId, clientSecret } = body;

        if (!clientId || !clientSecret) {
            return NextResponse.json({ error: 'Client ID and Client Secret are required for testing' }, { status: 400 });
        }

        // Directly checks OAuth integrity over the generic API endpoints
        const result = await testConnection(clientId, clientSecret);

        if (result.success) {
            return NextResponse.json({ 
                success: true, 
                employeeCount: result.employeeCount, 
                absenceTypeCount: result.absenceTypeCount 
            });
        } else {
            return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }

    } catch (error: any) {
        console.error('Error testing Personio connection:', error);
        if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to test connection' }, { status: 500 });
    }
}
