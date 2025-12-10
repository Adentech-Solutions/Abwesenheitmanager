// src/app/api/approvals/[id]/approve/route.ts - WITH TYPE FIXES

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Absence from '@/models/Absence';
import User from '@/models/User';
import { createCalendarEvent, setAutomaticReplies, mapAutoReplySettings } from '@/lib/graph-client';
import { sendApprovalResultNotification } from '@/lib/teams-bot';
import { formatAbsenceType } from '@/lib/utils/format';
import { auditLog } from '@/lib/middleware/audit';
import { requireRole } from '@/lib/rbac';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('✅ POST /api/approvals/[id]/approve - START');

    // 🔒 Security: Require Manager or Admin role
    const { user: sessionUser, dbUser: manager } = await requireRole(['manager', 'admin']);

    await connectDB();

    console.log('✅ Manager:', manager.email);

    const absence = await Absence.findById(params.id);
    if (!absence) {
      return NextResponse.json({ error: 'Absence not found' }, { status: 404 });
    }

    if (absence.status !== 'pending') {
      return NextResponse.json({ error: 'Absence already processed' }, { status: 400 });
    }

    console.log('✅ Processing approval for:', absence.userEmail);

    // Approve absence
    await absence.approve(manager.entraId, manager.email);
    console.log('✅ Absence approved in DB');

    // 📝 Audit Log
    await auditLog(
      manager.entraId,
      manager.email,
      'approved',
      'absence',
      absence._id.toString(),
      [{ field: 'status', oldValue: 'pending', newValue: 'approved' }],
      request
    );

    // Update user vacation balance
    if (absence.type === 'vacation') {
      const user = await User.findOne({ email: absence.userEmail });
      if (user) {
        await user.updateVacationBalance(absence.totalDays);
        console.log('✅ Vacation balance updated');
      }
    }

    // Create calendar event
    try {
      console.log('📅 Creating calendar event...');
      await createCalendarEvent(absence.userId, {
        subject: `${formatAbsenceType(absence.type)} - ${absence.userName}`,
        body: absence.reason || '',
        startDateTime: new Date(absence.startDate).toISOString(),
        endDateTime: new Date(absence.endDate).toISOString(),
        isAllDay: !absence.isHalfDay,
      });
      console.log('✅ Calendar event created');
    } catch (error) {
      console.error('❌ Error creating calendar event:', error);
      // Continue - calendar event is not critical
    }

    // Set Auto-Reply (if enabled)
    if (absence.autoReplySettings?.enabled) {
      try {
        console.log('🤖 Setting auto-reply...');
        console.log('📝 Auto-reply settings:', absence.autoReplySettings);

        // ✅ BUILD CLEAN SETTINGS OBJECT (with type safety)
        const cleanSettings = {
          enabled: absence.autoReplySettings.enabled,
          hasSubstitute: absence.autoReplySettings.hasSubstitute || false,
          substituteInfo: absence.autoReplySettings.substituteInfo,
          recipients: absence.autoReplySettings.recipients || {
            internal: true,
            external: true,
          },
          timing: {
            activateImmediately: absence.autoReplySettings.timing?.activateImmediately || false,
            scheduledDate: absence.autoReplySettings.timing?.scheduledDate || absence.startDate,  // ✅ Fallback to startDate
            scheduledTime: absence.autoReplySettings.timing?.scheduledTime || '00:00',
          },
        };

        // Use helper function to map settings to Graph API format
        const graphSettings = mapAutoReplySettings(
          cleanSettings,
          absence.startDate,
          absence.endDate,
          absence.userName || 'Mitarbeiter'
        );

        console.log('📤 Mapped settings for Graph API:', graphSettings);

        // Set automatic replies via Graph API
        await setAutomaticReplies(absence.userId, graphSettings);

        console.log('✅ Auto-reply set successfully');
        console.log('📧 Recipients:', {
          internal: cleanSettings.recipients?.internal,
          external: cleanSettings.recipients?.external,
        });

        if (cleanSettings.hasSubstitute && cleanSettings.substituteInfo) {
          console.log('👤 With substitute:', cleanSettings.substituteInfo.email);
        }

      } catch (error: any) {
        console.error('❌ Error setting auto-reply:', error);
        console.error('❌ Error details:', error.body || error.message);
        // IMPORTANT: Don't fail the whole request if auto-reply fails
        // Approval is more important than auto-reply
      }
    } else {
      console.log('ℹ️ Auto-reply disabled by user or not configured');
    }

    // Notify employee via Teams
    try {
      console.log('💬 Sending Teams notification to employee...');
      await sendApprovalResultNotification(
        manager.entraId,  // FROM: Manager (who approved)
        absence.userId,   // TO: Employee (who requested)
        'approved',
        {
          type: formatAbsenceType(absence.type),
          startDate: new Date(absence.startDate).toLocaleDateString('de-DE'),
          endDate: new Date(absence.endDate).toLocaleDateString('de-DE'),
        }
      );
      console.log('✅ Teams notification sent to employee');
    } catch (error: any) {
      console.error('❌ Error sending Teams notification:', error);
      console.error('❌ Teams error details:', error.body || error.message);
      // Continue - notification is not critical
    }

    console.log('✅ POST /api/approvals/[id]/approve - SUCCESS');

    return NextResponse.json({
      absence,
      message: 'Absence approved'
    });

  } catch (error: any) {
    console.error('❌ Error approving absence:', error);
    if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({
      error: 'Failed to approve absence',
      details: error.message
    }, { status: 500 });
  }
}