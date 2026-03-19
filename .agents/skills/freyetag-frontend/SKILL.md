---
name: freyetag-frontend
description: Frontend development for the Freyetag Absence Management App. Combines brand consistency (colors, typography, spacing) with creative design thinking (motion, composition, memorable details). Uses shadcn/ui via MCP server. Prevents generic AI aesthetics while enforcing the Freyetag design system. Use when building or modifying any page, component, or UI element.
---

# Freyetag Frontend Development

## When to use this skill
- Building new pages or modifying existing ones
- Creating or updating components
- Installing shadcn/ui components via MCP
- Fixing inconsistent styling or design

## Design Thinking (do this BEFORE writing code)

Before coding any page or component, think through these 4 questions:

1. **Who uses this?** Employee checking vacation? Manager approving? HR reviewing reports? Admin configuring? The role shapes the information hierarchy.
2. **What's the key moment?** Every page has ONE thing the user came for. Make that thing impossible to miss. Everything else supports it.
3. **What makes it feel good?** A subtle animation when approval succeeds. A satisfying hover state. A number that counts up. Details make the difference between "functional" and "delightful".
4. **What would make this forgettable?** Generic card grid. No animation. Gray on white on gray. If you can swap your page into any other SaaS and nobody notices, you failed.

Then build it — within the Freyetag brand system, but with creative confidence.

## NEVER (the generic AI trap)

These patterns make every SaaS look the same. Avoid them:
- Generic card grids with no visual hierarchy (all cards same size, same weight)
- Pages that are just a table with a title above it
- Buttons that all look identical with no primary/secondary distinction
- Empty states that are just text saying "Keine Daten"
- Loading states that are a single centered spinner
- Forms that are just stacked inputs with no grouping or flow
- Purple gradients, generic system fonts, cookie-cutter layouts

## Motion and Micro-Interactions

Motion makes the app feel alive. Use it intentionally:

### Page load: staggered reveal
```tsx
<div className="animate-in fade-in slide-in-from-bottom-4 duration-300" 
     style={{ animationDelay: `${index * 75}ms` }}>
  <Card>...</Card>
</div>
```

### Approval success: satisfying feedback
```tsx
<div className={cn(
  "transition-all duration-500",
  justApproved && "ring-2 ring-success-500 ring-offset-2"
)}>
```

### Hover states that respond
```tsx
<Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
<TableRow className="transition-colors hover:bg-gray-50">
<Button className="transition-transform active:scale-95">
```

### Skeleton loading that matches layout
```tsx
if (isLoading) return (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 w-48 bg-gray-200 rounded" />
    <div className="grid gap-6 md:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 bg-gray-200 rounded-xl" />
      ))}
    </div>
    <div className="h-64 bg-gray-200 rounded-xl" />
  </div>
);
```

## Visual Composition

### Create hierarchy through size contrast
The most important element should be dramatically larger. A vacation balance of "18 Tage" should dominate at text-3xl. Secondary stats are half the size.

### Use color to guide the eye
One primary action per section gets the blue button. Everything else is outline or ghost. If everything is blue, nothing is blue.

### Group with whitespace, not borders
Sections separated by space-y-8. Cards group related content. No horizontal lines between sections.

### Empty states tell a story
```tsx
<div className="text-center py-16">
  <div className="mx-auto w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mb-4">
    <Calendar className="h-8 w-8 text-primary-400" />
  </div>
  <h3 className="text-base font-semibold text-gray-900">Noch keine Abwesenheiten</h3>
  <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
    Erstelle deinen ersten Urlaubsantrag und dein Manager wird automatisch benachrichtigt.
  </p>
  <Button className="mt-6" size="sm">
    <Plus className="h-4 w-4 mr-2" />Urlaub beantragen
  </Button>
</div>
```

### Stats cards with personality
```tsx
<Card className="relative overflow-hidden transition-all duration-200 hover:shadow-md">
  <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full bg-primary-50 opacity-50" />
  <CardContent className="pt-6 relative">
    <div className="flex items-center gap-4">
      <div className="p-2.5 rounded-xl bg-primary-50">
        <Calendar className="h-5 w-5 text-primary-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">Resturlaub</p>
        <p className="text-3xl font-bold text-gray-900 tabular-nums">18</p>
        <p className="text-xs text-gray-400 mt-0.5">von 30 Tagen</p>
      </div>
    </div>
  </CardContent>
</Card>
```

## Brand System (non-negotiable)

