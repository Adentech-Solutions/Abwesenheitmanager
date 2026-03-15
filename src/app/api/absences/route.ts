// src/app/api/absences/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Absence from '@/models/Absence';
import User from '@/models/User';
import { calculateWorkingDays } from '@/lib/utils/date';
import { absenceSchema } from '@/lib/utils/validation';
import { checkAbsenceConflicts } from '@/lib/utils/conflicts';
import { getUserDirectReports, getGraphUser } from '@/lib/graph-client';
import { sendApprovalNotification } from '@/lib/teams-bot';
import { sendNotificationEmail, generateApprovalEmailBody } from '@/lib/email';
import { formatAbsenceType } from '@/lib/utils/format';
import { generateAutoReplyMessage } from '@/lib/utils/autoReplyGenerator';
import { requireRole, canViewUserData } from '@/lib/rbac';

// GET /api/absences - List absences
export async function GET(request: NextRequest) {
  try {
    // 🔒 Security: Check if user is authenticated and get their role
    const { user, dbUser } = await requireRole(['employee', 'manager', 'admin']);

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const targetUserId = searchParams.get('userId');

    const query: any = {};
    if (status) query.status = status;

    // 🔒 Security: Check data access permissions
    if (targetUserId) {
      const canView = await canViewUserData(dbUser, targetUserId);
      if (!canView) {
        return NextResponse.json({ error: 'Forbidden: Cannot view this user\'s data' }, { status: 403 });
      }
      query.userId = targetUserId;
    } else {
      // Default to own data if no userId specified
      query.userEmail = user.email;
    }

    const absences = await Absence.find(query).sort({ startDate: -1 }).limit(100);

    return NextResponse.json({ absences });
  } catch (error: any) {
    console.error('Error fetching absences:', error);
    if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to fetch absences' }, { status: 500 });
  }
}

// POST /api/absences - Create absence
export async function POST(request: NextRequest) {
  try {
    const { user, dbUser } = await requireRole(['employee', 'manager', 'admin']);

    await connectDB();

    const body = await request.json();
    const validated = absenceSchema.parse(body);

    // dbUser is already fetched by requireRole — no second DB call needed
    if (!dbUser) {
      return NextResponse.json({
        error: 'User not found. Please logout and login again to create your account.'
      }, { status: 404 });
    }

    const totalDays = calculateWorkingDays(
      new Date(validated.startDate),
      new Date(validated.endDate),
      validated.isHalfDay
    );

    // Auto-Reply Settings
    const autoReplyEnabled = validated.autoReplySettings?.enabled == true;
    const hasSubstitute = validated.autoReplySettings?.hasSubstitute || false;
    const substituteInfo = validated.autoReplySettings?.substituteInfo;
    const recipients = {
      internal: validated.autoReplySettings?.recipients?.internal !== false,
      external: validated.autoReplySettings?.recipients?.external !== false,
    };
    const timing = {
      activateImmediately: validated.autoReplySettings?.timing?.activateImmediately || false,
      scheduledDate: validated.startDate,
      scheduledTime: validated.autoReplySettings?.timing?.scheduledTime || '00:00',
    };

    const autoReplyMessages = generateAutoReplyMessage({
      userName: dbUser.name,
      startDate: new Date(validated.startDate),
      endDate: new Date(validated.endDate),
      substitute: substituteInfo,
    });

    // Resolve substitute user data
    let substituteData: any = undefined;
    if (validated.substitute?.email) {
      const subUser = await User.findOne({ email: validated.substitute.email });
      let substituteUserId = subUser?.entraId || '';
      let substituteName = validated.substitute.name || subUser?.name || '';

      if (!substituteUserId) {
        try {
          const graphUser = await getGraphUser(validated.substitute.email);
          if (graphUser?.id) {
            substituteUserId = graphUser.id;
            substituteName = substituteName || graphUser.displayName;
          }
        } catch (error) {
          console.error('Failed to resolve substitute entraId from Graph:', error);
        }
      }

      substituteData = {
        userId: substituteUserId,
        email: validated.substitute.email,
        name: substituteName,
        notified: false,
      };
    }

    // Prepare handover data
    let handoverData: any = undefined;
    if (validated.handover?.enabled && validated.handover.items) {
      handoverData = {
        enabled: true,
        items: validated.handover.items.map((item: any) => ({
          ...item,
          status: 'open',
        })),
        generalNotes: validated.handover.generalNotes || undefined,
        activityNotes: [],
        emergencyContact: validated.handover.emergencyContact || { availability: 'unavailable' },
        createdBy: 'employee',
      };
    }

    const absence = await Absence.create({
      userId: dbUser.entraId,
      userEmail: dbUser.email,
      userName: dbUser.name,
      type: validated.type,
      startDate: validated.startDate,
      endDate: validated.endDate,
      isHalfDay: validated.isHalfDay,
      halfDayPeriod: validated.halfDayPeriod,
      totalDays,
      status: validated.type === 'sick' ? 'approved' : 'pending',
      reason: validated.reason,
      conflictWarning: false,

      // Substitute
      ...(substituteData && { substitute: substituteData }),

      // Handover
      ...(handoverData && { handover: handoverData }),

      // Auto-Reply Settings
      autoReplySettings: {
        enabled: autoReplyEnabled,
        hasSubstitute,
        substituteInfo,
        recipients,
        timing,
        generatedMessage: autoReplyMessages,
      },
    });

    // Send notifications (only for non-sick absences)
    if (validated.type !== 'sick' && dbUser.managerEmail) {
      const manager = await User.findOne({ email: dbUser.managerEmail });

      if (manager && manager.entraId) {
        try {
          await sendNotificationEmail({
            to: manager.email,
            subject: `🏖️ Neuer Abwesenheitsantrag von ${absence.userName}`,
            body: generateApprovalEmailBody(
              absence.userName,
              formatAbsenceType(absence.type),
              new Date(absence.startDate).toLocaleDateString('de-DE'),
              new Date(absence.endDate).toLocaleDateString('de-DE'),
              absence.totalDays,
              `${process.env.NEXT_PUBLIC_APP_URL}/manager/approvals`
            ),
            fromEmail: dbUser.email,
          });
        } catch (error) {
          console.error('Failed to send email notification:', error);
        }

        try {
          await sendApprovalNotification(
            dbUser.entraId,
            manager.entraId,
            manager.email,
            {
              id: (absence as any)._id.toString(),
              employeeName: absence.userName,
              type: formatAbsenceType(absence.type),
              startDate: new Date(absence.startDate).toLocaleDateString('de-DE'),
              endDate: new Date(absence.endDate).toLocaleDateString('de-DE'),
              totalDays: absence.totalDays,
              approvalLink: `${process.env.NEXT_PUBLIC_APP_URL}/manager/approvals`,
            }
          );
        } catch (error) {
          console.error('Failed to send Teams notification:', error);
        }
      }
    }

    return NextResponse.json({ absence }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating absence:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create absence' },
      { status: 500 }
    );
  }
}