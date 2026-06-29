# Freyetag — Antigravity Agent Setup

## Inhalt

Dieses Paket enthält das komplette Agent-System für die Freyetag Absence Management App.

## Schnell-Setup

1. Kopiere den `.agents/` Ordner in dein Projekt-Root: `E:\claude\absence-management-app\.agents\`
2. Kopiere `mcp_config.json` in Antigravity: `...` → MCP Servers → Manage → View raw config → Inhalt einfügen
3. Erstelle den `docs/diagrams/` Ordner in deinem Projekt
4. Fertig — die Skills und Workflows sind sofort aktiv

## Enthaltene Dateien

### Rule (Always On)
- `freyetag-conventions.md` — Projekt-Konventionen die immer gelten

### Skills (6)
| Skill | Trigger | Zweck |
|---|---|---|
| freyetag-frontend | UI/Component Tasks | React, Tailwind, shadcn/ui Patterns |
| freyetag-backend | API/DB Tasks | Routes, Models, Services, Integrationen |
| freyetag-security | "audit", "security" | Read-only Security-Agent mit manager-tauglichen Berichten |
| freyetag-reviewer | "review", "prüfe" | Code Review nach jedem Task |
| freyetag-docs | "docs", "README" | Dokumentation + Diagramme (MCP) |
| freyetag-skill-updater | "update skills" | Hält Skills aktuell |

### Workflows (5)
| Command | Zweck |
|---|---|
| /feature | Feature implementieren + Self-Review |
| /audit | Manueller read-only Security-Review mit verstaendlichem Bericht |
| /deploy-check | Pre-Deployment Checkliste |
| /update-skills | Alle Skills aktualisieren |
| /generate-docs | Dokumentation + Diagramme generieren |

### MCP Server
| Server | Zweck |
|---|---|
| mcp-mermaid | Mermaid → SVG/PNG rendern |
| mermaid-server | Code → Diagramm generieren |

## Nutzung

```
# Feature implementieren
/feature Implementiere eine Health Check Route

# Projekt-weiter Audit
/audit

# Vor dem Deployment
/deploy-check

# Skills aktualisieren nach Code-Änderungen
/update-skills

# Komplette Dokumentation generieren
/generate-docs
```

