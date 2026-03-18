---
name: freyetag-docs
description: Generates and maintains documentation with architecture diagrams for the Freyetag Absence Management App. Uses MCP Mermaid servers to create visual diagrams from code analysis. Generates README, API docs, setup guides, architecture docs with flowcharts, sequence diagrams, ER diagrams, and state diagrams. Use when asked to document, create README, generate API docs, create diagrams, visualize architecture, or explain code visually.
---

# Freyetag Documentation Generator (with Diagrams)

## When to use this skill
- Creating or updating documentation
- Generating architecture diagrams from code
- Visualizing API flows, approval chains, data models
- Explaining complex code visually
- Keywords: document, docs, README, diagram, visualize, architecture, flow, explain

## MCP Tools available

This skill uses two MCP Mermaid servers:

### mcp-mermaid (Rendering)
- Renders Mermaid code to SVG/PNG files
- Use for: Final export of diagrams to docs/diagrams/

### mermaid-server (Code Analysis + Generation)
- Analyzes source code and generates diagrams automatically
- Tool: `generate_diagram_from_code` — give it source code, get a diagram
- Tool: `create_workflow_diagram` — describe a process, get a flowchart
- Tool: `analyze_diagram` — improve existing diagrams
- Tool: `export_diagram_formats` — export to SVG/PNG/PDF

## Diagram types for Freyetag

### 1. Architecture Overview
Generate from codebase structure. Use `generate_diagram_from_code` with src/app/api/ and src/lib/.
```mermaid
graph TD
    subgraph Presentation
        Pages[Next.js Pages]
        Components[React Components]
    end
    subgraph API["API Layer (50+ Routes)"]
        Auth[requireRole/requirePermission]
        Routes[API Routes]
    end
    subgraph Services
        Personio[personioClient]
        Graph[graph-client]
        Teams[teams-bot]
    end
    subgraph Data
        MongoDB[(MongoDB)]
        Models[Mongoose Models]
    end
    subgraph External
        EntraID[Azure AD / Entra ID]
        PersonioAPI[Personio API]
        GraphAPI[Microsoft Graph]
        TeamsAPI[Teams Bot Framework]
    end
    Pages --> Routes
    Routes --> Auth
    Auth --> Models
    Models --> MongoDB
    Routes --> Personio & Graph & Teams
    Personio --> PersonioAPI
    Graph --> GraphAPI
    Teams --> TeamsAPI
    Pages -.->|SSO| EntraID
```

### 2. Approval Flow (Sequence Diagram)
Generate from src/app/api/approvals/[id]/approve/route.ts:
```mermaid
sequenceDiagram
    participant U as Mitarbeiter
    participant App as Freyetag
    participant M as Manager
    participant DB as MongoDB
    participant OL as Outlook
    participant T as Teams
    participant P as Personio
    U->>App: POST /api/absences
    App->>DB: Absence.create(pending)
    App->>T: Adaptive Card an Manager
    M->>App: POST /api/approvals/:id/approve
    App->>DB: absence.approve()
    App->>DB: updateVacationBalance()
    App->>OL: createCalendarEvent()
    App->>OL: setAutomaticReplies()
    App->>T: sendApprovalNotification()
    App-->>P: writeBackToPersonio() [non-blocking]
```

### 3. Data Model (ER Diagram)
Generate from src/models/:
```mermaid
erDiagram
    User ||--o{ Absence : creates
    User }o--|| Department : belongs_to
    Absence ||--o| Handover : has
    Department ||--o{ User : contains
    User {
        string entraId PK
        string email
        enum role
        string department
        object vacationDays
    }
    Absence {
        ObjectId id PK
        string userEmail FK
        enum status
        date startDate
        date endDate
    }
```

### 4. RBAC State Diagram
```mermaid
stateDiagram-v2
    [*] --> Employee: Login via Entra ID
    Employee --> Manager: Hat Direct Reports
    Employee --> TeamLead: Manuell zugewiesen
    Employee --> HRManager: Manuell zugewiesen
    Employee --> Admin: Manuell zugewiesen
```

### 5. Deployment Architecture
```mermaid
graph LR
    Browser -->|HTTPS| Vercel[Next.js on Vercel]
    Teams -->|Webhook| Vercel
    Vercel --> Atlas[(MongoDB Atlas)]
    Vercel -->|OAuth| Entra[Entra ID]
    Vercel -->|Graph API| M365[Microsoft 365]
    Vercel -->|API| Personio
```

## Documentation structure

### docs/ARCHITECTURE.md
Embed diagrams with: `![Title](./diagrams/filename.svg)`
Sections: System Overview, Data Flow, Data Model, RBAC, Deployment

### docs/API.md
For each route: Method, Path, Auth, Description, Body, Response, Errors.
Group by: Absences, Approvals, Admin, Analytics.
Embed sequence diagrams for complex flows.

### docs/SETUP.md
Prerequisites, Azure AD setup, MongoDB, env vars, first run, admin creation.

### README.md
Hero diagram, features, quick start, links to docs.

## Commands for scanning
```bash
# Route inventory
for f in $(find src/app/api -name "route.ts" | sort); do
  methods=$(grep -o "export async function [A-Z]*" "$f" | awk '{print $4}')
  route=$(echo $f | sed 's|src/app||;s|/route.ts||;s|\[|{|g;s|\]|}|g')
  echo "$methods $route"
done

# Model inventory
for f in src/models/*.ts; do echo "=== $(basename $f .ts) ==="; grep -E "type:|required:|enum:" "$f" | head -10; done

# Env vars used
grep -rn "process.env\." src/ --include="*.ts" | grep -v node_modules | sed 's/.*process\.env\.\([A-Z_]*\).*/\1/' | sort -u
```

## Style guide for diagrams
- German labels (Mitarbeiter, Genehmigung, Urlaubsantrag)
- Max 15-20 nodes per diagram
- Save as SVG to docs/diagrams/
- Naming: kebab-case (architecture-overview.svg, approval-flow.svg)