### Wordmark
```tsx
<span className="font-medium tracking-tight">
  <span className="text-gray-900 dark:text-gray-100">freye</span>
  <span className="text-primary-600 dark:text-primary-400">tag</span>
</span>
```
Always lowercase, always together, never separated.

### Colors
```
Primary:    #2563EB (actions, links, "tag" in wordmark)
            #60A5FA (dark mode), #DBEAFE (backgrounds), #EFF6FF (ghost)
Success:    #059669 / #D1FAE5 — approved, completed
Warning:    #D97706 / #FFFBEB — pending, attention
Danger:     #DC2626 / #FEF2F2 — rejected, errors
Gray:       900/600/400/200/50 — text hierarchy
```
NEVER use arbitrary hex values or raw Tailwind colors.

### Typography
```
Page title:     text-2xl font-bold text-gray-900
Page subtitle:  text-sm text-gray-600 mt-1
Section head:   text-lg font-semibold text-gray-900
Card title:     text-base font-semibold text-gray-900
Body:           text-sm text-gray-600
Meta:           text-xs text-gray-400
Stats:          text-3xl font-bold text-gray-900 tabular-nums
```

### Spacing
```
Page padding:     px-4 sm:px-6 lg:px-8 py-8 (via DashboardLayout)
Section gap:      space-y-8
Card padding:     p-6
Grid gap:         gap-6
Form fields:      space-y-4
Button groups:    gap-3
```

### Role badges (FIXED everywhere)
```tsx
const ROLE_STYLES = {
  employee:   'bg-success-50 text-success-600',
  teamlead:   'bg-warning-50 text-warning-600',
  manager:    'bg-primary-50 text-primary-600',
  hr_manager: 'bg-purple-50 text-purple-600',
  admin:      'bg-danger-50 text-danger-600',
};
```

### Status badges (FIXED everywhere)
```tsx
const STATUS_STYLES = {
  pending:   'bg-warning-50 text-warning-600',
  approved:  'bg-success-50 text-success-600',
  rejected:  'bg-danger-50 text-danger-600',
  cancelled: 'bg-gray-100 text-gray-500',
};
```

## shadcn/ui Components

Use shadcn MCP to browse, search, install:
- "Show me all shadcn components"
- "Add the data-table component"
- CLI: `npx shadcn@latest add [component]`
- Before installing: `ls src/components/ui/`

Rules:
- shadcn/ui is the ONLY component library
- No custom Button, Card, Input — use shadcn
- No raw `<button>` or `<input>` — use components

## Page Template
```tsx
'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function PageName() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['unique-key'],
    queryFn: async () => {
      const res = await fetch('/api/endpoint');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  if (isLoading) return (
    <DashboardLayout>
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Seitentitel</h1>
            <p className="text-sm text-gray-600 mt-1">Beschreibung</p>
          </div>
          <Button><Plus className="h-4 w-4 mr-2" />Neu</Button>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((item, i) => (
            <div key={item.id}
              className="animate-in fade-in slide-in-from-bottom-4 duration-300"
              style={{ animationDelay: `${i * 75}ms` }}>
              <Card className="transition-all hover:shadow-md hover:-translate-y-0.5">
                <CardContent className="pt-6">...</CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
```

## Mutation Pattern
```tsx
const mutation = useMutation({
  mutationFn: async (data) => {
    const res = await fetch('/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['related-key'] });
    toast.success('Erfolgreich gespeichert');
  },
  onError: (err: any) => toast.error(err.message),
});
```

## Role-Based Visibility
```tsx
const role = (session?.user as any)?.role;
const isManagerOrAbove = ['manager', 'teamlead', 'hr_manager', 'admin'].includes(role);
const isHROrAdmin = ['hr_manager', 'admin'].includes(role);
const isAdminOnly = role === 'admin';
```

## Icons (lucide-react)
Users, UserPlus, Shield, Calendar, Clock, Settings, Building2,
RefreshCw, Edit2, Trash2, Plus, Search, ChevronLeft, CheckCircle2,
AlertTriangle, Cloud, Download, Upload, FileText, BarChart3, Mail

## Migration Checklist (when touching existing pages)
- [ ] Uses shadcn components (not custom)
- [ ] No raw HTML buttons or inputs
- [ ] Colors from brand palette only
- [ ] Role badges use ROLE_STYLES
- [ ] Status badges use STATUS_STYLES
- [ ] Loading state matches page layout shape
- [ ] Empty state has icon + text + CTA
- [ ] Cards have hover transition
- [ ] Page sections use staggered animation
- [ ] All UI text in German