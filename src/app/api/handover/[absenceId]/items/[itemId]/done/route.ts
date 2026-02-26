import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Absence from '@/models/Absence';
import { verifyActionToken } from '@/lib/tokens';
import { sendHandoverTrackerCard } from '@/lib/teams-bot';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { absenceId: string, itemId: string } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return new NextResponse('Missing token', { status: 400 });
        }

        const payload = verifyActionToken(token);

        if (!payload || payload.action !== 'mark_done' || payload.itemId !== params.itemId) {
            return new NextResponse(`
                <html>
                    <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                        <h1 style="color: #e11d48;">Ungültiger oder abgelaufener Link</h1>
                        <p>Dieser Link ist nicht gültig.</p>
                    </body>
                </html>
            `, { status: 400, headers: { 'Content-Type': 'text/html' } });
        }

        await connectDB();

        const absence = await Absence.findById(params.absenceId);
        if (!absence || !absence.handover) {
            return new NextResponse('Absence or handover not found', { status: 404 });
        }

        const item = absence.handover.items.find((i: any) => i.id === params.itemId);
        if (!item) {
            return new NextResponse('Item not found', { status: 404 });
        }

        if (item.status === 'done') {
            return new NextResponse(`
                <html>
                    <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                        <h1 style="color: #f59e0b;">Bereits erledigt ✅</h1>
                        <p>Dieser Vorgang wurde bereits abgeschlossen.</p>
                        <p style="margin-top: 20px;">
                            <a href="about:blank" onclick="window.close()" style="color: #6b7280; text-decoration: underline;">Schließen</a>
                        </p>
                    </body>
                </html>
            `, { status: 200, headers: { 'Content-Type': 'text/html' } });
        }

        // Mark as done
        item.status = 'done';
        item.completedAt = new Date();

        absence.markModified('handover.items');
        await absence.save();

        // Refresh the tracker card for the substitute (so they get a fresh updated view)
        try {
            await sendHandoverTrackerCard(payload.approverId, {
                id: absence.id,
                employeeName: absence.userName,
                startDate: new Date(absence.startDate).toISOString(),
                endDate: new Date(absence.endDate).toISOString(),
                items: absence.handover.items || []
            });
        } catch (e) { console.error('Error refreshing card', e); }

        return new NextResponse(`
            <html>
                <body style="font-family: sans-serif; text-align: center; padding: 50px; background-color: #f9fafb;">
                    <div style="background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto;">
                        <h1 style="color: #16a34a;">Vorgang erledigt! ✅</h1>
                        <p style="color: #4b5563; font-size: 1.1rem; margin-top: 20px;">
                            Der Vorgang <strong>${item.title}</strong> wurde als erledigt markiert.
                        </p>
                        <p style="margin-top: 20px; font-size: 0.9rem; color: #6b7280;">
                            Es wurde Ihnen eine aktualisierte Übersichts-Karte in Teams geschickt.
                        </p>
                        <p style="margin-top: 30px;">
                            <a href="about:blank" onclick="window.close()" style="color: #6b7280; text-decoration: underline;">Schließen</a>
                        </p>
                    </div>
                </body>
            </html>
        `, { status: 200, headers: { 'Content-Type': 'text/html' } });
    } catch (error) {
        console.error('Error marking item done via magic link:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
