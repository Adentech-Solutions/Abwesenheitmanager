---
name: freyetag-branding
description: Brand identity guidelines for the Freyetag Absence Management App. Enforces consistent use of the wordmark, color palette, typography, and visual language across all touchpoints. Uses Figma MCP server for design asset creation. Use when building UI, creating marketing material, updating the wordmark, or checking brand consistency.
---

# Freyetag Brand Identity

## When to use this skill
- Building any page or component (check colors, typography)
- Creating marketing material, landing pages, presentations
- Updating the wordmark or favicon
- Checking brand consistency across the app
- Keywords: brand, logo, colors, wordmark, design, style, Figma

## The Wordmark

The Freyetag brand is a pure wordmark. No icon, no symbol, no logo graphic.

### Rules
- Always written as one word: **freyetag** — never "Freyetag", "FreyeTag", "FREYETAG", or "Freye Tag"
- "freye" in the text color (dark on light, light on dark)
- "tag" in brand blue (#2563EB light mode, #60A5FA dark mode)
- No space, no separator, no dot between "freye" and "tag"
- Font: System sans-serif (Inter, SF Pro, Segoe UI) — weight 500 (medium)
- Letter-spacing: -0.5px at large sizes, -0.3px at small sizes

### Implementation
```tsx
// React component
<span className="font-medium tracking-tight">
  <span className="text-gray-900 dark:text-gray-100">freye</span>
  <span className="text-primary-600 dark:text-primary-400">tag</span>
</span>
```

```css
/* CSS */
.wordmark { font-weight: 500; letter-spacing: -0.5px; }
.wordmark-freye { color: var(--color-text-primary); }
.wordmark-tag { color: #2563EB; }
@media (prefers-color-scheme: dark) {
  .wordmark-tag { color: #60A5FA; }
}
```

### Sizes
| Context | Font Size | Letter Spacing |
|---|---|---|
| Hero / Landing page | 48-52px | -1px |
| Page header | 28-36px | -0.5px |
| Navbar | 16-18px | -0.3px |
| Footer / small | 13-14px | -0.2px |

### What NOT to do
- Never add a logo icon next to the wordmark
- Never write "tag" in a different font weight than "freye"
- Never underline, italicize, or add effects to the wordmark
- Never put the wordmark on a background that makes "freye" unreadable
- Never abbreviate to "FT" or "ft"

## Favicon / App Icon
Until a logo icon is designed, use the letter "g" in brand blue:
- Background: #2563EB
- Letter: #60A5FA
- Font: System sans-serif, weight 500
- Sizes: 16px, 32px, 180px (Apple Touch)

## Color Palette

### Primary Colors
| Name | Hex | Usage |
|---|---|---|
| Brand Blue | #2563EB | "tag" in wordmark, primary buttons, active states, links |
| Brand Blue Light | #60A5FA | "tag" in dark mode, hover states |
| Brand Blue Deep | #1D4ED8 | Button hover, pressed states |
| Brand Blue Pale | #DBEAFE | Light backgrounds, badges, tags |
| Brand Blue Ghost | #EFF6FF | Subtle backgrounds |

### Semantic Colors
| Name | Hex | Usage |
|---|---|---|
| Success | #059669 | Approved, completed, positive |
| Success Light | #D1FAE5 | Success backgrounds |
| Warning | #D97706 | Pending, attention needed |
| Warning Light | #FFFBEB | Warning backgrounds |
| Danger | #DC2626 | Rejected, errors, destructive actions |
| Danger Light | #FEF2F2 | Danger backgrounds |

### Neutral Scale
| Name | Hex | Usage |
|---|---|---|
| Gray 900 | #111827 | Headings, primary text (light mode) |
| Gray 600 | #4B5563 | Body text |
| Gray 400 | #9CA3AF | Placeholders, secondary text |
| Gray 200 | #E5E7EB | Borders, dividers |
| Gray 50 | #F9FAFB | Page background |
| White | #FFFFFF | Card backgrounds |

### Dark Mode
| Light Mode | Dark Mode | Usage |
|---|---|---|
| Gray 900 | #F1F5F9 | Primary text |
| Gray 600 | #94A3B8 | Secondary text |
| Gray 50 | #0F172A | Page background |
| White | #1E293B | Card backgrounds |
| #2563EB | #60A5FA | Brand blue |
| #DBEAFE | #1E293B | Blue backgrounds |

### Color Rules
- NEVER use arbitrary hex values — always from this palette
- NEVER use raw Tailwind colors (blue-500, green-500) — use semantic names
- Primary blue is for interactive elements ONLY — not for decorative backgrounds
- Success/Warning/Danger are for STATUS ONLY — not for branding or decoration
- Every colored background needs text from the same color family (not black/white)

## Typography

### Font Stack
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Scale
| Element | Size | Weight | Color |
|---|---|---|---|
| Page title | 24px (text-2xl) | 700 (bold) | gray-900 |
| Page subtitle | 14px (text-sm) | 400 (normal) | gray-600 |
| Section heading | 18px (text-lg) | 600 (semibold) | gray-900 |
| Card title | 16px (text-base) | 600 (semibold) | gray-900 |
| Body text | 14px (text-sm) | 400 (normal) | gray-600 |
| Small / meta | 12px (text-xs) | 400 (normal) | gray-400 |
| Stats number | 30px (text-3xl) | 700 (bold) | gray-900 |
| Button | 14px (text-sm) | 500 (medium) | white / gray-900 |

### Rules
- Only two weights in body: 400 (normal) and 600 (semibold)
- Wordmark uses 500 (medium) — this weight is ONLY for the wordmark
- Never use 300 (light) or 800/900 (extra bold)
- All UI text in German
- Sentence case everywhere — never Title Case or ALL CAPS (except wordmark subtitle "ABWESENHEIT" if used)

## Role Badge Colors (FIXED)
```tsx
const ROLE_STYLES = {
  employee:   'bg-success-50 text-success-600',
  teamlead:   'bg-warning-50 text-warning-600',
  manager:    'bg-primary-50 text-primary-600',
  hr_manager: 'bg-purple-50 text-purple-600',
  admin:      'bg-danger-50 text-danger-600',
};
```

## Status Badge Colors (FIXED)
```tsx
const STATUS_STYLES = {
  pending:   'bg-warning-50 text-warning-600',
  approved:  'bg-success-50 text-success-600',
  rejected:  'bg-danger-50 text-danger-600',
  cancelled: 'bg-gray-100 text-gray-500',
};
```

## Spacing System
```
Page padding:     px-4 sm:px-6 lg:px-8 py-8
Section gap:      space-y-8
Card padding:     p-6
Grid gap:         gap-6
Form fields:      space-y-4
Button groups:    gap-3
Label to input:   mt-1
Heading to desc:  mt-1
```

## Visual Language
- Corners: rounded-xl for cards, rounded-lg for buttons/inputs, rounded-full for badges/avatars
- Shadows: shadow-sm on cards (never shadow-lg or shadow-xl)
- Borders: border border-gray-200 on cards and inputs
- Transitions: transition-colors duration-150 on interactive elements
- Hover on cards: hover:shadow-md transition-shadow

## Brand Voice (for generated text)
- Professional but warm — not corporate, not casual
- Direct — say what it does, no buzzwords
- German first — "Abwesenheitsverwaltung" not "Absence Management"
- Tagline:  "Dein Team. Immer im Bild."
- Never say "KI-gestützt", "revolutionär", "game-changer"