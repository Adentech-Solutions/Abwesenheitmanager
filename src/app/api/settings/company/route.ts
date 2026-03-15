// src/app/api/settings/company/route.ts
// API for company-wide settings (Admin only)

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/rbac';
import connectDB from '@/lib/mongodb';
import CompanySettings from '@/models/CompanySettings';

// GET /api/settings/company - Get company settings
export async function GET(request: NextRequest) {
  try {
    // 🔒 Security: All authenticated users can read settings (needed for holiday/calendar calculations)
    await requireRole(['employee', 'manager', 'admin']);

    await connectDB();
    const settings = await CompanySettings.getSettings();

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching company settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/settings/company - Update company settings (Admin only)
export async function PUT(request: NextRequest) {
  try {
    // 🔒 Security: Only admins can update company settings
    await requireRole(['admin']);

    await connectDB();

    const body = await request.json();

    // Validate state if provided
    const validStates = [
      'BW', 'BY', 'BE', 'BB', 'HB', 'HH',
      'HE', 'MV', 'NI', 'NW', 'RP', 'SL',
      'SN', 'ST', 'SH', 'TH'
    ];

    if (body.state && !validStates.includes(body.state)) {
      return NextResponse.json(
        { error: 'Invalid state code' },
        { status: 400 }
      );
    }

    // Update settings
    const settings = await CompanySettings.updateSettings(body);

    return NextResponse.json({ 
      settings,
      message: 'Settings updated successfully' 
    });
  } catch (error) {
    console.error('Error updating company settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
