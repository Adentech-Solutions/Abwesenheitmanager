// GET /api/users/team - Fetch team members for substitute selection

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/rbac';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
    try {
        const { user, dbUser } = await requireRole(['employee', 'manager', 'admin']);

        await connectDB();

        const { searchParams } = new URL(request.url);
        const searchQuery = searchParams.get('q');

        // Find team members: same department OR same manager's reports
        // Exclude the current user
        const query: any = {
            isActive: true,
            email: { $ne: dbUser.email },
        };

        if (searchQuery) {
            // If there's a search term, search *all* users by name or email
            query.$or = [
                { name: { $regex: searchQuery, $options: 'i' } },
                { email: { $regex: searchQuery, $options: 'i' } }
            ];
        } else {
            // Build OR conditions for team membership as defaults
            const orConditions: any[] = [];

            // Same department
            if (dbUser.department) {
                orConditions.push({ department: dbUser.department });
            }

            // Same manager's reports (colleagues under same manager)
            if (dbUser.managerId) {
                orConditions.push({ managerId: dbUser.managerId });
            }

            // If manager, include direct reports
            if (dbUser.role === 'manager') {
                orConditions.push({ managerId: dbUser.entraId });
            }

            // Admin can see everyone
            if (dbUser.role === 'admin') {
                // No additional filter needed — just exclude self
            } else if (orConditions.length > 0) {
                query.$or = orConditions;
            }
        }

        const members = await User.find(query)
            .select('entraId email name department jobTitle')
            .sort({ name: 1 })
            .limit(100);

        const formatted = members.map((m) => ({
            userId: m.entraId,
            email: m.email,
            name: m.name,
            department: m.department || undefined,
            jobTitle: m.jobTitle || undefined,
        }));

        return NextResponse.json({ members: formatted });
    } catch (error: any) {
        console.error('Error fetching team members:', error);
        if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
    }
}
