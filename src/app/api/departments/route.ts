import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/rbac';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
    try {
        // 🔒 Security: All authenticated users can read department list
        await requireRole(['employee', 'manager', 'admin']);

        await connectDB();

        const departments = await User.distinct('department', {
            department: { $ne: null, $exists: true }
        });

        // Filter out empty strings and sort
        const cleanDepartments = departments
            .filter(d => d && d.trim() !== '')
            .sort();

        return NextResponse.json({ departments: cleanDepartments });
    } catch (error) {
        console.error('Error fetching departments:', error);
        return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
    }
}
