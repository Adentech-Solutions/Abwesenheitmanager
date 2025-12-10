import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireRole } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { dbUser } = await requireRole(['employee', 'manager', 'admin']);

        // Determine manager details if managerEmail is present
        let managerName = 'Kein Manager zugewiesen';
        if (dbUser.managerEmail) {
            await connectDB();
            const manager = await User.findOne({ email: dbUser.managerEmail }).select('name');
            if (manager) {
                managerName = manager.name;
            }
        }

        const profile = {
            name: dbUser.name,
            email: dbUser.email,
            firstName: dbUser.firstName,
            lastName: dbUser.lastName,
            department: dbUser.department || 'Nicht angegeben',
            jobTitle: dbUser.jobTitle || 'Mitarbeiter',
            manager: {
                name: managerName,
                email: dbUser.managerEmail
            },
            vacationDays: dbUser.vacationDays,
            role: dbUser.role,
            startDate: dbUser.startDate,
        };

        return NextResponse.json(profile);
    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}


