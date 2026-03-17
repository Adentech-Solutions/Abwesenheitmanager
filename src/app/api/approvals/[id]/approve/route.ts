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
    // 🔒 Security: Require Manager, HR Manager, or Admin role
    const { user: sessionUser, dbUser: manager } = await requireRole(['manager', 'teamlead', 'hr_manager', 'admin']);

    await connectDB();

    const absence = await Absence.findById(params.id);
    if (!absence) {
      return NextResponse.json({ error: 'Absence not found' }, { status: 404 });
    }

    if (absence.status !== 'pending') {
      return NextResponse.json({ error: 'Absence already processed' }, { status: 400 });
    }

    // 🔒 Security: Managers can only approve their own direct reports' requests (or TeamLeads within their department)
    if (manager.role === 'manager' || manager.role === 'teamlead') {
      const absenceOwner = await User.findOne({ email: absence.userEmail });
      
      if (absenceOwner?.managerId !== manager.entraId) {
        if (manager.role === 'teamlead') {
          if (absenceOwner?.department !== manager.department) {
            return NextResponse.json({ error: 'Forbidden: Team leads can only approve within their department' }, { status: 403 });
          }
        } else {
          return NextResponse.json({ error: 'Forbidden: Not the manager of this employee' }, { status: 403 });
        }
      }
    }
    // hr_manager and admin can approve anyone — no additional check needed

    // Approve absence
    await absence.approve(manager.entraId, manager.email);

    // Audit Log
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
      }
    }

    // Create calendar event
    try {
      await createCalendarEvent(absence.userId, {
        subject: `${formatAbsenceType(absence.type)} - ${absence.userName}`,
        body: absence.reason || '',
        startDateTime: new Date(absence.startDate).toISOString(),
        endDateTime: new Date(absence.endDate).toISOString(),
        isAllDay: !absence.isHalfDay,
      });
    } catch (error) {
      console.error('Error creating calendar event:', error);
    }

    // Set Auto-Reply (if enabled)
    if (absence.autoReplySettings?.enabled) {
      try {
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
      } catch (error: any) {
        console.error('Error setting auto-reply:', error);
      }
    }

    // Notify employee via Teams
    try {
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
    } catch (error: any) {
      console.error('Error sending Teams notification to employee:', error);
    }

    // Send handover notification to substitute (if handover enabled)
    if (absence.handover?.enabled && absence.substitute?.email) {
      try {
        // Resolve substitute Entra ID
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
            // Manager is the substitute — auto-acknowledge
            if (absence.handover) {
              absence.set('handover.status', 'acknowledged');
              absence.set('handover.acknowledgedAt', new Date());

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

          absence.set('handover.notifiedAt', new Date());
          absence.set('substitute.notified', true);
          await absence.save();

          await auditLog(
            manager.entraId,
            manager.email,
            'updated',
            'absence',
            params.id,
            [{ field: 'handover.notifiedAt', oldValue: null, newValue: new Date().toISOString() }],
            request
          );
        }
      } catch (error: any) {
        console.error('Error sending handover notification:', error);
        // Non-critical — don't fail the approval
      }
    }

    // Personio write-back (last step, non-blocking)
    try {
      const absenceOwner = await User.findOne({ email: absence.userEmail });
      if (absenceOwner?.personioId && absence.type === 'vacation') {
        const { writeBackAbsenceToPersonio } = await import('@/lib/services/personioSync');
        const result = await writeBackAbsenceToPersonio(absence, absenceOwner);
        if (!result.success) {
          console.error('Personio write-back skipped:', result.reason);
        }
      }
    } catch (error) {
      console.error('Personio write-back failed:', error);
    }

    return NextResponse.json({
      absence,
      message: 'Absence approved'
    });

  } catch (error: any) {
    console.error('Error approving absence:', error);
    if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({
      error: 'Failed to approve absence',
      details: error.message
    }, { status: 500 });
  }
}