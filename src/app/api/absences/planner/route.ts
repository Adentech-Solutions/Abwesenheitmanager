export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/rbac';
import connectDB from '@/lib/mongodb';
import Absence from '@/models/Absence';
import Department from '@/models/Department';
import CompanySettings from '@/models/CompanySettings';
import { generateYearPlan, type PlannerCriteria } from '@/lib/services/yearPlanner';
import type { GermanState } from '@/lib/utils/holidays';

const criteriaSchema = z.object({
  priorities: z.array(z.string()),
  mainVacation: z
    .object({
      months: z.array(z.number().min(0).max(11)),
      days: z.number().min(3).max(21),
    })
    .nullable(),
  remainingStrategy: z.array(z.string()),
  takeBridgeDays: z.boolean(),
  considerSchoolHolidays: z.boolean(),
});

export async function GET(request: NextRequest) {
  try {
    const { dbUser } = await requireRole(['employee', 'teamlead', 'manager', 'hr_manager', 'admin']);

    await connectDB();

    let state: GermanState | undefined;
    if (dbUser.departmentId) {
      const department = await Department.findById(dbUser.departmentId);
      if (department?.bundesland) {
        state = department.bundesland as GermanState;
      }
    }
    if (!state) {
      const settings = await CompanySettings.getSettings();
      state = settings.state;
    }

    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
    if (Number.isNaN(year) || year < 2020 || year > 2040) {
      return NextResponse.json({ error: 'Ungültiges Jahr' }, { status: 400 });
    }

    const criteriaRaw = searchParams.get('criteria');
    let criteria: PlannerCriteria = {
      priorities: [],
      mainVacation: null,
      remainingStrategy: ['christmas', 'longWeekends', 'recoveryGaps', 'schoolHolidays'],
      takeBridgeDays: false,
      considerSchoolHolidays: false,
    };

    if (criteriaRaw) {
      try {
        const parsed = JSON.parse(criteriaRaw) as unknown;
        const validated = criteriaSchema.safeParse(parsed);
        if (!validated.success) {
          return NextResponse.json(
            { error: 'Ungültige Kriterien', details: validated.error.flatten() },
            { status: 400 }
          );
        }
        criteria = validated.data;
      } catch {
        return NextResponse.json({ error: 'Kriterien konnten nicht gelesen werden' }, { status: 400 });
      }
    }

    const remaining = dbUser.vacationDays?.remaining ?? 0;

    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);
    const absences = await Absence.find({
      userEmail: dbUser.email,
      status: { $in: ['approved', 'pending'] },
      startDate: { $lte: yearEnd },
      endDate: { $gte: yearStart },
    });

    const existingAbsences = absences.map((a) => ({
      startDate: a.startDate,
      endDate: a.endDate,
    }));

    const plan = generateYearPlan(year, state, remaining, existingAbsences, criteria);

    return NextResponse.json({
      year,
      state,
      remainingDays: remaining,
      plan,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error in GET /api/absences/planner:', error);
    if (err.message === 'Unauthorized' || err.message?.startsWith('Forbidden')) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 });
  }
}
