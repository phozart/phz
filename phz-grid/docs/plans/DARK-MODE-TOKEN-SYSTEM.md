# Dark Mode + Unified Token System — Design Specification

**Task**: Sprint 5, Task #4
**Status**: DESIGN ONLY — do not modify source code until Task #2 (coverage) merges
**Date**: 2026-03-05

---

## Executive Summary

The grid already has a partial three-layer token system in `packages/grid/src/tokens.ts`
(BrandTokens, SemanticTokens, ComponentTokens). However:

1. The system only covers `phz-grid` — the four admin packages each have their own
   shared-styles files with hundreds of hardcoded hex values.
2. Dark-mode values are completely absent — no `@media (prefers-color-scheme: dark)`
   rules anywhere in the codebase.
3. The semantic layer mixes grid-specific tokens with general-purpose tokens.
4. Admin packages use a `--phz-color-primary` fallback pattern but never define
   the token; it cascades from nowhere.

This document specifies the full unified token system and the dark-mode strategy.

---

## 1. Current Token Inventory (packages/grid/src/tokens.ts)

### Already defined (keep, expand for dark mode)

The `tokens.ts` file defines three layers with good coverage for the grid component.
The neutral scale and semantic colors provide a strong foundation:

```
Neutral scale: neutral-50 (#FAFAF9) through neutral-900 (#1C1917)
Primary:       #3B82F6 (blue-500), hover: #2563EB (blue-600)
Secondary:     #8B5CF6 (violet-500)
Success:       #22C55E (green-500)
Warning:       #F59E0B (amber-500)
Danger:        #EF4444 (red-500)
Info:          #3B82F6 (same as primary)
```

### Gaps in the existing system

- No dark-mode values for any token
- No `surface-*` tokens (background hierarchy: page, card, elevated, sunken)
- No `text-*` semantic tokens (primary, secondary, muted, inverse, disabled)
- No `border-*` semantic tokens (default, strong, subtle)
- No `status-bg-*` tokens (green/amber/red tinted backgrounds)
- No `interactive-*` tokens (selected-item-bg, active-item-bg used in admin packages)
- No widget-specific tokens (chart colors, sparkline bar)
- Shadow tokens use hardcoded `rgba(28,25,23,...)` — needs dark-mode equivalents

---

## 2. Color Inventory — All Hardcoded Values Found

### Neutral scale (all packages — already mapped to primitive tokens)

| Hex value | Name              | Primitive token           |
|-----------|-------------------|---------------------------|
| `#FEFDFB` | Warm white        | `--phz-color-neutral-0`   |
| `#FAFAF9` | neutral-50        | `--phz-color-neutral-50`  |
| `#F5F5F4` | neutral-100       | `--phz-color-neutral-100` |
| `#F5F4F2` | neutral-100 warm  | `--phz-color-neutral-100` |
| `#FAF9F7` | neutral-50 warm   | `--phz-color-neutral-50`  |
| `#EEEEEC` | neutral-100 cool  | `--phz-color-neutral-100` |
| `#E7E5E4` | neutral-200       | `--phz-color-neutral-200` |
| `#D6D3D1` | neutral-300       | `--phz-color-neutral-300` |
| `#A8A29E` | neutral-400       | `--phz-color-neutral-400` |
| `#78716C` | neutral-500       | `--phz-color-neutral-500` |
| `#57534E` | neutral-600       | `--phz-color-neutral-600` |
| `#44403C` | neutral-700       | `--phz-color-neutral-700` |
| `#292524` | neutral-800       | `--phz-color-neutral-800` |
| `#1C1917` | neutral-900       | `--phz-color-neutral-900` |
| `#FFFFFF` | white             | `--phz-color-white`       |

### Blue / primary scale

| Hex value | Usage                         | Token                         |
|-----------|-------------------------------|-------------------------------|
| `#EFF6FF` | Selected item bg (blue-50)    | `--phz-color-primary-50`      |
| `#DBEAFE` | Pin active bg (blue-100)      | `--phz-color-primary-100`     |
| `#BFDBFE` | Collab bar border (blue-200)  | `--phz-color-primary-200`     |
| `#3B82F6` | Primary actions (blue-500)    | `--phz-color-primary`         |
| `#2563EB` | Primary hover (blue-600)      | `--phz-color-primary-hover`   |
| `#1D4ED8` | Selected item text (blue-700) | `--phz-color-primary-dark`    |
| `#1E40AF` | Shared badge text (blue-800)  | `--phz-color-primary-darker`  |

### Green / success scale

| Hex value | Usage                             | Token                      |
|-----------|-----------------------------------|----------------------------|
| `#DCFCE7` | Personal badge bg / match pill bg | `--phz-color-success-50`   |
| `#BBF7D0` | Match pill hover bg               | `--phz-color-success-100`  |
| `#86EFAC` | Match pill border                 | `--phz-color-success-200`  |
| `#22C55E` | Success status dot                | `--phz-color-success`      |
| `#16A34A` | Success/ok text                   | `--phz-color-success-dark` |
| `#166534` | Personal badge text               | `--phz-color-success-darker`|
| `#F0FDF4` | Status ok background              | `--phz-color-success-bg`   |

### Amber / warning scale

| Hex value | Usage                          | Token                       |
|-----------|--------------------------------|-----------------------------|
| `#FFFBEB` | Status warn background         | `--phz-color-warning-bg`    |
| `#FEF3C7` | Locked badge bg / non-match bg | `--phz-color-warning-50`    |
| `#FDE68A` | Non-match border/hover         | `--phz-color-warning-100`   |
| `#F59E0B` | Warning / anomaly indicator    | `--phz-color-warning`       |
| `#D97706` | Status warn text               | `--phz-color-warning-dark`  |
| `#92400E` | Locked badge text              | `--phz-color-warning-darker`|

### Red / danger scale

| Hex value | Usage                    | Token                      |
|-----------|--------------------------|----------------------------|
| `#FEF2F2` | Danger hover bg          | `--phz-color-danger-bg`    |
| `#FEF3C7` | (see warning-50)         | —                          |
| `#FCA5A5` | Danger button border     | `--phz-color-danger-200`   |
| `#EF4444` | Danger/error text        | `--phz-color-danger`       |
| `#DC2626` | Error state text         | `--phz-color-danger-dark`  |

