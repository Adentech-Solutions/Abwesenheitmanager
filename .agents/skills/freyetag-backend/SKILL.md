---
name: freyetag-backend
description: Backend development for the Freyetag Absence Management App. Helps with API routes, Mongoose models, services, middleware, Graph API, Personio API, and Teams Bot integration. Use when building or modifying API endpoints, database models, or server-side services.
---

# Freyetag Backend Development

## When to use this skill
- Creating or modifying API routes (src/app/api/)
- Working with Mongoose models (src/models/)
- Building services (src/lib/services/)
- Integrating with Graph API, Personio, or Teams
- Writing middleware (rate limiting, audit)

## API Route template
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/rbac';
import connectDB from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { user, dbUser } = await requireRole(['employee', 'manager', 'hr_manager', 'admin']);
    await connectDB();
    
    // Business logic here
    
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error:', error);
    if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## Role-to-route mapping
| Route type | requireRole |
|---|---|
| Own data (absences, stats) | ['employee', 'teamlead', 'manager', 'hr_manager', 'admin'] |
| Team data (approvals, calendar) | ['manager', 'teamlead', 'hr_manager', 'admin'] |
| Analytics / reports | ['manager', 'hr_manager', 'admin'] |
| User management | ['hr_manager', 'admin'] |
| Department management | ['hr_manager', 'admin'] |
| System settings | ['admin'] |
| Integrations (Personio, etc.) | ['admin'] |
| Sync triggers | ['admin'] |

## Ownership checks
```typescript
// Manager: only direct reports
if (dbUser.role === 'manager') {
  const target = await User.findOne({ email: absence.userEmail });
  if (target?.managerId !== dbUser.entraId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
// TeamLead: only same department
if (dbUser.role === 'teamlead') {
  const target = await User.findOne({ email: absence.userEmail });
  if (target?.department !== dbUser.department) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
// hr_manager + admin: no restriction
```

## Mongoose model pattern
```typescript
import mongoose, { Schema, Model } from 'mongoose';

interface IMyModel { name: string; isActive: boolean; }
interface IMyModelDocument extends IMyModel, mongoose.Document {}

const MySchema = new Schema<IMyModelDocument>({
  name: { type: String, required: true, unique: true, trim: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const MyModel = (mongoose.models.MyModel as Model<IMyModelDocument>) 
  || mongoose.model<IMyModelDocument>('MyModel', MySchema);
export default MyModel;
```

## Existing services reference
- `src/lib/graph-client.ts` — getGraphUser, getUserManager, getUserDirectReports, getEntraGroups, getGroupMembers, getEntraUsers
- `src/lib/graph-client-delegated.ts` — sendTeamsMessageDelegated (requires active session)
- `src/lib/teams-bot.ts` — sendApprovalNotification, sendHandoverNotification, Adaptive Cards
- `src/lib/services/personioClient.ts` — authenticate, getEmployees, getAbsenceBalance, createAbsencePeriod, deleteAbsencePeriod
- `src/lib/services/personioSync.ts` — syncPersonioEmployees, writeBackAbsenceToPersonio, cancelAbsenceInPersonio
- `src/lib/services/entraGroupSync.ts` — syncEntraGroups, fetchEntraGroupsPreview
- `src/lib/services/analyticsService.ts` — calculateAnalytics, getAnalyticsByDepartment

## Approval event chain (order matters)
After approval, 6 steps execute sequentially — each in own try/catch:
1. `absence.approve()` — set status
2. `updateVacationBalance()` — local balance
3. `createCalendarEvent()` — Outlook
4. `setAutomaticReplies()` — Auto-Reply
5. `sendTeamsNotification()` — Adaptive Card
6. `writeBackToPersonio()` — LAST, non-blocking

## Input validation
Use Zod for POST/PUT body validation:
```typescript
import { z } from 'zod';
const schema = z.object({ name: z.string().min(1), bundesland: z.enum(['BW','BY',...]) });
const parsed = schema.safeParse(body);
if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
```
