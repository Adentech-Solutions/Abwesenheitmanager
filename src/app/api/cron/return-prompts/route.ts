import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Absence from '@/models/Absence';
import { sendReturnPromptCard } from '@/lib/teams-bot';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // Auth handled via cron secret (satisfies requireRole / requirePermission audit)
    // Require CRON_SECRET to be configured — fail loudly if missing
    if (!process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
    }

    // Basic API Key protection for cron endpoints
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        await connectDB();

        // Find all active absences with handover enabled that are ending tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

        const endingAbsences = await Absence.find({
            status: 'approved',
            'handover.enabled': true,
            endDate: {
                $gte: tomorrow,
                $lt: dayAfterTomorrow
            }
        });

        let sentCount = 0;

        for (const absence of endingAbsences) {
            // Check if substitute exists and notification wasn't already sent/summary written
            if (!absence.substitute?.userId) continue;
            if (absence.handover?.returnSummary?.content) continue; // Already written

            try {
                await sendReturnPromptCard(absence.substitute.userId, {
                    id: absence.id,
                    employeeName: absence.userName,
                    endDate: new Date(absence.endDate).toLocaleDateString('de-DE')
                });
                sentCount++;
            } catch (cardError) {
                console.error(`Failed to send return prompt for absence ${absence.id}:`, cardError);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${endingAbsences.length} absences. Sent ${sentCount} prompts.`
        });

    } catch (error) {
        console.error('Error in return prompts cron:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
