// src/app/api/absences/route.ts - UPDATED

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Absence from '@/models/Absence';
import User from '@/models/User';
import { calculateWorkingDays } from '@/lib/utils/date';
import { absenceSchema } from '@/lib/utils/validation';
import { checkAbsenceConflicts } from '@/lib/utils/conflicts';
import { getUserDirectReports } from '@/lib/graph-client';
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
  console.log('🟦 POST /api/absences - START');

  try {
    console.log('🟦 1. Getting session...');
    const session = await getServerSession(authOptions);
    console.log('🟦 Session:', session ? 'exists' : 'null', session?.user?.email);

    if (!session?.user?.email) {
      console.log('❌ No session, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🟦 2. Connecting to MongoDB...');
    await connectDB();
    console.log('✅ MongoDB connected');

    console.log('🟦 3. Reading request body...');
    const body = await request.json();
    console.log('🟦 Body:', JSON.stringify(body, null, 2));

    console.log('🟦 4. Validating with Zod...');
    const validated = absenceSchema.parse(body);
    console.log('✅ Validation passed');

    console.log('🟦 5. Finding user in DB...');
    const user = await User.findOne({ email: session.user.email });
    console.log('🟦 User:', user ? `Found: ${user.email}` : 'NOT FOUND');

    if (!user) {
      console.log('❌ User not in DB, returning 404');
      return NextResponse.json({
        error: 'User not found. Please logout and login again to create your account.'
      }, { status: 404 });
    }

    console.log('🟦 6. Calculating working days...');
    const totalDays = calculateWorkingDays(
      new Date(validated.startDate),
      new Date(validated.endDate),
      validated.isHalfDay
    );
    console.log('🟦 Total days:', totalDays);

    // ⭐ NEU: Auto-Reply Settings vorbereiten
    console.log('🟦 6.5. Preparing auto-reply settings...');

    // Default Werte aus Body oder Smart Defaults
    const autoReplyEnabled = validated.autoReplySettings?.enabled !== false;  // Default: true
    const hasSubstitute = validated.autoReplySettings?.hasSubstitute || false;
    const substituteInfo = validated.autoReplySettings?.substituteInfo;
    const recipients = {
      internal: validated.autoReplySettings?.recipients?.internal !== false,  // Default: true
      external: validated.autoReplySettings?.recipients?.external !== false,  // Default: true
    };
    const timing = {
      activateImmediately: validated.autoReplySettings?.timing?.activateImmediately || false,
      scheduledDate: validated.startDate,  // Startdatum der Abwesenheit
      scheduledTime: validated.autoReplySettings?.timing?.scheduledTime || '00:00',  // Default: Mitternacht
    };

    // Auto-Reply Nachricht generieren
    const autoReplyMessages = generateAutoReplyMessage({
      userName: user.name,
      startDate: new Date(validated.startDate),
      endDate: new Date(validated.endDate),
      substitute: substituteInfo,
      // userSignature: user.signature,  // TODO: Aus Entra ID oder User Model
    });

    console.log('✅ Auto-reply messages generated');

    console.log('🟦 7. Creating absence in DB...');
    const absence = await Absence.create({
      userId: user.entraId,
      userEmail: user.email,
      userName: user.name,
      type: validated.type,
      startDate: validated.startDate,
      endDate: validated.endDate,
      isHalfDay: validated.isHalfDay,
      halfDayPeriod: validated.halfDayPeriod,
      totalDays,
      status: validated.type === 'sick' ? 'approved' : 'pending',
      reason: validated.reason,
      conflictWarning: false,

      // ⭐ NEU: Auto-Reply Settings mit Smart Defaults
      autoReplySettings: {
        enabled: autoReplyEnabled,
        hasSubstitute,
        substituteInfo,
        recipients,
        timing,
        generatedMessage: autoReplyMessages,
      },
    });
    console.log('✅ Absence created:', absence._id);

    // 🆕 Benachrichtigungen senden (nur wenn nicht Krankmeldung)
    if (validated.type !== 'sick' && user.managerEmail) {
      console.log('🟦 8. Sending notifications to manager:', user.managerEmail);

      // Manager aus DB holen
      const manager = await User.findOne({ email: user.managerEmail });

      if (manager && manager.entraId) {
        // ⭐ Email Benachrichtigung
        try {
          console.log('📧 Sending email notification...');

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
            fromEmail: user.email,
          });

          console.log('✅ Email sent to manager');
        } catch (error) {
          console.error('Failed to send email:', error);
        }

        // ⭐ Teams Benachrichtigung
        try {
          console.log('💬 Sending Teams notification...');

          await sendApprovalNotification(
            user.entraId,      // ← VON: Employee (Salem)
            manager.entraId,   // ← AN: Manager (Adele)
            manager.email,
            {
              id: absence._id.toString(), // Added for Magic Links
              employeeName: absence.userName,
              type: formatAbsenceType(absence.type),
              startDate: new Date(absence.startDate).toLocaleDateString('de-DE'),
              endDate: new Date(absence.endDate).toLocaleDateString('de-DE'),
              totalDays: absence.totalDays,
              approvalLink: `${process.env.NEXT_PUBLIC_APP_URL}/manager/approvals`,
            }
          );

          console.log('✅ Teams notification sent');
        } catch (error) {
          console.error('Failed to send Teams notification:', error);
        }
      } else {
        console.log('⚠️ Manager not found in DB or missing entraId');
      }
    } else {
      console.log('⚠️ No notifications: type=', validated.type, 'managerEmail=', user.managerEmail);
    }

    console.log('🟦 9. Returning response...');
    return NextResponse.json({ absence }, { status: 201 });

  } catch (error: any) {
    console.error('❌ ERROR:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Failed to create absence' },
      { status: 500 }
    );
  }
}