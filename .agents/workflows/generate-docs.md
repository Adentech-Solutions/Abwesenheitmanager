---
name: generate-docs
description: Generates complete project documentation with architecture diagrams using MCP Mermaid servers. Creates README, API docs, setup guide, architecture overview with visual diagrams exported as SVG.
---

# Generate Documentation with Diagrams

## Step 1: Setup
```bash
mkdir -p docs/diagrams
```

## Step 2: Generate Architecture Diagram
Use the mermaid-server MCP tool `generate_diagram_from_code`:
- Input: src/app/api/ directory structure + src/lib/ services
- Type: architecture
- Save to: docs/diagrams/architecture-overview.svg

## Step 3: Generate Approval Flow Diagram
Use `generate_diagram_from_code`:
- Input: src/app/api/approvals/[id]/approve/route.ts
- Type: sequence
- Save to: docs/diagrams/approval-flow.svg

## Step 4: Generate Data Model Diagram
Use `generate_diagram_from_code`:
- Input: All files in src/models/
- Type: class/ER
- Save to: docs/diagrams/data-model.svg

## Step 5: Generate RBAC Diagram
Use mcp-mermaid to render stateDiagram from src/types/permissions.ts + src/lib/rbac.ts:
- Type: state
- Save to: docs/diagrams/rbac-states.svg

## Step 6: Generate Deployment Diagram
Use mcp-mermaid to render deployment architecture:
- Type: flowchart
- Save to: docs/diagrams/deployment.svg

## Step 7: Scan API Routes
```bash
for f in $(find src/app/api -name "route.ts" | sort); do
  methods=$(grep -o "export async function [A-Z]*" "$f" | awk '{print $4}')
  route=$(echo $f | sed 's|src/app||;s|/route.ts||;s|\[|{|g;s|\]|}|g')
  roles=$(grep -o "requireRole\[.*\]" "$f" | head -1)
  echo "$methods $route — $roles"
done
```

## Step 8: Generate API Documentation
Create docs/API.md grouped by category (Absences, Approvals, Admin, Analytics).
Include method, path, auth, description, request/response for each route.
Embed sequence diagrams for critical flows.

## Step 9: Generate Setup Guide
Read .env.example and auth.ts to create docs/SETUP.md:
Prerequisites, Azure AD setup, MongoDB, env vars, first run, admin creation.

## Step 10: Generate Architecture Doc
Create docs/ARCHITECTURE.md with embedded diagrams from Steps 2-6.
Sections: System Overview, Data Flow, Data Model, RBAC, Deployment.

## Step 11: Update README.md
Hero diagram (architecture-overview.svg), features, quick start, doc links.

## Step 12: Verify
- All SVG diagrams render correctly
- All Markdown links valid
- Env var list complete

## Step 13: Report
```
# Documentation Generated — [DATE]
Files: README.md, docs/ARCHITECTURE.md, docs/API.md, docs/SETUP.md
Diagrams: architecture-overview, approval-flow, data-model, rbac-states, deployment
```
