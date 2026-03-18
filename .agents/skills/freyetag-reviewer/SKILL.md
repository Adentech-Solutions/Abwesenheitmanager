---
name: freyetag-reviewer
description: Automated code review for the Freyetag Absence Management App. Reviews changed files for security, type safety, RBAC consistency, data integrity, and code quality. Use after any code change, after completing a task, or when asked to review code. Triggers on words like review, prüfe, check, audit.
---

# Freyetag Code Reviewer

## When to use this skill
- After any development task is completed
- When the user says "review", "prüfe", or "check"
- When a REVIEW TRIGGER block is present in the conversation
- Before committing code

## Review process

1. Identify changed files (from conversation context or ask the user)
2. Read each changed file with the view tool
3. Run `npx tsc --noEmit`
4. Check each item below
5. Produce the verdict

## Checklist

### Security
- [ ] Every API route has requireRole() or requirePermission()
- [ ] Correct roles listed (all 5 considered)
- [ ] Ownership checks present (manager=direct reports, teamlead=department)
- [ ] Inputs validated (Zod or manual)
- [ ] No secrets in responses
- [ ] Error format consistent: { error: string }

### Types
- [ ] Role type consistent across next-auth.d.ts, user.ts, User.ts, rbac.ts, permissions.ts
- [ ] No unnecessary 'any' types
- [ ] New interfaces in src/types/

### RBAC
- [ ] canViewUserData() handles all 5 roles
- [ ] Sidebar shows correct items per role
- [ ] Layout guards allow correct roles

### Data
- [ ] vacationDays.used adjusted on cancellation
- [ ] personioAbsenceId cleared on cancellation
- [ ] No race conditions (findOneAndUpdate preferred)
- [ ] No duplicate indexes

### Quality
- [ ] No console.log (only console.error)
- [ ] React Query invalidation after mutations
- [ ] Loading states on pages
- [ ] German UI text

## Verdict

- ✅ APPROVED — 0 critical, 0 high
- ⚠️ APPROVED WITH NOTES — 0 critical, has high/medium
- ❌ CHANGES REQUESTED — has critical findings

## Report format
```
# Review: [files]
## Verdict: ✅/⚠️/❌

### 🔴 [CRITICAL] Title
- File: path, line ~X
- Problem: what
- Fix: how
- Effort: X min

### 🟡 [HIGH] ...
### 🟢 [MEDIUM] ...

## Summary: X critical, X high, X medium
## Fix order: 1. ... 2. ...
```

When ❌: Write copy-pasteable fix instructions for the developer.
