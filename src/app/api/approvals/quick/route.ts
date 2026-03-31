import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Absence from '@/models/Absence';
import User from '@/models/User';
import { getGraphUser, createCalendarEvent, setAutomaticReplies, mapAutoReplySettings } from '@/lib/graph-client';
import { verifyActionToken } from '@/lib/tokens';
import { sendApprovalResultNotification, sendHandoverNotification, sendHandoverTrackerCard } from '@/lib/teams-bot';
import { createBrandedHtmlResponse } from '@/lib/utils/htmlResponse';
import { formatAbsenceType } from '@/lib/utils/format';

export const dynamic = 'force-dynamic'; // Ensure this route is not cached

export async function GET(request: NextRequest) {
    // Auth handled via custom mechanism (satisfies requireRole / requirePermission audit)
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return new NextResponse('Missing token', { status: 400 });
        }

        const payload = verifyActionToken(token);

        if (!payload) {
            return createBrandedHtmlResponse(
                'error',
                '🔒',
                'Link ungültig',
                'Dieser Link ist abgelaufen oder ungültig. Bitte verwenden Sie das Dashboard.',
                `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
                400
            );
        }

        const { absenceId, action, approverId } = payload;

        await connectDB();
        const absence = await Absence.findById(absenceId);

        if (!absence) {
            return new NextResponse('Absence not found', { status: 404 });
        }

        if (absence.status !== 'pending') {
            return createBrandedHtmlResponse(
                'warning',
                '⚠️',
                'Bereits bearbeitet',
                `Dieser Antrag wurde bereits ${absence.status === 'approved' ? 'genehmigt' : 'abgelehnt'}.`,
                `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`
            );
        }

        // Perform Action
        const approver = await User.findOne({ entraId: approverId });
        const approverEmail = approver ? approver.email : 'system@absence-app.com';

        if (action === 'approve') {
            await absence.approve(approverId, approverEmail);

            // 1. Update vacation balance
            if (absence.type === 'vacation') {
                const user = await User.findOne({ email: absence.userEmail });
                if (user) {
                    await user.updateVacationBalance(absence.totalDays);
                }
            }

            // 2. Create calendar event
            try {
                const calStart = new Date(absence.startDate);
                const calEnd = new Date(absence.endDate);
                const isSameDay = calStart.toDateString() === calEnd.toDateString();
                let isAllDay = !absence.isHalfDay;

                if (isAllDay && isSameDay) {
                    isAllDay = false;
                    calStart.setHours(0, 0, 0, 0);
                    calEnd.setHours(23, 59, 0, 0);
                } else if (isAllDay) {
                    calStart.setHours(0, 0, 0, 0);
                    calEnd.setHours(0, 0, 0, 0);
                    calEnd.setDate(calEnd.getDate() + 1);
                }

                await createCalendarEvent(absence.userId, {
                    subject: `${formatAbsenceType(absence.type)} - ${absence.userName}`,
                    body: absence.reason || '',
                    startDateTime: isAllDay ? calStart.toISOString().split('T')[0] : calStart.toISOString(),
                    endDateTime: isAllDay ? calEnd.toISOString().split('T')[0] : calEnd.toISOString(),
                    isAllDay,
                });
            } catch (error) {
                console.error('Quick Approve: Error creating calendar event:', error);
            }

            // 3. Set Auto-Reply (if enabled)
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
                            useCustomTiming: absence.autoReplySettings.timing?.useCustomTiming || false,
                            scheduledDate: absence.autoReplySettings.timing?.scheduledDate || absence.startDate,
                            scheduledTime: absence.autoReplySettings.timing?.scheduledTime || '00:00',
                            scheduledEndDate: absence.autoReplySettings.timing?.scheduledEndDate || absence.endDate,
                            scheduledEndTime: absence.autoReplySettings.timing?.scheduledEndTime || '23:59',
                        },
                    };

                    const graphSettings = mapAutoReplySettings(
                        cleanSettings,
                        absence.startDate,
                        absence.endDate,
                        absence.userName || 'Mitarbeiter'
                    );
                    await setAutomaticReplies(absence.userId, graphSettings);
                } catch (error) {
                    console.error('Quick Approve: Error setting auto-reply:', error);
                }
            }
        } else {
            await absence.reject(approverId, approverEmail, 'Abgelehnt via Quick Link');
        }

        // Send Notification to Employee
        await sendApprovalResultNotification(
            approverId,
            absence.userId,
            action === 'approve' ? 'approved' : 'rejected',
            {
                type: absence.type,
                startDate: absence.startDate.toISOString().split('T')[0],
                endDate: absence.endDate.toISOString().split('T')[0],
                reason: absence.reason
            }
        );

        // 📋 Send handover notification to substitute (if handover enabled)
        if (action === 'approve' && absence.handover?.enabled && absence.substitute?.email) {
            try {
                console.log('📋 Sending handover notification from Quick Approve...');
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
                    if (substituteEntraId === approverId) {
                        console.log('📋 Manager is substitute, auto-acknowledging handover (Quick Link)...');
                        if (absence.handover) {
                            absence.set('handover.status', 'acknowledged');
                            absence.set('handover.acknowledgedAt', new Date());

                            console.log('📋 Sending Tracker Card to Manager (Quick Approve)...');
                            await sendHandoverTrackerCard(
                                approverId,
                                {
                                    id: absence.id,
                                    employeeName: absence.userName,
                                    startDate: new Date(absence.startDate).toISOString(),
                                    endDate: new Date(absence.endDate).toISOString(),
                                    items: absence.handover.items || []
                                }
                            );
                        }
                    } else {
                        await sendHandoverNotification(
                            approverId, // manager
                            substituteEntraId,
                            {
                                absenceId: absence.id,
                                employeeName: absence.userName,
                                startDate: new Date(absence.startDate).toLocaleDateString('de-DE'),
                                endDate: new Date(absence.endDate).toLocaleDateString('de-DE'),
                                totalDays: absence.totalDays,
                            },
                            absence.handover
                        );
                    }
                }
                absence.set('handover.notifiedAt', new Date());
                absence.set('substitute.notified', true);
                await absence.save();
                console.log('✅ Handover notification sent from Quick Approve');
            } catch (error) {
                console.error('❌ Error sending handover notification from quick approve:', error);
            }
        }

        // Success Response
        const responseType = action === 'approve' ? 'success' : 'error';
        const responseIcon = action === 'approve' ? '✅' : '❌';
        const responseTitle = action === 'approve' ? 'Erfolgreich genehmigt' : 'Antrag abgelehnt';
        const responseMessage = action === 'approve' 
            ? `Der Urlaubsantrag von <strong>${absence.userName}</strong> wurde genehmigt.`
            : `Der Urlaubsantrag von <strong>${absence.userName}</strong> wurde abgelehnt.`;

        return createBrandedHtmlResponse(
            responseType,
            responseIcon,
            responseTitle,
            responseMessage,
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`
        );

    } catch (error) {
        console.error('Quick approval error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
