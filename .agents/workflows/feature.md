---
name: feature
description: Implements a new feature with automatic code review
---

# Feature Implementation Workflow

## Step 1: Understand
Read the feature request carefully. Identify:
- Which files need to be created or modified
- Which roles need access
- Whether external APIs are involved (Personio, Graph, Teams)

## Step 2: Implement
Follow the freyetag-backend and freyetag-frontend skills.
Write the code following all project conventions.

## Step 3: Verify
Run `npx tsc --noEmit` and confirm 0 errors.

## Step 4: Self-Review
Switch to reviewer mode. Apply the freyetag-reviewer checklist to your own changes:
- Security: requireRole on all new routes?
- Types: all 5 roles considered?
- Data: integrity maintained?
- Quality: loading states, German text, error handling?

## Step 5: Report
List all changes and the review verdict:
```
## Changes
- Created: [files]
- Modified: [files]

## Review: ✅/⚠️/❌
[findings if any]

## tsc --noEmit: PASSED
```

If verdict is ❌, fix the issues and re-review before reporting.
