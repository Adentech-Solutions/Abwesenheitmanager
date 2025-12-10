import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/rbac';
import connectDB from '@/lib/mongodb';
import Settings from '@/models/Settings';

export async function GET(request: NextRequest) {
    try {
        // 🔒 Security: Only admins can view settings (for now)
        // Some settings might be public, but let's restrict for safety first.
        await requireRole(['admin']);
        await connectDB();

        const settings = await Settings.find({});

        // Transform array to object for easier frontend consumption
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, any>);

        return NextResponse.json({ settings: settingsMap });
    } catch (error: any) {
        console.error('Error fetching settings:', error);
        if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // 🔒 Security: Only admins can update settings
        await requireRole(['admin']);
        await connectDB();

        const body = await request.json();
        const { settings } = body; // Expects object { key: value, key2: value2 }

        if (!settings) {
            return NextResponse.json({ error: 'Settings data required' }, { status: 400 });
        }

        const updates = Object.entries(settings).map(([key, value]) => {
            return Settings.findOneAndUpdate(
                { key },
                { value },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        });

        await Promise.all(updates);

        return NextResponse.json({ message: 'Settings updated successfully' });
    } catch (error: any) {
        console.error('Error updating settings:', error);
        if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
