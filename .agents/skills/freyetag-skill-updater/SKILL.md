---
name: freyetag-skill-updater
description: Keeps all Freyetag agent skills, rules, and workflows up to date when the codebase changes. Detects outdated references in skill files (wrong roles, missing routes, renamed files, new models) and updates them. Use after major refactoring, adding new models, new roles, new API routes, or changing project conventions.
---

# Freyetag Skill Updater

## When to use this skill
- After adding new API routes, models, or services
- After changing the role system
- After major refactoring
- Keywords: "update skills", "sync skills", "skills aktualisieren"

## Step 1: Scan current codebase state
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
For each skill file, check:

### freyetag-conventions.md (Rule)
- [ ] Tech stack versions correct?
- [ ] Role list matches Mongoose enum?
- [ ] API pattern matches actual conventions?

### freyetag-backend/SKILL.md
- [ ] Role-to-route mapping matches actual requireRole() calls?
- [ ] Service reference list matches src/lib/services/?
- [ ] Model pattern matches actual models?

### freyetag-frontend/SKILL.md
- [ ] Component list matches src/components/ui/?
- [ ] Role badge colors match admin/users/page.tsx?

### freyetag-security/SKILL.md
- [ ] Bash commands work (correct paths)?
- [ ] Files to check list accurate?

### freyetag-reviewer/SKILL.md
- [ ] Checklist items still relevant?
- [ ] Role handling checks up to date?

### freyetag-docs/SKILL.md
- [ ] Diagram templates match current architecture?
- [ ] MCP tool references correct?

### Workflows
- [ ] /feature steps match development process?
- [ ] /audit commands correct?
- [ ] /deploy-check env vars complete?
- [ ] /generate-docs steps accurate?

## Step 4: Apply updates
For each inconsistency: read skill file → update outdated section → verify under 12,000 chars.

## Step 5: Report
```
# Skill Update Report — [DATE]

## Files scanned
- API routes: X, Models: X, Services: X, Pages: X

## Updates applied
### [skill-name]
- Section: [which], Old: [what], New: [what], Reason: [why]

## No changes needed
- [list unchanged skills]
```

## Rules
- NEVER remove information — only update or add
- Keep each file under 12,000 characters
- After updating, read file back to verify
- If new model/service exists that no skill covers, suggest a new section
