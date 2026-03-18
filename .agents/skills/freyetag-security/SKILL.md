---
name: freyetag-security
description: Security audit and hardening for the Freyetag Absence Management App. Scans API routes for missing RBAC, checks type consistency across the 5-role system, validates encryption, detects data leaks, and identifies vulnerabilities. Use when auditing security, checking for vulnerabilities, or hardening the application.
---

# Freyetag Security Audit

## When to use this skill
- Running a full security audit
- Checking for missing RBAC on API routes
- Verifying type consistency across all role definitions
- Checking for data leaks in API responses
- Reviewing encryption and credential storage
- Pre-deployment security check

## Audit procedure

### Step 1: Find unprotected routes
```bash
for f in $(find src/app/api -name "route.ts"); do
  if ! grep -q "requireRole\|requirePermission" "$f"; then
    echo "🔴 UNPROTECTED: $f"
  fi
done
```

### Step 2: Check 5-role consistency
Every file below MUST contain all 5 roles (employee, teamlead, manager, hr_manager, admin):
```bash
echo "=== next-auth.d.ts ==="
grep -n "role" src/types/next-auth.d.ts
echo "=== user.ts ==="
grep -n "role" src/types/user.ts
echo "=== User.ts model ==="
grep -n "enum" src/models/User.ts
echo "=== rbac.ts ==="
grep -n "Role" src/lib/rbac.ts
echo "=== permissions.ts ==="
grep -n "employee\|teamlead\|manager\|hr_manager\|admin" src/types/permissions.ts
```

### Step 3: Check canViewUserData
```bash
grep -A 25 "canViewUserData" src/lib/rbac.ts
```
Must handle: admin (return true), hr_manager (return true), manager (direct reports), teamlead (department), employee (self only).

### Step 4: Check for exposed secrets
```bash
grep -rn "clientSecret\|accessToken\|ENCRYPTION_KEY\|password" src/app/api/ --include="*.ts" | grep -v "Encrypted\|encrypted\|mask"
```

### Step 5: Check debug endpoints
```bash
grep -rn "NODE_ENV\|debug\|test" src/app/api/ --include="*.ts"
```

### Step 6: Check console.log in production
```bash
grep -rn "console\.log" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v "console\.error" | wc -l
```

### Step 7: TypeScript check
```bash
npx tsc --noEmit
```

### Step 8: Check for 'any' types
```bash
grep -rn ": any" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".d.ts" | wc -l
```

## Severity levels
- 🔴 CRITICAL: Missing auth, exposed secrets, data leaks → MUST fix immediately
- 🟡 HIGH: Missing ownership check, inconsistent roles, no input validation → Fix before launch
- 🟢 MEDIUM: any types, missing error handling, no loading states → Fix when possible
- ℹ️ INFO: Code style, documentation, optimization → Nice to have

## Report format
```
# Freyetag Security Audit — [DATE]

## Summary
- Critical: X
- High: X
- Medium: X
- Info: X
- Unprotected routes: X/Y
- TypeScript errors: X
- 'any' count: X

## Critical findings
### 🔴 [Title]
- Location: file:line
- Problem: description
- Fix: concrete fix
- Effort: X minutes

## Prioritized fix list
1. [Critical] ... (X min)
2. [High] ... (X min)
```
