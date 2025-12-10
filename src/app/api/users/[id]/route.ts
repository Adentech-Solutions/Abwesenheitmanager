import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireRole, canViewUserData } from '@/lib/rbac';

// GET /api/users/[id] - Get single user details
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { user, dbUser } = await requireRole(['employee', 'manager', 'admin']);

        await connectDB();

        // Check if looking up by MongoDB _id or Entra ID
        // The previous code might have used either. Let's assume we search by Entra ID first as it's more stable, or _id.
        // However, the params.id usually refers to the route parameter.

        // Attempt to find by Entra ID first, then _id
        let targetUser = await User.findOne({ entraId: params.id }).select('-__v');
        if (!targetUser) {
            // Try as MongoDB ID
            if (params.id.match(/^[0-9a-fA-F]{24}$/)) {
                targetUser = await User.findById(params.id).select('-__v');
            }
        }

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 🔒 Security: Check data access permissions
        // canViewUserData checks if admin, self, or manager of user
        const canView = await canViewUserData(dbUser, targetUser.entraId);
        if (!canView) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({ user: targetUser });
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }
}

// PUT /api/users/[id] - Update user details
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { user, dbUser } = await requireRole(['admin', 'manager']); // Only Managers/Admins can update

        await connectDB();

        let targetUser = await User.findOne({ entraId: params.id });
        if (!targetUser && params.id.match(/^[0-9a-fA-F]{24}$/)) {
            targetUser = await User.findById(params.id);
        }

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const body = await request.json();

        // 🔒 Security: specific checks
        if (dbUser.role !== 'admin') {
            // Managers can only update their direct reports
            if (targetUser.managerId !== dbUser.entraId) {
                return NextResponse.json({ error: 'Forbidden: Can only update direct reports' }, { status: 403 });
            }

            // Managers cannot change roles or sensitive Admin fields
            if (body.role && body.role !== targetUser.role) {
                return NextResponse.json({ error: 'Forbidden: Cannot change user role' }, { status: 403 });
            }
            if (body.vacationDays !== undefined && body.vacationDays !== targetUser.vacationDays) {
                // Maybe managers CAN change vacation days? "Vacation Allocation" is usually Admin.
                // Roadmap says: "Implementation of vacation day allocation" is an Admin task.
                return NextResponse.json({ error: 'Forbidden: Cannot change vacation days' }, { status: 403 });
            }
        }

        // Update allowed fields
        // Ensure we don't accidentally update immutable fields like entraId or email via this route if we don't want to
        const allowedUpdates = ['managerId', 'department', 'isActive'];
        if (dbUser.role === 'admin') {
            allowedUpdates.push('role', 'vacationDays', 'name', 'email');
        }

        // Apply updates
        Object.keys(body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                (targetUser as any)[key] = body[key];
            }
        });

        await targetUser.save();

        return NextResponse.json({ user: targetUser });
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}
