import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/rbac';
import connectDB from '@/lib/mongodb';
import IntegrationConfig from '@/models/IntegrationConfig';

export async function POST(request: NextRequest) {
    try {
        const { dbUser } = await requireRole(['admin']);
        await connectDB();

        const body = await request.json();
        const { clientId, clientSecret } = body;

        if (!clientId || !clientSecret) {
            return NextResponse.json({ error: 'Client ID and Client Secret are required' }, { status: 400 });
        }

        // This static method safely encrypts the clientSecret utilizing AES-256-GCM.
        await IntegrationConfig.setCredentials('personio', clientId, clientSecret, dbUser.email);

        // Auto-enable after storing keys
        await IntegrationConfig.findOneAndUpdate(
            { provider: 'personio' },
            { $set: { isEnabled: true } }
        );

        return NextResponse.json({ success: true, message: 'Personio credentials saved securely' });
    } catch (error: any) {
        console.error('Error saving Personio credentials:', error);
        if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to save credentials' }, { status: 500 });
    }
}