### Purple / secondary scale

| Hex value | Usage              | Token                    |
|-----------|--------------------|--------------------------|
| `#8B5CF6` | Chart gradient end | `--phz-color-secondary`  |

---

## 3. Primitive Tokens (Layer 1) — Full Specification

Extend the existing `BrandTokens` in `tokens.ts`. Additions are marked **NEW**.

```typescript
// Neutral scale (existing — keep)
'--phz-color-neutral-0':   '#FEFDFB',  // NEW — warm white
'--phz-color-neutral-50':  '#FAFAF9',
'--phz-color-neutral-100': '#F5F5F4',
'--phz-color-neutral-200': '#E7E5E4',
'--phz-color-neutral-300': '#D6D3D1',
'--phz-color-neutral-400': '#A8A29E',
'--phz-color-neutral-500': '#78716C',
'--phz-color-neutral-600': '#57534E',
'--phz-color-neutral-700': '#44403C',
'--phz-color-neutral-800': '#292524',
'--phz-color-neutral-900': '#1C1917',
'--phz-color-white':       '#FFFFFF',  // NEW

// Primary (blue) scale — expand
'--phz-color-primary-50':     '#EFF6FF',  // NEW
'--phz-color-primary-100':    '#DBEAFE',  // NEW
'--phz-color-primary-200':    '#BFDBFE',  // NEW
'--phz-color-primary':        '#3B82F6',
'--phz-color-primary-hover':  '#2563EB',
'--phz-color-primary-dark':   '#1D4ED8',  // NEW
'--phz-color-primary-darker': '#1E40AF',  // NEW
'--phz-color-primary-light':  'rgba(59, 130, 246, 0.1)',

// Success (green) scale — expand
'--phz-color-success-bg':      '#F0FDF4',  // NEW
'--phz-color-success-50':      '#DCFCE7',  // NEW
'--phz-color-success-100':     '#BBF7D0',  // NEW
'--phz-color-success-200':     '#86EFAC',  // NEW
'--phz-color-success':         '#22C55E',
'--phz-color-success-dark':    '#16A34A',  // NEW (replaces status--ok)
'--phz-color-success-darker':  '#166534',  // NEW

// Warning (amber) scale — expand
'--phz-color-warning-bg':      '#FFFBEB',  // NEW
'--phz-color-warning-50':      '#FEF3C7',  // NEW
'--phz-color-warning-100':     '#FDE68A',  // NEW
'--phz-color-warning':         '#F59E0B',
'--phz-color-warning-dark':    '#D97706',  // NEW
'--phz-color-warning-darker':  '#92400E',  // NEW

// Danger (red) scale — expand
'--phz-color-danger-bg':    '#FEF2F2',  // NEW
'--phz-color-danger-200':   '#FCA5A5',  // NEW
'--phz-color-danger':       '#EF4444',
'--phz-color-danger-dark':  '#DC2626',  // NEW

// Secondary (violet) — keep
'--phz-color-secondary': '#8B5CF6',
```

### Dark-mode primitive values

Dark mode uses the same token names but inverted/shifted values. These are applied
in a `@media (prefers-color-scheme: dark)` block and via a `[data-phz-theme="dark"]`
attribute selector.

```css
/* Dark mode neutral scale — invert the scale direction */
--phz-color-neutral-0:   #0F0E0D;  /* page background */
--phz-color-neutral-50:  #1A1917;  /* subtle surface */
--phz-color-neutral-100: #252220;  /* card surface */
--phz-color-neutral-200: #312E2B;  /* border */
--phz-color-neutral-300: #44403C;  /* strong border */
--phz-color-neutral-400: #57534E;  /* muted text, icons */
--phz-color-neutral-500: '#78716C;  /* secondary text */
--phz-color-neutral-600: #A8A29E;  /* primary muted text */
--phz-color-neutral-700: #D6D3D1;  /* body text */
--phz-color-neutral-800: #E7E5E4;  /* heading text */
--phz-color-neutral-900: #FAFAF9;  /* primary text */
--phz-color-white:       #1A1917;  /* "white" surface in dark = dark card */

/* Primary — keep hue, adjust for WCAG contrast */
--phz-color-primary:        #60A5FA;  /* blue-400 for dark bg contrast */
--phz-color-primary-hover:  #93C5FD;  /* blue-300 */
--phz-color-primary-50:     rgba(59, 130, 246, 0.15);
--phz-color-primary-100:    rgba(59, 130, 246, 0.25);
--phz-color-primary-200:    rgba(59, 130, 246, 0.35);
--phz-color-primary-dark:   #93C5FD;
--phz-color-primary-darker: #BFDBFE;
--phz-color-primary-light:  rgba(59, 130, 246, 0.15);

/* Success — lighter shades for dark bg */
--phz-color-success-bg:     rgba(34, 197, 94, 0.12);
--phz-color-success-50:     rgba(34, 197, 94, 0.20);
--phz-color-success:        #4ADE80;   /* green-400 */
--phz-color-success-dark:   #86EFAC;   /* green-300 */

/* Warning — lighter shades */
--phz-color-warning-bg:     rgba(245, 158, 11, 0.12);
--phz-color-warning-50:     rgba(245, 158, 11, 0.20);
--phz-color-warning:        #FCD34D;   /* amber-300 */
--phz-color-warning-dark:   #FDE68A;

/* Danger — lighter shades */
--phz-color-danger-bg:      rgba(239, 68, 68, 0.12);
--phz-color-danger:         #F87171;   /* red-400 */
--phz-color-danger-dark:    #FCA5A5;   /* red-300 */
```

---

## 4. Semantic Tokens (Layer 2) — Full Specification

Semantic tokens reference primitives. They carry purpose-based meaning so
components reference "surface" not "#FFFFFF".

### Naming convention

```
--phz-{category}-{variant}
```

Categories: `surface`, `text`, `border`, `interactive`, `status`

### Surface tokens

