import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/rbac';
import connectDB from '@/lib/mongodb';
import IntegrationConfig from '@/models/IntegrationConfig';

export async function PUT(request: NextRequest) {
    try {
        await requireRole(['admin']);
        await connectDB();

        const body = await request.json();
        const { autoSyncEnabled, syncIntervalHours, writeBackEnabled } = body;

        const updateSet: any = {};
        if (autoSyncEnabled !== undefined) updateSet['settings.autoSyncEnabled'] = autoSyncEnabled;
        if (syncIntervalHours !== undefined) updateSet['settings.syncIntervalHours'] = syncIntervalHours;
        if (writeBackEnabled !== undefined) updateSet['settings.writeBackEnabled'] = writeBackEnabled;

        const updated = await IntegrationConfig.findOneAndUpdate(
            { provider: 'personio' },
            { $set: updateSet },
            { new: true }
        );

        if (!updated) {
            return NextResponse.json({ error: 'Personio configuration not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, settings: updated.settings });

    } catch (error: any) {
        console.error('Error updating Personio settings:', error);
        if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
