---
name: audit
description: Runs a manual, read-only security audit on the Freyetag codebase and reports findings in clear German
---

# Full Project Security Audit Workflow

## Goal
Run a read-only security review of the repository.
- Do not edit files
- Do not implement fixes
- Prioritize repo-specific security risks
- Explain findings in German so non-technical stakeholders can follow them
- Use `.agents/skills/freyetag-security/REPORT_TEMPLATE.md` for the final structure

## Step 1: Map the risk surface
Inspect:
- API routes in `src/app/api`
- auth and RBAC in `src/lib/auth.ts` and `src/lib/rbac.ts`
- token logic in `src/lib/tokens.ts`
- rate limit helper in `src/lib/middleware/rateLimit.ts`
- Graph and Personio integrations
- encryption and integration config storage
- debug, cron, approval, and handover routes

## Step 2: Check auth and authorization
Review:
- routes missing `requireRole()` or `requirePermission()`
- custom auth flows that bypass shared guards
- ownership checks for user, absence, analytics, and handover data
- role coverage for `employee`, `teamlead`, `manager`, `hr_manager`, `admin`

## Step 3: Check repo-specific hotspots
Prioritize these patterns:
- `NEXTAUTH_SECRET` fallback or other secret fallbacks
- debug endpoints protected only by environment checks
- magic-link and action-token routes
- logging around tokens, credentials, Graph, Teams, and Personio
- missing rate limiting on sensitive routes
- over-broad API responses or stack traces

## Step 4: Run lightweight validation
Helpful non-mutating checks:
```powershell
npm run type-check
Get-ChildItem src\app\api -Recurse -Filter route.ts | Select-String -Pattern 'requireRole|requirePermission|CRON_SECRET|NODE_ENV|withRateLimit|safeParse|zod'
Get-ChildItem src -Recurse -File | Select-String -Pattern 'console\.log|accessToken|refreshToken|clientSecret|NEXTAUTH_SECRET|ENCRYPTION_KEY'
```

## Step 5: Generate the report
Produce a security report that:
- starts with `Kurzfazit`, `Zusammenfassung`, and `Top 3 zuerst pruefen`
- lists each finding with business impact and urgency
- clearly distinguishes `Bestaetigt` vs `Verdacht, bitte pruefen`
- gives file paths or modules for each finding
- contains no code edits, no patches, and no automatic remediation
