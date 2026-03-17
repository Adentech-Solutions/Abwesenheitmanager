import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/rbac';
import connectDB from '@/lib/mongodb';
import IntegrationConfig from '@/models/IntegrationConfig';

export async function GET(request: NextRequest) {
    try {
        await requireRole(['admin']);
        await connectDB();

        const config = await IntegrationConfig.getConfig('personio');

        if (!config) {
            return NextResponse.json({
                configured: false,
                isEnabled: false,
            });
        }

        let clientIdMasked = null;
        if (config.credentials?.clientId && config.credentials.clientId.length > 8) {
            const id = config.credentials.clientId;
            clientIdMasked = `${id.slice(0, 4)}****${id.slice(-4)}`;
        } else if (config.credentials?.clientId) {
            clientIdMasked = '****';
        }

        return NextResponse.json({
            configured: true,
            isEnabled: config.isEnabled,
            settings: config.settings,
            lastTestedAt: config.lastTestedAt,
            lastTestResult: config.lastTestResult,
            configuredBy: config.configuredBy,
            configuredAt: config.configuredAt,
            clientIdMasked,
        });
    } catch (error: any) {
        console.error('Error fetching Personio config:', error);
        if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        await requireRole(['admin']);
        await connectDB();

        const config = await IntegrationConfig.findOneAndUpdate(
            { provider: 'personio' },
            {
                $set: {
                    isEnabled: false,
                    'credentials.clientId': '',
                    'credentials.clientSecretEncrypted': '',
                    'credentials.accessToken': '',
                    configuredBy: '',
                },
                $unset: {
                    configuredAt: 1,
                    lastTestedAt: 1,
                    lastTestResult: 1,
                }
            },
            { new: true }
        );

        return NextResponse.json({ success: true, message: 'Personio credentials removed' });
    } catch (error: any) {
        console.error('Error removing Personio credentials:', error);
        if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to delete credentials' }, { status: 500 });
    }
}