| Token                        | Light value                        | Dark value                          |
|------------------------------|------------------------------------|-------------------------------------|
| `--phz-surface-page`         | `var(--phz-color-neutral-0)`       | `var(--phz-color-neutral-0)`        |
| `--phz-surface-base`         | `var(--phz-color-white)`           | `var(--phz-color-neutral-100)`      |
| `--phz-surface-raised`       | `var(--phz-color-white)`           | `var(--phz-color-neutral-100)`      |
| `--phz-surface-overlay`      | `var(--phz-color-neutral-0)`       | `var(--phz-color-neutral-100)`      |
| `--phz-surface-sunken`       | `var(--phz-color-neutral-50)`      | `var(--phz-color-neutral-50)`       |
| `--phz-surface-hover`        | `var(--phz-color-neutral-100)`     | `var(--phz-color-neutral-200)`      |
| `--phz-surface-active`       | `var(--phz-color-neutral-100)`     | `var(--phz-color-neutral-200)`      |
| `--phz-surface-selected`     | `var(--phz-color-primary-50)`      | `var(--phz-color-primary-50)`       |
| `--phz-surface-inverse`      | `var(--phz-color-neutral-900)`     | `var(--phz-color-neutral-900)`      |
| `--phz-surface-tooltip`      | `var(--phz-color-neutral-900)`     | `var(--phz-color-neutral-800)`      |

### Text tokens

| Token                        | Light value                        | Dark value                          |
|------------------------------|------------------------------------|-------------------------------------|
| `--phz-text-primary`         | `var(--phz-color-neutral-900)`     | `var(--phz-color-neutral-900)`      |
| `--phz-text-secondary`       | `var(--phz-color-neutral-700)`     | `var(--phz-color-neutral-700)`      |
| `--phz-text-muted`           | `var(--phz-color-neutral-500)`     | `var(--phz-color-neutral-500)`      |
| `--phz-text-subtle`          | `var(--phz-color-neutral-400)`     | `var(--phz-color-neutral-400)`      |
| `--phz-text-disabled`        | `var(--phz-color-neutral-300)`     | `var(--phz-color-neutral-300)`      |
| `--phz-text-inverse`         | `var(--phz-color-white)`           | `var(--phz-color-neutral-900)`      |
| `--phz-text-on-primary`      | `#FFFFFF`                          | `#FFFFFF`                           |
| `--phz-text-link`            | `var(--phz-color-primary)`         | `var(--phz-color-primary)`          |
| `--phz-text-danger`          | `var(--phz-color-danger-dark)`     | `var(--phz-color-danger)`           |
| `--phz-text-success`         | `var(--phz-color-success-dark)`    | `var(--phz-color-success)`          |
| `--phz-text-warning`         | `var(--phz-color-warning-dark)`    | `var(--phz-color-warning)`          |

### Border tokens

| Token                        | Light value                        | Dark value                          |
|------------------------------|------------------------------------|-------------------------------------|
| `--phz-border-default`       | `var(--phz-color-neutral-200)`     | `var(--phz-color-neutral-200)`      |
| `--phz-border-subtle`        | `var(--phz-color-neutral-100)`     | `var(--phz-color-neutral-100)`      |
| `--phz-border-strong`        | `var(--phz-color-neutral-300)`     | `var(--phz-color-neutral-300)`      |
| `--phz-border-interactive`   | `var(--phz-color-primary)`         | `var(--phz-color-primary)`          |
| `--phz-border-danger`        | `var(--phz-color-danger-200)`      | `var(--phz-color-danger-200)`       |
| `--phz-border-inverse`       | `var(--phz-color-neutral-800)`     | `var(--phz-color-neutral-200)`      |

### Interactive tokens

| Token                             | Light value                          | Dark value                          |
|-----------------------------------|--------------------------------------|-------------------------------------|
| `--phz-interactive-primary-bg`    | `var(--phz-color-primary)`           | `var(--phz-color-primary)`          |
| `--phz-interactive-primary-hover` | `var(--phz-color-primary-hover)`     | `var(--phz-color-primary-hover)`    |
| `--phz-interactive-inverse-bg`    | `var(--phz-color-neutral-900)`       | `var(--phz-color-neutral-800)`      |
| `--phz-interactive-inverse-hover` | `var(--phz-color-neutral-800)`       | `var(--phz-color-neutral-700)`      |
| `--phz-interactive-default-bg`    | `var(--phz-color-white)`             | `var(--phz-color-neutral-100)`      |
| `--phz-interactive-default-hover` | `var(--phz-color-neutral-100)`       | `var(--phz-color-neutral-200)`      |
| `--phz-interactive-selected-bg`   | `var(--phz-color-primary-50)`        | `var(--phz-color-primary-50)`       |
| `--phz-interactive-selected-text` | `var(--phz-color-primary-dark)`      | `var(--phz-color-primary-dark)`     |
| `--phz-interactive-active-bg`     | `var(--phz-color-neutral-900)`       | `var(--phz-color-neutral-700)`      |
| `--phz-interactive-active-text`   | `var(--phz-color-white)`             | `var(--phz-color-neutral-900)`      |
| `--phz-interactive-danger-hover`  | `var(--phz-color-danger-bg)`         | `var(--phz-color-danger-bg)`        |
| `--phz-interactive-pin-active-bg` | `var(--phz-color-primary-100)`       | `var(--phz-color-primary-100)`      |

### Status tokens

