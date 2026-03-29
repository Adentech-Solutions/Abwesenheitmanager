import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/rbac';

export async function GET() {
    await requireRole(['employee', 'teamlead', 'manager', 'hr_manager', 'admin']);
    return NextResponse.json({ message: 'Not implemented' }, { status: 501 });
}
