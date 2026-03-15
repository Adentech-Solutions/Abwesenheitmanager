// POST & GET /api/handover/[absenceId]/acknowledge
// POST: Authenticated acknowledge (substitute only)
// GET: Magic link acknowledge (token-based)

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/rbac';
import connectDB from '@/lib/mongodb';
import Absence from '@/models/Absence';
import User from '@/models/User';
import { verifyActionToken } from '@/lib/tokens';
import { sendHandoverAcknowledged, sendHandoverTrackerCard } from '@/lib/teams-bot';
import { auditLog } from '@/lib/middleware/audit';

export const dynamic = 'force-dynamic';

/**
 * POST — Authenticated acknowledge endpoint
 * Used by the web app when substitute is logged in
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { absenceId: string } }
) {
  try {
    const { dbUser } = await requireRole(['employee', 'manager', 'admin']);

    await connectDB();

    const absence = await Absence.findById(params.absenceId);
    if (!absence) {
      return NextResponse.json({ error: 'Absence not found' }, { status: 404 });
    }

    // Security: verify the authenticated user IS the substitute
    if (absence.substitute?.email !== dbUser.email) {
      return NextResponse.json({ error: 'Forbidden: You are not the substitute for this absence' }, { status: 403 });
    }

    // Don't re-acknowledge
    if (absence.handover?.acknowledgedAt) {
      return NextResponse.json({ message: 'Already acknowledged' });
    }

    // Set acknowledged timestamps
    absence.set('handover.acknowledgedAt', new Date());
    absence.set('substitute.acknowledgedAt', new Date());
    await absence.save();

    const substituteName = dbUser.name || 'Vertretung';

    // Send Teams notification to employee
    try {
      await sendHandoverAcknowledged(
        dbUser.entraId,
        absence.userId,
        substituteName,
      );
    } catch (error) {
      console.error('Failed to send handover acknowledged notification:', error);
      // Non-critical
    }

    // Phase 1b: Send Tracker Card to substitute
    try {
      if (dbUser.entraId) {
        await sendHandoverTrackerCard(dbUser.entraId, {
          id: absence.id,
          employeeName: absence.userName,
          startDate: new Date(absence.startDate).toISOString(),
          endDate: new Date(absence.endDate).toISOString(),
          items: absence.handover?.items || []
        });
      }
    } catch (error) {
      console.error('Failed to send handover tracker card:', error);
    }

    // Audit log
    await auditLog(
      dbUser.entraId,
      dbUser.email,
      'updated',
      'absence',
      params.absenceId,
      [{ field: 'handover.acknowledgedAt', oldValue: null, newValue: new Date().toISOString() }],
      request,
    );

    return NextResponse.json({ success: true, message: 'Handover acknowledged' });
  } catch (error: any) {
    console.error('Error acknowledging handover:', error);
    return NextResponse.json({ error: 'Failed to acknowledge handover' }, { status: 500 });
  }
}

/**
 * GET — Magic link acknowledge endpoint
 * Called when substitute clicks "Zur Kenntnis genommen" in Teams card
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { absenceId: string } }
) {
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
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; text-align: center; padding: 50px; background-color: #f9fafb;">
            <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto;">
              <h1 style="color: #e11d48;">Ungültiger oder abgelaufener Link</h1>
              <p style="color: #4b5563;">Dieser Link ist nicht mehr gültig. Bitte loggen Sie sich in die App ein.</p>
            </div>
          </body>
        </html>
      `, { status: 400, headers: { 'Content-Type': 'text/html' } });
    }

    if (payload.action !== 'acknowledge') {
      return new NextResponse('Invalid action', { status: 400 });
    }

    await connectDB();

    const absence = await Absence.findById(params.absenceId);
    if (!absence) {
      return new NextResponse('Absence not found', { status: 404 });
    }

    // Already acknowledged?
    if (absence.handover?.acknowledgedAt) {
      return new NextResponse(`
        <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; text-align: center; padding: 50px; background-color: #f9fafb;">
            <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto;">
              <h1 style="color: #f59e0b;">Bereits bestätigt ✅</h1>
              <p style="color: #4b5563;">Sie haben diese Übergabe bereits zur Kenntnis genommen.</p>
              <p style="margin-top: 20px;">
                <a href="about:blank" onclick="window.close()" style="color: #6b7280; text-decoration: underline; cursor: pointer;">Fenster schließen</a>
              </p>
            </div>
          </body>
        </html>
      `, { status: 200, headers: { 'Content-Type': 'text/html' } });
    }

    // Set acknowledged timestamps
    absence.set('handover.acknowledgedAt', new Date());
    absence.set('substitute.acknowledgedAt', new Date());
    await absence.save();

    // Find substitute user for name
    const substituteUser = await User.findOne({ entraId: payload.approverId });
    const substituteName = substituteUser?.name || 'Vertretung';

    // Send Teams notification to employee
    try {
      await sendHandoverAcknowledged(
        payload.approverId,
        absence.userId,
        substituteName,
      );
    } catch (error) {
      console.error('Failed to send handover acknowledged notification:', error);
    }

    // Phase 1b: Send Tracker Card to substitute
    try {
      await sendHandoverTrackerCard(payload.approverId, {
        id: absence.id,
        employeeName: absence.userName,
        startDate: new Date(absence.startDate).toISOString(),
        endDate: new Date(absence.endDate).toISOString(),
        items: absence.handover?.items || []
      });
    } catch (error) {
      console.error('Failed to send handover tracker card:', error);
    }

    // Success response
    return new NextResponse(`
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; text-align: center; padding: 50px; background-color: #f9fafb;">
          <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto;">
            <h1 style="color: #16a34a;">Übergabe bestätigt ✅</h1>
            <p style="color: #4b5563; font-size: 1.1rem; margin-top: 20px;">
              Sie haben die Übergabe von <strong>${absence.userName}</strong> zur Kenntnis genommen.
            </p>
            <p style="color: #6b7280; margin-top: 10px;">
              ${absence.userName} wurde benachrichtigt.
            </p>
            <p style="margin-top: 30px;">
              <a href="about:blank" onclick="window.close()" style="color: #6b7280; text-decoration: underline; cursor: pointer;">Fenster schließen</a>
            </p>
          </div>
        </body>
      </html>
    `, { status: 200, headers: { 'Content-Type': 'text/html' } });

  } catch (error) {
    console.error('Handover acknowledge error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
