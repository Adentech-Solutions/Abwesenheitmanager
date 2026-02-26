import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Absence from '@/models/Absence';
import User from '@/models/User';
import { getGraphUser } from '@/lib/graph-client';
import { verifyActionToken } from '@/lib/tokens';
import { sendApprovalResultNotification, sendHandoverNotification, sendHandoverTrackerCard } from '@/lib/teams-bot';

export const dynamic = 'force-dynamic'; // Ensure this route is not cached

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return new NextResponse('Missing token', { status: 400 });
        }

        const payload = verifyActionToken(token);

        if (!payload) {
            return new NextResponse(`
            <html>
                <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: #e11d48;">Ungültiger oder abgelaufener Link</h1>
                    <p>Dieser Link ist nicht mehr gültig. Bitte loggen Sie sich in das Dashboard ein, um den Antrag zu bearbeiten.</p>
                </body>
            </html>
        `, { status: 400, headers: { 'Content-Type': 'text/html' } });
        }

        const { absenceId, action, approverId } = payload;

        await connectDB();
        const absence = await Absence.findById(absenceId);

        if (!absence) {
            return new NextResponse('Absence not found', { status: 404 });
        }

        if (absence.status !== 'pending') {
            return new NextResponse(`
            <html>
                <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: #f59e0b;">Bereits bearbeitet</h1>
                    <p>Dieser Antrag wurde bereits ${absence.status === 'approved' ? 'genehmigt' : 'abgelehnt'}.</p>
                </body>
            </html>
        `, { status: 200, headers: { 'Content-Type': 'text/html' } });
        }

        // Perform Action
        const approver = await User.findOne({ entraId: approverId });
        const approverEmail = approver ? approver.email : 'system@absence-app.com';

        if (action === 'approve') {
            await absence.approve(approverId, approverEmail);
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
        return new NextResponse(`
            <html>
                <body style="font-family: sans-serif; text-align: center; padding: 50px; background-color: #f9fafb;">
                    <div style="background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); max-width: 500px; margin: 0 auto;">
                        <h1 style="color: ${action === 'approve' ? '#16a34a' : '#d97706'};">
                            ${action === 'approve' ? 'Erfolgreich genehmigt! ✅' : 'Erfolgreich abgelehnt! ☑️'}
                        </h1>
                        <p style="color: #4b5563; font-size: 1.1rem; margin-top: 20px;">
                            Der Urlaubsantrag von <strong>${absence.userName}</strong> wurde bearbeitet.
                        </p>
                        <p style="margin-top: 30px;">
                            <a href="about:blank" onclick="window.close()" style="color: #6b7280; text-decoration: underline; cursor: pointer;">Fenster schließen</a>
                        </p>
                    </div>
                </body>
            </html>
        `, { status: 200, headers: { 'Content-Type': 'text/html' } });

    } catch (error) {
        console.error('Quick approval error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
