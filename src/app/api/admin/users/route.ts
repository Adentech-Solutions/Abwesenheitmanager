import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireRole } from '@/lib/rbac';
import { hash } from 'bcryptjs'; // Assuming bcryptjs is used, though simple pass might be used for dev. roadmap says "Password-free (leveraging Azure AD)". So maybe no password handling needed?
// Actually if using Azure AD, we probably don't create users with passwords here. 
// But the roadmap says "Create /api/admin/users endpoint (GET, PUT, DELETE)".
// I'll stick to non-password fields for now.

export async function GET(request: NextRequest) {
    try {
        const { user, dbUser } = await requireRole(['admin']);

        await connectDB();

        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        const query: any = {};

        if (role && role !== 'all') {
            query.role = role;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select('-__v')
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit);

        return NextResponse.json({
            users,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching users (Admin):', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { user, dbUser } = await requireRole(['admin']);
        await connectDB();

        const body = await request.json();

        // Basic validation
        if (!body.email || !body.name) {
            return NextResponse.json({ error: 'Name and Email are required' }, { status: 400 });
        }

        const existingUser = await User.findOne({ email: body.email });
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        const newUser = await User.create({
            ...body,
            isActive: true, // Default to active
            vacationDays: body.vacationDays || 30, // Default to 30
            role: body.role || 'employee'
        });

        return NextResponse.json({ user: newUser }, { status: 201 });

    } catch (error) {
        console.error('Error creating user (Admin):', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}