| Token                            | Light value                          | Dark value                          |
|----------------------------------|--------------------------------------|-------------------------------------|
| `--phz-status-ok-text`           | `var(--phz-color-success-dark)`      | `var(--phz-color-success)`          |
| `--phz-status-ok-bg`             | `var(--phz-color-success-bg)`        | `var(--phz-color-success-bg)`       |
| `--phz-status-warn-text`         | `var(--phz-color-warning-dark)`      | `var(--phz-color-warning)`          |
| `--phz-status-warn-bg`           | `var(--phz-color-warning-bg)`        | `var(--phz-color-warning-bg)`       |
| `--phz-status-crit-text`         | `var(--phz-color-danger-dark)`       | `var(--phz-color-danger)`           |
| `--phz-status-crit-bg`           | `var(--phz-color-danger-bg)`         | `var(--phz-color-danger-bg)`        |
| `--phz-status-unknown-text`      | `var(--phz-color-neutral-400)`       | `var(--phz-color-neutral-400)`      |
| `--phz-status-unknown-bg`        | `var(--phz-color-neutral-50)`        | `var(--phz-color-neutral-50)`       |
| `--phz-status-personal-text`     | `var(--phz-color-success-darker)`    | `var(--phz-color-success-dark)`     |
| `--phz-status-personal-bg`       | `var(--phz-color-success-50)`        | `var(--phz-color-success-50)`       |
| `--phz-status-shared-text`       | `var(--phz-color-primary-darker)`    | `var(--phz-color-primary-dark)`     |
| `--phz-status-shared-bg`         | `var(--phz-color-primary-100)`       | `var(--phz-color-primary-100)`      |

### Shadow tokens (dark mode adjustments)

In dark mode the warm-toned shadows become cool-neutral with reduced opacity:

```css
/* Light mode (existing) */
--phz-shadow-sm:    0 1px 2px rgba(28,25,23,0.06), 0 1px 3px rgba(28,25,23,0.04);
--phz-shadow-float: 0 8px 30px rgba(28,25,23,0.12), 0 2px 8px rgba(28,25,23,0.06);

/* Dark mode */
--phz-shadow-sm:    0 1px 2px rgba(0,0,0,0.20), 0 1px 3px rgba(0,0,0,0.16);
--phz-shadow-md:    0 4px 6px rgba(0,0,0,0.24), 0 2px 4px rgba(0,0,0,0.16);
--phz-shadow-lg:    0 10px 25px rgba(0,0,0,0.30), 0 4px 10px rgba(0,0,0,0.20);
--phz-shadow-xl:    0 20px 40px rgba(0,0,0,0.36), 0 8px 16px rgba(0,0,0,0.24);
--phz-shadow-float: 0 8px 30px rgba(0,0,0,0.32), 0 2px 8px rgba(0,0,0,0.20);
```

---

## 5. Component Tokens (Layer 3) — Grid-Specific

Extend the existing `ComponentTokens` in `tokens.ts`. The existing definitions
are correct; the following are additions to cover currently-hardcoded values.

### Grid display tokens

| Token                            | Light value                           | Dark value                              |
|----------------------------------|---------------------------------------|-----------------------------------------|
| `--phz-grid-bg`                  | `var(--phz-surface-page)`             | `var(--phz-surface-page)`               |
| `--phz-grid-text`                | `var(--phz-text-primary)`             | `var(--phz-text-primary)`               |
| `--phz-grid-border`              | `var(--phz-border-default)`           | `var(--phz-border-default)`             |
| `--phz-header-bg`                | `var(--phz-surface-inverse)`          | `var(--phz-color-neutral-800)`          |
| `--phz-header-text`              | `var(--phz-text-inverse)`             | `var(--phz-text-primary)`               |
| `--phz-header-border`            | `var(--phz-border-inverse)`           | `var(--phz-border-strong)`              |
| `--phz-header-hover-bg`          | `var(--phz-interactive-inverse-hover)`| `var(--phz-interactive-inverse-hover)`  |
| `--phz-header-bar-bg`            | `var(--phz-surface-inverse)`          | `var(--phz-color-neutral-50)`           |
| `--phz-col-header-bg`            | `var(--phz-surface-sunken)`           | `var(--phz-surface-sunken)`             |
| `--phz-col-header-text`          | `var(--phz-text-muted)`               | `var(--phz-text-muted)`                 |
| `--phz-row-bg`                   | `transparent`                         | `transparent`                           |
| `--phz-row-bg-alt`               | `var(--phz-surface-sunken)`           | `var(--phz-surface-sunken)`             |
| `--phz-row-bg-hover`             | `var(--phz-surface-hover)`            | `var(--phz-surface-hover)`              |
| `--phz-row-bg-selected`          | `var(--phz-surface-selected)`         | `var(--phz-surface-selected)`           |
| `--phz-row-border`               | `var(--phz-border-subtle)`            | `var(--phz-border-subtle)`              |
| `--phz-cell-bg-editing`          | `var(--phz-surface-base)`             | `var(--phz-surface-raised)`             |
| `--phz-cell-border`              | `var(--phz-border-subtle)`            | `var(--phz-border-subtle)`              |
| `--phz-footer-bg`                | `var(--phz-surface-sunken)`           | `var(--phz-surface-sunken)`             |
| `--phz-footer-text`              | `var(--phz-text-secondary)`           | `var(--phz-text-secondary)`             |
| `--phz-footer-border`            | `var(--phz-border-default)`           | `var(--phz-border-default)`             |
| `--phz-aggregation-bg`           | `var(--phz-surface-hover)`            | `var(--phz-surface-hover)`              |
| `--phz-group-row-bg`             | `var(--phz-surface-hover)`            | `var(--phz-surface-hover)`              |
| `--phz-group-row-hover`          | `var(--phz-color-neutral-100)`        | `var(--phz-color-neutral-300)`          |
| `--phz-popover-bg`               | `var(--phz-surface-overlay)`          | `var(--phz-surface-overlay)`            |
| `--phz-popover-border`           | `var(--phz-border-default)`           | `var(--phz-border-default)`             |
| `--phz-banding-color`            | `var(--phz-surface-sunken)`           | `var(--phz-surface-sunken)`             |
| `--phz-skeleton-bg`              | `var(--phz-border-default)`           | `var(--phz-border-default)`             |
| `--phz-tooltip-bg`               | `var(--phz-surface-tooltip)`          | `var(--phz-surface-tooltip)`            |
| `--phz-tooltip-text`             | `var(--phz-text-inverse)`             | `var(--phz-text-primary)`               |
| `--phz-spinner-track`            | `var(--phz-border-default)`           | `var(--phz-border-default)`             |
| `--phz-spinner-active`           | `var(--phz-color-primary)`            | `var(--phz-color-primary)`              |

### Admin panel tokens (new — currently all hardcoded)

