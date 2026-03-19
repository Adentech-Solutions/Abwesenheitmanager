// src/app/api/vacation-suggestions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/rbac';
import connectDB from '@/lib/mongodb';
import Absence from '@/models/Absence';
import User from '@/models/User';
import Department from '@/models/Department';
import CompanySettings from '@/models/CompanySettings';
import { getVacationSuggestions } from '@/lib/services/vacationOptimizer';

export async function GET(request: NextRequest) {
  try {
    // 🔒 Security: Any authenticated user can view vacation suggestions
    const { dbUser } = await requireRole(['employee', 'teamlead', 'manager', 'hr_manager', 'admin']);

    await connectDB();

    // Determine Bundesland from user department (fallback to company setting)
    let state = undefined;

    if (dbUser.departmentId) {
      const department = await Department.findById(dbUser.departmentId);
      if (department?.bundesland) {
        state = department.bundesland;
      }
    }

    if (!state) {
      const settings = await CompanySettings.getSettings();
      state = settings.state;
    }

    const remainingDays = dbUser.vacationDays?.remaining ?? 0;

    // Fetch existing approved/pending absences to avoid overlaps
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const absences = await Absence.find({
      userEmail: dbUser.email,
      status: { $in: ['approved', 'pending'] },
      endDate: { $gte: tomorrow },
    });

    const suggestions = getVacationSuggestions({
      state,
      remainingDays,
      existingAbsences: absences.map((a) => ({ startDate: a.startDate, endDate: a.endDate })),
      maxResults: 10,
    });

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error('Error fetching vacation suggestions:', error);
    if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to fetch vacation suggestions' }, { status: 500 });
  }
}
