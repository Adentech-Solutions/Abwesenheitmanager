// src/app/api/approvals/[id]/approve/route.ts - WITH HANDOVER SUPPORT

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Absence from '@/models/Absence';
import User from '@/models/User';
import { createCalendarEvent, setAutomaticReplies, mapAutoReplySettings, getGraphUser } from '@/lib/graph-client';
import { sendApprovalResultNotification, sendHandoverNotification, sendHandoverTrackerCard } from '@/lib/teams-bot';
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
      params.id,
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
    }

    // Set Auto-Reply (if enabled)
    if (absence.autoReplySettings?.enabled) {
      try {
        console.log('🤖 Setting auto-reply...');

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
            scheduledDate: absence.autoReplySettings.timing?.scheduledDate || absence.startDate,
            scheduledTime: absence.autoReplySettings.timing?.scheduledTime || '00:00',
          },
        };

        const graphSettings = mapAutoReplySettings(
          cleanSettings,
          absence.startDate,
          absence.endDate,
          absence.userName || 'Mitarbeiter'
        );

        await setAutomaticReplies(absence.userId, graphSettings);
        console.log('✅ Auto-reply set successfully');
      } catch (error: any) {
        console.error('❌ Error setting auto-reply:', error);
      }
    }

    // Notify employee via Teams
    try {
      console.log('💬 Sending Teams notification to employee...');
      await sendApprovalResultNotification(
        manager.entraId,
        absence.userId,
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
    }

    // 📋 Send handover notification to substitute (if handover enabled)
    if (absence.handover?.enabled && absence.substitute?.email) {
      try {
        // 📋 Sending handover notification to substitute
        console.log('📋 Sending handover notification to substitute...');

        // Find substitute User ID (From DB, Document, or Graph)
        let substituteEntraId = absence.substitute.userId;
        if (!substituteEntraId) {
          const subUser = await User.findOne({ email: absence.substitute.email });
          if (subUser?.entraId) substituteEntraId = subUser.entraId;
          else {
            try {
              const graphUser = await getGraphUser(absence.substitute.email);
              if (graphUser?.id) substituteEntraId = graphUser.id;
            } catch (e) { }
          }
        }

        if (substituteEntraId) {
          if (substituteEntraId === manager.entraId) {
            console.log('📋 Manager is the substitute, auto-acknowledging handover...');
            if (absence.handover) {
              absence.set('handover.status', 'acknowledged');
              absence.set('handover.acknowledgedAt', new Date());

              console.log('📋 Sending Tracker Card to Manager...');
              await sendHandoverTrackerCard(
                manager.entraId,
                {
                  id: params.id,
                  employeeName: absence.userName,
                  startDate: new Date(absence.startDate).toISOString(),
                  endDate: new Date(absence.endDate).toISOString(),
                  items: absence.handover.items || []
                }
              );
            }
          } else {
            await sendHandoverNotification(
              manager.entraId,
              substituteEntraId,
              {
                absenceId: params.id,
                employeeName: absence.userName,
                startDate: new Date(absence.startDate).toLocaleDateString('de-DE'),
                endDate: new Date(absence.endDate).toLocaleDateString('de-DE'),
                totalDays: absence.totalDays,
              },
              absence.handover
            );
          }

          // Update handover notifiedAt
          absence.set('handover.notifiedAt', new Date());
          absence.set('substitute.notified', true);
          await absence.save();

          console.log('✅ Handover processing complete (sent or auto-acknowledged)');

          // Audit log
          await auditLog(
            manager.entraId,
            manager.email,
            'updated',
            'absence',
            params.id,
            [{ field: 'handover.notifiedAt', oldValue: null, newValue: new Date().toISOString() }],
            request
          );
        } else {
          console.log('⚠️ Substitute user not found in DB or missing entraId');
        }
      } catch (error: any) {
        console.error('❌ Error sending handover notification:', error);
        // Non-critical — don't fail the approval
      }
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