| Token                            | Light value                           | Dark value                              |
|----------------------------------|---------------------------------------|-----------------------------------------|
| `--phz-admin-panel-bg`           | `var(--phz-surface-base)`             | `var(--phz-surface-raised)`             |
| `--phz-admin-panel-border`       | `var(--phz-border-default)`           | `var(--phz-border-default)`             |
| `--phz-admin-header-bg`          | `var(--phz-surface-base)`             | `var(--phz-surface-raised)`             |
| `--phz-admin-nav-bar-bg`         | `var(--phz-surface-sunken)`           | `var(--phz-surface-sunken)`             |
| `--phz-admin-step-active-bg`     | `var(--phz-interactive-selected-bg)`  | `var(--phz-interactive-selected-bg)`    |
| `--phz-admin-step-active-text`   | `var(--phz-color-primary)`            | `var(--phz-color-primary)`              |
| `--phz-admin-step-complete-text` | `var(--phz-color-success-dark)`       | `var(--phz-color-success)`              |
| `--phz-admin-preview-bg`         | `var(--phz-surface-sunken)`           | `var(--phz-surface-sunken)`             |

### Widget tokens (new — currently all hardcoded)

| Token                            | Light value                           | Dark value                              |
|----------------------------------|---------------------------------------|-----------------------------------------|
| `--phz-widget-card-bg`           | `var(--phz-surface-base)`             | `var(--phz-surface-raised)`             |
| `--phz-widget-card-border`       | `var(--phz-border-default)`           | `var(--phz-border-default)`             |
| `--phz-widget-sparkline-bar`     | `var(--phz-color-neutral-300)`        | `var(--phz-color-neutral-300)`          |

---

## 6. CSS Custom Property Naming Convention

```
--phz-{layer}-{semantic}[-{variant}]
```

### Layer prefixes

| Prefix             | Layer         | Example                          |
|--------------------|---------------|----------------------------------|
| `--phz-color-`     | Primitive     | `--phz-color-neutral-900`        |
| `--phz-surface-`   | Semantic      | `--phz-surface-page`             |
| `--phz-text-`      | Semantic      | `--phz-text-muted`               |
| `--phz-border-`    | Semantic      | `--phz-border-default`           |
| `--phz-interactive-` | Semantic    | `--phz-interactive-primary-bg`   |
| `--phz-status-`    | Semantic      | `--phz-status-ok-text`           |
| `--phz-grid-`      | Component     | `--phz-grid-bg`                  |
| `--phz-header-`    | Component     | `--phz-header-bg`                |
| `--phz-row-`       | Component     | `--phz-row-bg-selected`          |
| `--phz-cell-`      | Component     | `--phz-cell-bg-editing`          |
| `--phz-footer-`    | Component     | `--phz-footer-bg`                |
| `--phz-popover-`   | Component     | `--phz-popover-bg`               |
| `--phz-admin-`     | Component     | `--phz-admin-panel-bg`           |
| `--phz-widget-`    | Component     | `--phz-widget-card-bg`           |
| `--phz-font-`      | Primitive     | `--phz-font-size-sm`             |
| `--phz-spacing-`   | Primitive     | `--phz-spacing-md`               |
| `--phz-shadow-`    | Primitive/Sem | `--phz-shadow-float`             |
| `--phz-transition-`| Primitive     | `--phz-transition-fast`          |

### Rules

1. No package-local token names (no `--phz-admin-shadow-*` in grid-admin that shadow the shared token)
2. Component tokens MUST reference semantic tokens, not primitives
3. Semantic tokens MUST reference primitive tokens
4. No raw hex values in component CSS — always use a `var(--phz-...)` reference
5. Fallback values in CSS are allowed ONLY for cross-package usage, using the most likely value

---

## 7. Dark Mode Implementation Strategy

### Method: Dual-selector approach

```css
/* Base (light) tokens — defined on :root or :host */
:host {
  --phz-color-neutral-900: #1C1917;
  /* ... all light values */
}

/* Automatic dark mode — system preference */
@media (prefers-color-scheme: dark) {
  :host {
    --phz-color-neutral-900: #FAFAF9;
    /* ... all dark values */
  }
}

/* Manual dark mode — overrides system preference */
:host([data-phz-theme="dark"]) {
  --phz-color-neutral-900: #FAFAF9;
  /* ... all dark values (identical to media block) */
}

/* Manual light mode — overrides system preference */
:host([data-phz-theme="light"]) {
  --phz-color-neutral-900: #1C1917;
  /* ... all light values (identical to base) */
}
```

### Where the theme provider lives

**Primary location: `:host` on `<phz-grid>`**

The grid is the outermost component. All inner components (filter popover, context menu,
toolbar, column header) are rendered inside phz-grid's shadow DOM, so they inherit
the grid's custom properties via normal CSS cascade within shadow DOM.

For standalone use of admin panels or widget components OUTSIDE a phz-grid, each
component also defines the base token layer on its own `:host`.

**No separate `<phz-theme>` element needed** — the `data-phz-theme` attribute on the
host element is sufficient and keeps the API simple.

### ThemeState integration

The existing `ThemeState` type in `packages/core/src/types/state.ts` has:
```typescript
interface ThemeState {
  name: string;
  colorScheme: ColorScheme;  // 'light' | 'dark' | 'auto'
  tokens: ThemeTokens;
}
```

When `colorScheme` changes:
- `'auto'`: remove `data-phz-theme` attribute (system preference takes over)
- `'dark'`: set `data-phz-theme="dark"` on `:host`
- `'light'`: set `data-phz-theme="light"` on `:host`

### tokens.ts file split (recommended)

Split the current monolithic `tokens.ts` into:

```
packages/grid/src/
  tokens/
    primitive.ts      — BrandTokens (colors, typography, spacing, radii, shadows)
    semantic-light.ts — SemanticTokens for light mode
    semantic-dark.ts  — SemanticTokens for dark mode
    component.ts      — ComponentTokens
    index.ts          — re-exports + generateTokenStyles()
```

This makes the dark-mode values easy to audit and test in isolation.

---

## 8. Migration Plan

### Phase 1: Add missing primitive tokens to tokens.ts

