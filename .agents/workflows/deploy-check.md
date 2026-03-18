---
name: deploy-check
description: Pre-deployment checklist for Freyetag — verifies build, types, security, and environment
---

# Pre-Deployment Check Workflow

## Step 1: Build Check
```bash
npx tsc --noEmit
```
Must pass with 0 errors. If not, fix before proceeding.

## Step 2: Security Quick Scan
```bash
for f in $(find src/app/api -name "route.ts"); do
  if ! grep -q "requireRole\|requirePermission" "$f"; then
    echo "UNPROTECTED: $f"
  fi
done
grep -rn "NODE_ENV" src/app/api/ --include="*.ts"
```

## Step 3: Environment Variables Check
Verify these are documented in .env.example:
- NEXTAUTH_URL
- NEXTAUTH_SECRET
- MONGODB_URI
- AZURE_AD_CLIENT_ID
- AZURE_AD_CLIENT_SECRET
- AZURE_AD_TENANT_ID
- ENCRYPTION_KEY
- NEXT_PUBLIC_APP_URL

## Step 4: Console Cleanup
```bash
grep -rn "console\.log" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v "console\.error"
```
Remove all console.log statements (keep console.error).

## Step 5: Health Check Route
Verify GET /api/health exists and returns { status: 'ok' }.
If not, create it.

## Step 6: Report
```
# Deploy Check — [DATE]
- TypeScript: ✅/❌
- Unprotected routes: X
- Debug endpoints: X
- Env vars documented: ✅/❌
- Console.log count: X
- Health check: ✅/❌
- READY TO DEPLOY: YES/NO
```
