import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Absence from '@/models/Absence';
import { verifyActionToken } from '@/lib/tokens';
import { sendHandoverTrackerCard } from '@/lib/teams-bot';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { absenceId: string } }
) {
    // This serves the HTML form for adding a note
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const itemId = searchParams.get('itemId');

    if (!token) return new NextResponse('Missing token', { status: 400 });

    const payload = verifyActionToken(token);
    if (!payload || payload.action !== 'add_note' || payload.itemId !== itemId) {
        return new NextResponse('<html><body><h1>Ungültiger Link</h1></body></html>', { status: 400, headers: { 'Content-Type': 'text/html' } });
    }

    try {
        await connectDB();
        const absence = await Absence.findById(params.absenceId);
        if (!absence) return new NextResponse('Not found', { status: 404 });

        const item = absence.handover?.items?.find((i: any) => i.id === itemId);
        const itemName = item ? item.title : 'Allgemeine Notiz';

        return new NextResponse(`
            <html>
                <body style="font-family: sans-serif; background-color: #f9fafb; padding: 50px;">
                    <div style="background: white; padding: 40px; border-radius: 10px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                        <h2 style="color: #111827; margin-top: 0;">Notiz hinzufügen</h2>
                        <p style="color: #4b5563; font-size: 0.9rem;">Zu Vorgang: <strong>${itemName}</strong></p>
                        <form method="POST" action="/api/handover/${params.absenceId}/add-note" style="margin-top: 20px;">
                            <input type="hidden" name="token" value="${token}" />
                            <input type="hidden" name="itemId" value="${itemId || ''}" />
                            <textarea name="note" rows="4" required placeholder="Ihre Notiz hier eingeben..." style="width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 12px; font-family: inherit; margin-bottom: 20px; box-sizing: border-box;"></textarea>
                            <button type="submit" style="background-color: #3b82f6; color: white; padding: 12px 24px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; width: 100%;">Speichern</button>
                        </form>
                    </div>
                </body>
            </html>
        `, { status: 200, headers: { 'Content-Type': 'text/html' } });
    } catch (e) {
        return new NextResponse('Error', { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { absenceId: string } }
) {
    // This handles the form submission
    try {
        const formData = await request.formData();
        const token = formData.get('token') as string;
        const note = formData.get('note') as string;

        if (!token || !note?.trim()) return new NextResponse('Missing data', { status: 400 });

        const payload = verifyActionToken(token);
        if (!payload || payload.action !== 'add_note') return new NextResponse('Invalid token', { status: 400 });

        await connectDB();
        const absence = await Absence.findById(params.absenceId);
        if (!absence || !absence.handover) return new NextResponse('Not found', { status: 404 });

        // Add note
        const newNote = {
            id: crypto.randomUUID(),
            content: note.trim(),
            createdAt: new Date(),
            createdBy: payload.approverId,
            createdByName: 'Vertretung',
        };

        if (!absence.handover.activityNotes) {
            absence.handover.activityNotes = [];
        }
        absence.handover.activityNotes.push(newNote);
        absence.markModified('handover.activityNotes');
        await absence.save();

        // Resend Tracker Card
        try {
            await sendHandoverTrackerCard(payload.approverId, {
                id: absence.id,
                employeeName: absence.userName,
                startDate: new Date(absence.startDate).toISOString(),
                endDate: new Date(absence.endDate).toISOString(),
                items: absence.handover?.items || []
            });
        } catch (e) { console.error('Card failed', e); }

        return new NextResponse(`
            <html>
                <body style="font-family: sans-serif; text-align: center; padding: 50px; background-color: #f9fafb;">
                    <div style="background: white; padding: 40px; border-radius: 10px; max-width: 500px; margin: 0 auto;">
                        <h1 style="color: #16a34a;">Notiz gespeichert! ✅</h1>
                        <p>Ihre Notiz wurde erfolgreich hinzugefügt.</p>
                        <p style="margin-top: 30px;">
                            <a href="about:blank" onclick="window.close()" style="color: #6b7280; text-decoration: underline;">Schließen</a>
                        </p>
                    </div>
                </body>
            </html>
        `, { status: 200, headers: { 'Content-Type': 'text/html' } });

    } catch (e) {
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