Extend `BrandTokens` with the new color scales (success, warning, danger sub-scales,
neutral-0, white). No breaking changes — additive only.

### Phase 2: Add semantic token layer to tokens.ts

Add `SurfaceTokens`, `TextTokens`, `BorderTokens`, `InteractiveTokens`, `StatusTokens`
as new exported objects alongside the existing `SemanticTokens`. Eventually rename
the existing `SemanticTokens` to `LegacyGridSemanticTokens` during a cleanup pass.

### Phase 3: Add dark-mode overrides to tokens.ts

Add `SemanticTokensDark` and `PrimitiveTokensDark` objects. Update
`generateTokenStyles()` to accept a `colorScheme` parameter and output both the
`:host` block and the `@media` + attribute blocks.

### Phase 4: Migrate shared-styles files (one package at a time)

For each shared-styles file, replace hardcoded hex values with `var(--phz-...)` calls:

**Priority order:**
1. `packages/grid/src/components/phz-grid.ts` (most critical, most complex)
2. `packages/grid-admin/src/shared-styles.ts`
3. `packages/criteria/src/shared-styles.ts`
4. `packages/engine-admin/src/shared-styles.ts`
5. `packages/widgets/src/shared-styles.ts`

**Migration pattern for each hardcoded hex:**
```css
/* Before */
color: #1C1917;

/* After */
color: var(--phz-text-primary);
```

**For colors without a token yet:**
```css
/* Temporary — add token in Phase 2 first */
color: var(--phz-text-primary, #1C1917);
```

### Phase 5: Add @media and attribute dark-mode blocks

After all components reference tokens (not hex), add dark-mode override blocks.
The token reference approach means dark mode is a single override block per
component, not a line-by-line change.

### Phase 6: Wire ThemeState to DOM attribute

In `phz-grid.ts`, add a `colorScheme` property observer that sets/removes the
`data-phz-theme` attribute on the host element.

---

## 9. Hardcoded Color Replacement Map

Complete mapping from every hardcoded hex found in shared-styles files to its
replacement token. Use this as a checklist during migration.

### packages/widgets/src/shared-styles.ts

| Hardcoded value              | Replace with token                       |
|------------------------------|------------------------------------------|
| `color: #1C1917`             | `color: var(--phz-text-primary)`         |
| `background: #FFFFFF`        | `background: var(--phz-surface-base)`    |
| `border: 1px solid #E7E5E4`  | `border: 1px solid var(--phz-border-default)` |
| `color: #16A34A`             | `color: var(--phz-status-ok-text)`       |
| `color: #D97706`             | `color: var(--phz-status-warn-text)`     |
| `color: #DC2626`             | `color: var(--phz-status-crit-text)`     |
| `color: #A8A29E`             | `color: var(--phz-text-subtle)`          |
| `background: #F0FDF4`        | `background: var(--phz-status-ok-bg)`   |
| `background: #FFFBEB`        | `background: var(--phz-status-warn-bg)` |
| `background: #FEF2F2`        | `background: var(--phz-status-crit-bg)` |
| `background: #FAFAF9`        | `background: var(--phz-status-unknown-bg)`|
| `color: #44403C`             | `color: var(--phz-text-secondary)`       |
| `color: #78716C`             | `color: var(--phz-text-muted)`           |
| `background: #D6D3D1`        | `background: var(--phz-color-neutral-300)` |
| `border-bottom: 2px solid #E7E5E4` | `border-bottom: 2px solid var(--phz-border-default)` |
| `border-bottom: 1px solid #F5F5F4` | `border-bottom: 1px solid var(--phz-border-subtle)` |
| `background: #FAFAF9` (table hover) | `background: var(--phz-surface-sunken)` |
| `background: #1C1917` (tooltip) | `background: var(--phz-tooltip-bg)`  |
| `color: #FFFFFF` (tooltip)   | `color: var(--phz-tooltip-text)`         |
| `outline: 2px solid #3B82F6` | `outline: 2px solid var(--phz-color-primary)` |
| `border: 3px solid #E7E5E4`  | `border: 3px solid var(--phz-spinner-track)` |
| `border-top-color: #3B82F6`  | `border-top-color: var(--phz-spinner-active)` |

### packages/criteria/src/shared-styles.ts

| Hardcoded value                   | Replace with token                              |
|-----------------------------------|-------------------------------------------------|
| `color: #1C1917` (host)           | `color: var(--phz-text-primary)`                |
| `background: #FAFAF9` (panel)     | `background: var(--phz-surface-sunken)`         |
| `border: 1px solid #E7E5E4`       | `border: 1px solid var(--phz-border-default)`   |
| `background: #FFFFFF` (header)    | `background: var(--phz-surface-base)`           |
| `background: #F5F5F4` (hover)     | `background: var(--phz-surface-hover)`          |
| `color: #44403C` (panel title)    | `color: var(--phz-text-secondary)`              |
| `color: #78716C` (toggle)         | `color: var(--phz-text-muted)`                  |
| `background: #FFFFFF` (actions)   | `background: var(--phz-surface-base)`           |
| `border: 1px solid #D6D3D1` (btn) | `border: 1px solid var(--phz-border-strong)`    |
| `background: #1C1917` (btn--primary) | `background: var(--phz-interactive-inverse-bg)` |
| `color: #FFFFFF` (btn--primary)   | `color: var(--phz-text-inverse)`                |
| `background: #292524` (btn hover) | `background: var(--phz-interactive-inverse-hover)` |
| `color: #78716C` (field label)    | `color: var(--phz-text-muted)`                  |
| `color: #DC2626` (required star)  | `color: var(--phz-text-danger)`                 |
| `background: #FFFFFF` (input)     | `background: var(--phz-surface-base)`           |
| `border: 1px solid #D6D3D1`       | `border: 1px solid var(--phz-border-strong)`    |
| `border-color: #2563EB` (focus)   | `border-color: var(--phz-border-interactive)`   |
| `background: #F5F5F4` (disabled)  | `background: var(--phz-surface-hover)`          |
| `color: #A8A29E` (disabled)       | `color: var(--phz-text-disabled)`               |
| `background: #FFFFFF` (dropdown)  | `background: var(--phz-surface-overlay)`        |
| `background: #EFF6FF` (item sel)  | `background: var(--phz-interactive-selected-bg)` |
| `color: #1D4ED8` (item sel)       | `color: var(--phz-interactive-selected-text)`   |
| `background: #FEF3C7` (locked)    | `background: var(--phz-color-warning-50)`       |
| `color: #92400E` (locked)         | `color: var(--phz-color-warning-darker)`        |
| `background: #DCFCE7` (personal)  | `background: var(--phz-status-personal-bg)`     |
| `color: #166534` (personal)       | `color: var(--phz-status-personal-text)`        |
| `background: #DBEAFE` (shared)    | `background: var(--phz-status-shared-bg)`       |
| `color: #1E40AF` (shared)         | `color: var(--phz-status-shared-text)`          |
| `background: #1C1917` (chip sel)  | `background: var(--phz-interactive-active-bg)`  |
| `color: #FFFFFF` (chip sel)       | `color: var(--phz-interactive-active-text)`     |
| `background: #EFF6FF` (pin active)| `background: var(--phz-interactive-pin-active-bg)` |
| `color: #2563EB` (pin active)     | `color: var(--phz-color-primary)`               |
| `background: #FAFAF9` (drawer)    | `background: var(--phz-surface-sunken)`         |
| `background: rgba(28,25,23,0.4)`  | `background: var(--phz-overlay-backdrop)`       |
| `color: #DC2626` (error)          | `color: var(--phz-text-danger)`                 |
| `background: #2563EB` (count badge)| `background: var(--phz-color-primary)`         |
| `background: #EF4444` (bar badge) | `background: var(--phz-color-danger)`           |

