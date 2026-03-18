---
name: update-skills
description: Scans the Freyetag codebase and updates all agent skills, rules, and workflows to match current state
---

# Update Skills Workflow

## Step 1: Scan codebase
```bash
echo "=== ROUTES ===" && find src/app/api -name "route.ts" | wc -l
echo "=== MODELS ===" && ls src/models/*.ts | wc -l
echo "=== SERVICES ===" && ls src/lib/services/*.ts 2>/dev/null | wc -l
echo "=== COMPONENTS ===" && find src/components -name "*.tsx" | wc -l
echo "=== ROLES ===" && grep "enum:" src/models/User.ts -A 5
echo "=== PERMISSIONS ===" && grep "'" src/types/permissions.ts | wc -l
```

## Step 2: Read all skill files
Read each file in .agents/skills/*/SKILL.md and .agents/rules/*.md

## Step 3: Compare and find inconsistencies
For each skill file, check if:
- Referenced files still exist
- Role lists are complete (all 5)
- Route patterns match actual code
- Component lists match actual components
- Service references match actual services

## Step 4: Apply updates
Edit each skill file that has outdated information.
Keep changes minimal — only update what actually changed.

## Step 5: Verify
- Each skill file is under 12,000 characters
- Read updated files back to confirm correctness

## Step 6: Report
```
# Skills Update — [DATE]
Updated: [list of updated skill files]
No changes: [list of unchanged skill files]
Changes made: [summary of each change]
```
