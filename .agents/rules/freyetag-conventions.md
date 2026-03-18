# Freyetag Project Conventions

## Project
Freyetag is an Absence Management SaaS for the German market with deep Microsoft 365 integration.

## Tech Stack
- Next.js 14 App Router, TypeScript 5.9, React 18
- MongoDB/Mongoose 8, NextAuth.js v4 (Azure AD / Entra ID)
- Microsoft Graph API, Teams Bot, Personio API v1+v2
- Tailwind CSS, shadcn/ui, React Query v5, Zod, react-hot-toast

## 5-Role RBAC System
The app has 5 roles. ALWAYS consider all 5 when writing code:
- employee: Basic user, own absences only
- teamlead: Department-scoped approval (delegated)
- manager: Team approval + analytics (from Entra ID direct reports)
- hr_manager: Org-wide view, vacation management, reports
- admin: Full system access, settings, integrations

Role type MUST be consistent across these files:
- src/types/next-auth.d.ts (Session + JWT)
- src/types/user.ts (IUser.role)
- src/models/User.ts (Mongoose enum)
- src/lib/rbac.ts (Role type export)
- src/types/permissions.ts (DEFAULT_ROLE_PERMISSIONS)

## API Route Pattern
Every API route MUST follow this pattern:
```typescript
export async function POST(request: NextRequest) {
  try {
    const { user, dbUser } = await requireRole(['manager', 'hr_manager', 'admin']);
    await connectDB();
    // ... business logic
    return NextResponse.json({ data });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

## Code Style
- German text in UI, English in code comments
- No console.log in production — only console.error for real errors
- No emoji in log statements
- Use existing components from src/components/ui/ (Card, Button, Input, Modal)
- DashboardLayout wrapper on all pages
- Skeleton loaders for loading states
- react-hot-toast for success/error notifications

## External API Calls
Personio, Graph API, and Teams Bot calls MUST be:
- In their own try/catch block
- NON-BLOCKING (app continues if external service fails)
- The LAST steps in any flow (approval succeeds regardless)

## After Every Task
1. Run `npx tsc --noEmit` — MUST pass with 0 errors
2. List all changed files
