# VitaTwin — Design System (Light Theme Only)

## Brand

- **Name:** VitaTwin
- **Feeling:** Clinical yet warm, hopeful, precise, trustworthy
- **Never:** Dark mode, neon cyber aesthetics, cluttered dashboards, pure black backgrounds

## Color Palette (Light Theme Only)

| Token                | Hex / Value          | Usage |
|----------------------|----------------------|-------|
| `--bg-page`          | `#FAFBFC` / warm off-white | Page background |
| `--bg-card`          | `#FFFFFF`            | Cards, panels |
| `--bg-subtle`        | `#F1F5F9`            | Secondary surfaces, table headers |
| `--primary`          | `#0D9488` (teal-600) | Primary actions, key highlights, twin accent |
| `--primary-hover`    | `#0F766E`            | Hover states |
| `--accent`           | `#38BDF8` (sky-400)  | Secondary accents, charts |
| `--text-primary`     | `#0F172A` (slate-900)| Headings, body |
| `--text-secondary`   | `#475569` (slate-600)| Supporting text |
| `--text-muted`       | `#64748B`            | Placeholders, timestamps |
| `--border`           | `#E2E8F0`            | Card borders, dividers |
| `--success`          | `#10B981`            | Positive trends, low risk |
| `--warning`          | `#F59E0B`            | Medium risk / caution |
| `--danger`           | `#EF4444`            | High risk / critical alerts |
| `--info`             | `#3B82F6`            | Informational |

**Rule:** No dark-mode CSS variables. No `dark:` Tailwind variants in production code.

## Typography

- **Font stack:** Bricolage Grotesque (headings) + Figtree (body), system-ui fallback
- Headings: medium–semibold weight, clear hierarchy
- Body: 15–16 px, comfortable line-height
- Numbers / metrics: tabular figures preferred for alignment

## Core Components

- **Cards:** White, soft shadow or 1 px border, 12–16 px radius
- **Buttons:** Primary (teal), Secondary (outline), Ghost, Destructive
- **Risk badges:** Color-coded pills (green / amber / red) with clear labels
- **Charts:** Soft fills, no harsh gridlines, tooltips with light background
- **Twin visualization:** Prefer abstract, calming representations (progress rings, gentle area charts, silhouette + data nodes) over alarming medical imagery
- **Empty / loading / error states:** Always designed — never leave blank screens
- **Forms:** Clear labels, helpful errors, accessible focus rings

## Layout Principles

1. **Breathing room** — generous whitespace
2. **Scannable hierarchy** — most important number/insight first
3. **Mobile-first responsive** — works at 375 px, 768 px, 1440 px
4. **Consistent card language** — same radius, padding, shadow across the app
5. **Status is always visible** — risk level, last updated, data freshness

## Key Screens (MVP)

1. **Landing / Login** — calm, trustworthy, clear synthetic-data notice
2. **Twin Dashboard** — hero twin summary + risk cards + recent alerts
3. **Vitals & Streams** — time-series of wearable data
4. **Insights & Alerts** — explainable predictions + recommendations
5. **Timeline / Memory** — how the twin has evolved
6. **Patient Profile** — synthetic demographics + EHR snapshot (read-only for PoC)

## Accessibility

- Sufficient contrast (WCAG AA minimum)
- Focus indicators visible
- Form labels associated correctly
- Color is never the only indicator of risk (always pair with text/icon)

## Logo Usage

- Primary logo: twin circles + ECG line in teal
- Use on light backgrounds only
- Clear space around logo equal to the height of one circle
- Prefer SVG for crispness at all sizes

---

*Any visual decision that contradicts “light theme only” or the calm clinical aesthetic must be rejected or recorded in DECISIONS.md with strong justification.*