### packages/grid-admin/src/shared-styles.ts

| Hardcoded value                        | Replace with token                              |
|----------------------------------------|-------------------------------------------------|
| `color: #1C1917` (host)                | `color: var(--phz-text-primary)`                |
| `border-bottom: 1px solid #E7E5E4`     | `border-bottom: 1px solid var(--phz-border-default)` |
| `color: #1C1917` (panel title)         | `color: var(--phz-text-primary)`                |
| `color: #78716C` (section title)       | `color: var(--phz-text-muted)`                  |
| `color: #44403C` (label)               | `color: var(--phz-text-secondary)`              |
| `border: 1px solid #D6D3D1` (input)    | `border: 1px solid var(--phz-border-strong)`    |
| `background: white` (input)            | `background: var(--phz-surface-base)`           |
| `border-color: #3B82F6` (focus)        | `border-color: var(--phz-border-interactive)`   |
| `background: white` (btn)              | `background: var(--phz-interactive-default-bg)` |
| `color: #44403C` (btn)                 | `color: var(--phz-text-secondary)`              |
| `background: #FAFAF9` (btn hover)      | `background: var(--phz-surface-sunken)`         |
| `background: #3B82F6` (btn--primary)   | `background: var(--phz-interactive-primary-bg)` |
| `color: white` (btn--primary)          | `color: var(--phz-text-on-primary)`             |
| `background: #2563EB` (btn--primary hover) | `background: var(--phz-interactive-primary-hover)` |
| `color: #DC2626` (btn--danger)         | `color: var(--phz-text-danger)`                 |
| `background: #FEF2F2` (btn--danger hover)| `background: var(--phz-interactive-danger-hover)` |
| `background: white` (list item)        | `background: var(--phz-surface-base)`           |
| `color: #1C1917` (list label)          | `color: var(--phz-text-primary)`                |
| `background: #D6D3D1` (toggle off)     | `background: var(--phz-border-strong)`          |
| `background: #3B82F6` (toggle on)      | `background: var(--phz-interactive-primary-bg)` |
| `color: #78716C` (tab)                 | `color: var(--phz-text-muted)`                  |
| `color: #44403C` (tab hover)           | `color: var(--phz-text-secondary)`              |
| `color: #3B82F6` (tab--active)         | `color: var(--phz-color-primary)`               |
| `border-bottom-color: #3B82F6`         | `border-bottom-color: var(--phz-color-primary)` |
| `border: 1px solid #D6D3D1` (color input)| `border: 1px solid var(--phz-border-strong)`  |
| `background: #FAFAF9` (preview)        | `background: var(--phz-admin-preview-bg)`       |
| `color: #78716C` (preview)             | `color: var(--phz-text-muted)`                  |

### packages/engine-admin/src/shared-styles.ts

