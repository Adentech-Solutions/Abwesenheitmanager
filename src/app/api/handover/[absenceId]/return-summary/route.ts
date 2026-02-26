import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Absence from '@/models/Absence';
import { verifyActionToken } from '@/lib/tokens';
import { sendWelcomeBackCard } from '@/lib/teams-bot';
import User from '@/models/User';
import { getGraphUser } from '@/lib/graph-client';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { absenceId: string } }
) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) return new NextResponse('Missing token', { status: 400 });

    const payload = verifyActionToken(token);
    if (!payload || payload.action !== 'return_summary') {
        return new NextResponse('<html><body><h1>Ungültiger Link</h1></body></html>', { status: 400, headers: { 'Content-Type': 'text/html' } });
    }

    try {
        await connectDB();
        const absence = await Absence.findById(params.absenceId);
        if (!absence || !absence.handover) return new NextResponse('Not found', { status: 404 });

        if (absence.handover.returnSummary?.content) {
            return new NextResponse(`
                <html>
                    <body style="font-family: sans-serif; text-align: center; padding: 50px; background-color: #f9fafb;">
                        <h1 style="color: #f59e0b;">Bereits eingereicht</h1>
                        <p>Sie haben bereits eine Rückkehr-Zusammenfassung geschrieben.</p>
                        <p style="margin-top: 30px;">
                            <a href="about:blank" onclick="window.close()" style="color: #6b7280; text-decoration: underline;">Schließen</a>
                        </p>
                    </body>
                </html>
            `, { status: 200, headers: { 'Content-Type': 'text/html' } });
        }

        return new NextResponse(`
            <html>
                <body style="font-family: sans-serif; background-color: #f9fafb; padding: 50px;">
                    <div style="background: white; padding: 40px; border-radius: 10px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                        <h2 style="color: #111827; margin-top: 0;">Übergabe-Zusammenfassung</h2>
                        <p style="color: #4b5563; font-size: 0.95rem;">
                            <strong>${absence.userName}</strong> kehrt bald zurück. Bitte schreiben Sie eine kurze Zusammenfassung über die wichtigsten Ereignisse während der Abwesenheit.
                        </p>
                        <form method="POST" action="/api/handover/${params.absenceId}/return-summary" style="margin-top: 20px;">
                            <input type="hidden" name="token" value="${token}" />
                            <textarea name="summary" rows="6" required placeholder="Was ist passiert? Welche Aufgaben sind noch offen?" style="width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 12px; font-family: inherit; margin-bottom: 20px; box-sizing: border-box;"></textarea>
                            <button type="submit" style="background-color: #3b82f6; color: white; padding: 12px 24px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; width: 100%;">Absenden</button>
                        </form>
                    </div>
                </body>
            </html>
        `, { status: 200, headers: { 'Content-Type': 'text/html' } });
    } catch (e) {
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { absenceId: string } }
) {
    try {
        const formData = await request.formData();
        const token = formData.get('token') as string;
        const summary = formData.get('summary') as string;

        if (!token || !summary?.trim()) return new NextResponse('Missing data', { status: 400 });

        const payload = verifyActionToken(token);
        if (!payload || payload.action !== 'return_summary') return new NextResponse('Invalid token', { status: 400 });

        await connectDB();
        const absence = await Absence.findById(params.absenceId);
        if (!absence || !absence.handover) return new NextResponse('Not found', { status: 404 });

        // Save Summary
        absence.handover.returnSummary = {
            content: summary.trim(),
            createdAt: new Date(),
            createdBy: payload.approverId,
        };
        absence.markModified('handover.returnSummary');
        await absence.save();

        // Find Employee Entra ID to send Welcome Back
        const employeeUser = await User.findOne({ email: absence.userEmail });
        let employeeEntraId = employeeUser?.entraId;

        if (!employeeEntraId) {
            try {
                const graphUser = await getGraphUser(absence.userEmail);
                if (graphUser?.id) employeeEntraId = graphUser.id;
            } catch (e) { }
        }

        if (employeeEntraId) {
            const substituteName = absence.substitute?.name || 'Ihre Vertretung';
            await sendWelcomeBackCard(employeeEntraId, {
                employeeName: absence.userName,
                substituteName: substituteName,
                summary: summary.trim()
            });
        }

        return new NextResponse(`
            <html>
                <body style="font-family: sans-serif; text-align: center; padding: 50px; background-color: #f9fafb;">
                    <div style="background: white; padding: 40px; border-radius: 10px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                        <h1 style="color: #16a34a;">Vielen Dank! ✅</h1>
                        <p>Die Zusammenfassung wurde sicher gespeichert und wird ${absence.userName} bei der Rückkehr gesendet.</p>
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
