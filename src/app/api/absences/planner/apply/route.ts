export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { addDays } from 'date-fns';
import { z } from 'zod';
import { requireRole } from '@/lib/rbac';
import connectDB from '@/lib/mongodb';
import Absence from '@/models/Absence';
import User from '@/models/User';
import { calculateWorkingDays } from '@/lib/utils/date';
import { parseLocalDate } from '@/lib/utils/localDate';
import { getGermanHolidays, type GermanState } from '@/lib/utils/holidays';
import Department from '@/models/Department';
import CompanySettings from '@/models/CompanySettings';
import { sendNotificationEmail, generateApprovalEmailBody } from '@/lib/email';
import { sendApprovalNotification } from '@/lib/teams-bot';
import { formatAbsenceType } from '@/lib/utils/format';

const plannedDaySchema = z.object({
  date: z.string(),
  type: z.enum(['urlaub', 'feiertag', 'wochenende', 'schulferien', 'arbeitstag']),
  reason: z.string().optional(),
  category: z.enum(['brueckentag', 'haupturlaub', 'kurzurlaub', 'weihnachten', 'none']),
});

const yearPlanSchema = z.object({
  days: z.array(plannedDaySchema),
  urlaubstageGeplant: z.number(),
  urlaubstageUebrig: z.number(),
  feiertage: z.number(),
  freieTagGesamt: z.number(),
  blocks: z.array(
    z.object({
      startDate: z.string(),
      endDate: z.string(),
      totalDays: z.number(),
      urlaubstage: z.number(),
      reason: z.string(),
    })
  ),
});

function mergeUrlaubBlocks(
  days: { date: string; type: string; reason?: string }[]
): { start: string; end: string }[] {
  const blocks: { start: string; end: string }[] = [];
  let cur: { start: string; end: string } | null = null;

  for (const day of days) {
    if (day.type !== 'urlaub' || day.reason === 'Bereits verplant') {
      if (cur) {
        blocks.push(cur);
        cur = null;
      }
      continue;
    }
    if (!cur) {
      cur = { start: day.date, end: day.date };
      continue;
    }
    const next = parseLocalDate(day.date);
    const expected = addDays(parseLocalDate(cur.end), 1);
    if (next.getTime() === expected.getTime()) {
      cur.end = day.date;
    } else {
      blocks.push(cur);
      cur = { start: day.date, end: day.date };
    }
  }
  if (cur) blocks.push(cur);
  return blocks;
}

function holidayDatesForRange(start: Date, end: Date, state: GermanState): Date[] {
  const y0 = start.getFullYear();
  const y1 = end.getFullYear();
  const out: Date[] = [];
  for (let y = y0; y <= y1; y++) {
    for (const h of getGermanHolidays(y, state)) {
      const t = h.date.getTime();
      if (t >= start.getTime() && t <= end.getTime()) out.push(h.date);
    }
  }
  return out;
}

export async function POST(request: NextRequest) {
  try {
    const { dbUser } = await requireRole(['employee', 'teamlead', 'manager', 'hr_manager', 'admin']);

    await connectDB();

    let state: GermanState | undefined;
    if (dbUser.departmentId) {
      const department = await Department.findById(dbUser.departmentId);
      if (department?.bundesland) state = department.bundesland as GermanState;
    }
    if (!state) {
      const settings = await CompanySettings.getSettings();
      state = settings.state;
    }

    const body = await request.json();
    const parsed = yearPlanSchema.safeParse(body.plan ?? body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültiger Plan', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const plan = parsed.data;
    const blocks = mergeUrlaubBlocks(plan.days);

    if (blocks.length === 0) {
      return NextResponse.json({ error: 'Keine neuen Urlaubstage im Plan' }, { status: 400 });
    }

    const created: unknown[] = [];

    for (const block of blocks) {
      const startDate = parseLocalDate(block.start);
      const endDate = parseLocalDate(block.end);
      const holidays = holidayDatesForRange(startDate, endDate, state);
      const totalDays = calculateWorkingDays(startDate, endDate, false, holidays);

      if (totalDays <= 0) continue;

      const overlap = await Absence.findOne({
        userEmail: dbUser.email,
        status: { $in: ['approved', 'pending'] },
        startDate: { $lte: endDate },
        endDate: { $gte: startDate },
      });
      if (overlap) {
        continue;
      }

      const absence = await Absence.create({
        userId: dbUser.entraId,
        userEmail: dbUser.email,
        userName: dbUser.name,
        type: 'vacation',
        startDate,
        endDate,
        isHalfDay: false,
        totalDays,
        status: 'pending',
        reason: 'Jahresplaner',
        conflictWarning: false,
      });

      created.push(absence);

      if (dbUser.managerEmail) {
        const manager = await User.findOne({ email: dbUser.managerEmail });
        if (manager?.entraId) {
          try {
            await sendNotificationEmail({
              to: manager.email,
              subject: `🏖️ Neuer Abwesenheitsantrag von ${absence.userName}`,
              body: generateApprovalEmailBody(
                absence.userName,
                formatAbsenceType(absence.type),
                absence.startDate.toLocaleDateString('de-DE'),
                absence.endDate.toLocaleDateString('de-DE'),
                absence.totalDays,
                `${process.env.NEXT_PUBLIC_APP_URL}/manager/approvals`
              ),
              fromEmail: dbUser.email,
            });
          } catch (e) {
            console.error('Planner apply email:', e);
          }
          try {
            await sendApprovalNotification(
              dbUser.entraId,
              manager.entraId,
              manager.email,
              {
                id: (absence as { _id: { toString: () => string } })._id.toString(),
                employeeName: absence.userName,
                type: formatAbsenceType(absence.type),
                startDate: absence.startDate.toLocaleDateString('de-DE'),
                endDate: absence.endDate.toLocaleDateString('de-DE'),
                totalDays: absence.totalDays,
                approvalLink: `${process.env.NEXT_PUBLIC_APP_URL}/manager/approvals`,
              }
            );
          } catch (e) {
            console.error('Planner apply teams:', e);
          }
        }
      }
    }

    return NextResponse.json({ absences: created, count: created.length });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('POST /api/absences/planner/apply:', error);
    if (err.message === 'Unauthorized' || err.message?.startsWith('Forbidden')) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 });
  }
}
