// src/app/api/smart-suggestions/route.ts
// API Endpunkt für proaktive Urlaubsempfehlungen

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/rbac';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Department from '@/models/Department';
import CompanySettings from '@/models/CompanySettings';
import { getProactiveSuggestion } from '@/lib/services/proactiveSuggestions';
import { GermanState } from '@/lib/utils/holidays';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 🔐 Berechtigung prüfen (Alle Rollen dürfen ihren eigenen Vorschlag sehen)
    const { user, dbUser: userDoc } = await requireRole(['employee', 'teamlead', 'manager', 'hr_manager', 'admin']);
    await connectDB();

    // 🏨 Bundesland ermitteln (Department -> CompanySettings Fallback)
    let state: GermanState = 'BY'; // Default Fallback

    if (userDoc.department) {
      const dept = await Department.findOne({ name: userDoc.department });
      if (dept?.bundesland) {
        state = dept.bundesland as GermanState;
      } else {
        const settings = await CompanySettings.getSettings();
        state = settings.state;
      }
    } else {
      const settings = await CompanySettings.getSettings();
      state = settings.state;
    }

    // 🚀 Vorschlag generieren
    const suggestion = await getProactiveSuggestion(
      userDoc.entraId,
      userDoc.email,
      userDoc.department || '',
      state,
      userDoc.vacationDays.remaining || 0
    );

    return NextResponse.json({ suggestion });
  } catch (error: any) {
    console.error('❌ Error in /api/smart-suggestions:', error);
    
    if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