| Hardcoded value                        | Replace with token                              |
|----------------------------------------|-------------------------------------------------|
| `color: #1C1917` (host)                | `color: var(--phz-text-primary)`                |
| `border-right: 1px solid #E7E5E4`      | `border-right: 1px solid var(--phz-border-default)` |
| `color: #78716C` (panel header)        | `color: var(--phz-text-muted)`                  |
| `color: #78716C` (step)                | `color: var(--phz-text-muted)`                  |
| `background: #FAFAF9` (step hover)     | `background: var(--phz-surface-sunken)`         |
| `color: #44403C` (step hover)          | `color: var(--phz-text-secondary)`              |
| `background: #EFF6FF` (step active)    | `background: var(--phz-admin-step-active-bg)`   |
| `color: #3B82F6` (step active)         | `color: var(--phz-admin-step-active-text)`      |
| `color: #16A34A` (step complete)       | `color: var(--phz-admin-step-complete-text)`    |
| `background: #16A34A` (step num)       | `background: var(--phz-color-success-dark)`     |
| `color: #44403C` (label)               | `color: var(--phz-text-secondary)`              |
| `border: 1px solid #D6D3D1` (input)    | `border: 1px solid var(--phz-border-strong)`    |
| `background: white` (input)            | `background: var(--phz-surface-base)`           |
| `border-color: #3B82F6` (focus)        | `border-color: var(--phz-border-interactive)`   |
| `background: white` (btn)              | `background: var(--phz-interactive-default-bg)` |
| `background: #FAFAF9` (btn hover)      | `background: var(--phz-surface-sunken)`         |
| `background: #3B82F6` (btn--primary)   | `background: var(--phz-interactive-primary-bg)` |
| `color: white` (btn--primary)          | `color: var(--phz-text-on-primary)`             |
| `background: #2563EB` (btn--p hover)   | `background: var(--phz-interactive-primary-hover)` |
| `color: #DC2626` (btn--danger)         | `color: var(--phz-text-danger)`                 |
| `border-color: #FCA5A5` (btn--danger)  | `border-color: var(--phz-color-danger-200)`     |
| `background: #FEF2F2` (btn--danger hover)| `background: var(--phz-interactive-danger-hover)` |
| `background: #FAFAF9` (nav bar)        | `background: var(--phz-admin-nav-bar-bg)`       |
| `background: white` (chip)             | `background: var(--phz-interactive-default-bg)` |
| `background: #F5F5F4` (chip hover)     | `background: var(--phz-surface-hover)`          |
| `background: #3B82F6` (chip active)    | `background: var(--phz-interactive-primary-bg)` |
| `color: white` (chip active)           | `color: var(--phz-text-on-primary)`             |
| `background: #FAFAF9` (list hover)     | `background: var(--phz-surface-sunken)`         |
| `background: #EFF6FF` (list active)    | `background: var(--phz-interactive-selected-bg)` |
| `color: #3B82F6` (list active)         | `color: var(--phz-interactive-selected-text)`   |
| `color: #78716C` (tab)                 | `color: var(--phz-text-muted)`                  |
| `color: #44403C` (tab hover)           | `color: var(--phz-text-secondary)`              |
| `color: #3B82F6` (tab active)          | `color: var(--phz-color-primary)`               |
| `color: #1C1917` (tile label)          | `color: var(--phz-text-primary)`                |
| `color: #78716C` (tile desc)           | `color: var(--phz-text-muted)`                  |
| `border-color: #3B82F6` (tile hover)   | `border-color: var(--phz-border-interactive)`   |
| `background: #EFF6FF` (tile hover)     | `background: var(--phz-interactive-selected-bg)` |
| `background: #1C1917` (header)         | `background: var(--phz-surface-inverse)`        |
| `color: white` (header)                | `color: var(--phz-text-inverse)`                |
| `color: #A8A29E` (header subtitle)     | `color: var(--phz-text-subtle)`                 |

---

## 10. Additional Semantic Token: Overlay Backdrop

The drawer and modal backdrop colors are currently hardcoded:

```css
background: rgba(28, 25, 23, 0.4);  /* drawer */
background: rgba(28, 25, 23, 0.5);  /* modal */
```

Add a dedicated token:

```css
--phz-overlay-backdrop:        rgba(28, 25, 23, 0.45);   /* light */
--phz-overlay-backdrop--dark:  rgba(0, 0, 0, 0.60);      /* dark */
```

Use `--phz-overlay-backdrop` throughout (single value covers both drawer and modal).

---

## 11. Accessibility Considerations

### Contrast ratios (WCAG 2.1 AA requires 4.5:1 for normal text, 3:1 for large)

| Light mode pair                    | Ratio  | Pass |
|------------------------------------|--------|------|
| `text-primary` (#1C1917) on white  | 18.1:1 | AA   |
| `text-secondary` (#44403C) on white| 10.7:1 | AA   |
| `text-muted` (#78716C) on white    | 4.8:1  | AA   |
| `text-subtle` (#A8A29E) on white   | 2.9:1  | FAIL — large text only |
| Primary (#3B82F6) on white         | 3.1:1  | Large text / icons only |
| Primary on neutral-50 (#FAFAF9)    | 3.0:1  | Large text / icons only |

| Dark mode pair                           | Ratio  | Pass |
|------------------------------------------|--------|------|
| `text-primary` (#FAFAF9) on neutral-0    | 17.5:1 | AA   |
| `text-secondary` (#D6D3D1) on neutral-0  | 11.5:1 | AA   |
| `text-muted` (#A8A29E) on neutral-0      | 6.1:1  | AA   |
| Primary (#60A5FA) on neutral-0           | 4.6:1  | AA   |

**Note**: `text-subtle` (#A8A29E) fails AA for normal text. It is intentionally used only
for placeholder text, disabled states, decorative separators, and large-text contexts.
The `text-disabled` (#D6D3D1) is used only for disabled/inactive content and is
intentionally low-contrast per WCAG guidance on disabled elements.

### Forced Colors Mode (Windows High Contrast)

All interactive states should include fallbacks for Forced Colors using:
```css
@media (forced-colors: active) {
  :host { forced-color-adjust: none; }
}
```
or use system keyword colors where appropriate. This is addressed in the implementation
task, not this design document.

---

## 12. Summary: Token Counts

| Layer       | Existing | New | Total |
|-------------|----------|-----|-------|
| Primitive   | 30       | 25  | 55    |
| Semantic    | 18       | 38  | 56    |
| Component   | 35       | 25  | 60    |
| **Total**   | **83**   | **88** | **171** |

---

## 13. File Impact Summary

| File                                            | Change type       | Hex count |
|-------------------------------------------------|-------------------|-----------|
| `packages/grid/src/tokens.ts`                   | Extend + dark mode | 0 → 0    |
| `packages/grid/src/components/phz-grid.ts`      | Replace hex        | ~85       |
| `packages/grid/src/components/phz-filter-popover.ts` | Replace hex   | ~30       |
| `packages/grid/src/components/phz-context-menu.ts` | Replace hex     | ~8        |
| `packages/grid/src/components/phz-toolbar.ts`   | Replace hex        | ~15       |
| `packages/grid/src/components/phz-view-switcher.ts` | Replace hex    | ~10       |
| `packages/grid/src/components/phz-column-chooser.ts` | Replace hex   | ~10       |
| `packages/grid/src/components/phz-chart-popover.ts` | Replace hex    | ~10       |
| `packages/widgets/src/shared-styles.ts`         | Replace hex        | ~30       |
| `packages/criteria/src/shared-styles.ts`        | Replace hex        | ~70       |
| `packages/grid-admin/src/shared-styles.ts`      | Replace hex        | ~35       |
| `packages/engine-admin/src/shared-styles.ts`    | Replace hex        | ~45       |
