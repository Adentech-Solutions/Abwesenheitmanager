import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/rbac';
import { createCalendarEvent } from '@/lib/graph-client';
import connectDB from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    // 🔒 Security: Any authenticated user can create their own calendar events
    const { dbUser } = await requireRole(['employee', 'manager', 'admin']);

    await connectDB();

    const body = await request.json();
    const result = await createCalendarEvent(dbUser.entraId, body);

    return NextResponse.json({ event: result });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}