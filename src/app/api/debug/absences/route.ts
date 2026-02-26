import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Absence from '@/models/Absence';

export async function GET() {
    try {
        await connectDB();
        const absences = await Absence.find({}).sort({ createdAt: -1 }).limit(20);
        return NextResponse.json({
            count: absences.length,
            absences: absences.map(a => ({
                id: a._id,
                user: a.userName,
                email: a.userEmail,
                status: a.status,
                start: a.startDate,
                end: a.endDate
            }))
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
