---
name: audit
description: Runs a full security and quality audit on the Freyetag codebase
---

# Full Project Audit Workflow

## Step 1: Route Security Scan
```bash
for f in $(find src/app/api -name "route.ts"); do
  if ! grep -q "requireRole\|requirePermission" "$f"; then
    echo "UNPROTECTED: $f"
  fi
done
```

## Step 2: Role Consistency Check
Verify all 5 roles exist in:
- src/types/next-auth.d.ts
- src/types/user.ts
- src/models/User.ts
- src/lib/rbac.ts
- src/types/permissions.ts

## Step 3: canViewUserData Check
Read src/lib/rbac.ts and verify canViewUserData handles:
- admin → return true
- hr_manager → return true
- manager → direct reports check
- teamlead → department check
- employee → self only

## Step 4: Data Integrity Check
- Does DELETE /api/absences/[id] reset vacationDays on cancellation?
- Does it clear personioAbsenceId?
- Are there duplicate Mongoose indexes?

## Step 5: TypeScript Check
```bash
npx tsc --noEmit
```

## Step 6: Code Quality
```bash
grep -rn "console\.log" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | wc -l
grep -rn ": any" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".d.ts" | wc -l
```

## Step 7: Generate Report
Produce a full audit report with severity levels, specific findings,
concrete fixes, effort estimates, and a prioritized fix list.
