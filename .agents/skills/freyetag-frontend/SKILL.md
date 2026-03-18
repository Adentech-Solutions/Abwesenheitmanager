---
name: freyetag-frontend
description: Frontend development for the Freyetag Absence Management App. Helps with React components, pages, forms, modals, tables, dashboards, Tailwind styling, and shadcn/ui patterns. Use when building or modifying any page, component, or UI element.
---

# Freyetag Frontend Development

## When to use this skill
- Building new pages (src/app/)
- Creating or modifying components (src/components/)
- Styling with Tailwind CSS
- Working with React Query hooks
- Building forms, modals, tables, dashboards

## Component library
Use existing components — do NOT create new ones unless necessary:
- `src/components/ui/Card.tsx` — Card wrapper
- `src/components/ui/Button.tsx` — Buttons (variants: primary, outline, danger)
- `src/components/ui/Input.tsx` — Text inputs
- `src/components/ui/Modal.tsx` — Dialog/Modal
- `src/components/ui/Skeleton.tsx` — Loading placeholders
- `src/components/layout/DashboardLayout.tsx` — Page wrapper
- `src/components/layout/Sidebar.tsx` — Navigation (role-based visibility)

## Page structure pattern
Every page follows this structure:
```tsx
'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

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

  if (isLoading) return <DashboardLayout><Skeleton /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Title</h1>
        {/* content */}
      </div>
    </DashboardLayout>
  );
}
```

## Role-based UI visibility
Check role for conditional rendering:
```tsx
const isManagerOrAbove = ['manager', 'teamlead', 'hr_manager', 'admin'].includes(role);
const isHROrAdmin = ['hr_manager', 'admin'].includes(role);
const isAdminOnly = role === 'admin';
```

## Role badge colors
- employee: `bg-green-50 text-green-700`
- teamlead: `bg-yellow-50 text-yellow-700`
- manager: `bg-blue-50 text-blue-700`
- hr_manager: `bg-purple-50 text-purple-700`
- admin: `bg-red-50 text-red-700`

## Styling conventions
- Tailwind utility classes only (no custom CSS files)
- Gray scale: gray-50 to gray-900
- Primary color: primary-600 (blue)
- Spacing: space-y-6 for page sections, gap-4 for grids
- Cards: bg-white rounded-xl border border-gray-200 p-6
- Tables: divide-y divide-gray-200
- All text in German

## Mutation pattern
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

## Icons
Use lucide-react icons. Common ones:
Users, UserPlus, Shield, Calendar, Clock, Settings, Building2,
RefreshCw, Edit2, Trash2, Plus, Search, ChevronLeft, CheckCircle2,
AlertTriangle, Cloud, Download, Upload
