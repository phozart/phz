# ADR-006: Three-Layer CSS Custom Property Theming System

## Status
Accepted

## Context

Data grids must support visual customization to match application design systems (Material Design, Bootstrap, Fluent, custom brands). Traditional approaches to theming have significant drawbacks:

### Approach 1: Inline Styles (Handsontable-style)
```typescript
new Handsontable({
  cells: {
    renderer: (instance, td, row, col, prop, value) => {
      td.style.background = '#f0f0f0'; // Inline style
      td.style.color = '#333';
    }
  }
});
```
**Problems:**
- Higher specificity than CSS (hard to override)
- No dark mode support
- Can't use CSS pseudo-classes (:hover, :focus)
- Performance: Forces style recalculation on every cell

### Approach 2: CSS Classes (AG Grid-style)
```css
/* AG Grid has 500+ CSS classes */
.ag-theme-alpine .ag-header-cell { background: #f5f5f5; }
.ag-theme-alpine .ag-cell { border: 1px solid #ddd; }
/* ... 498 more classes ... */
```
**Problems:**
- Class explosion (AG Grid has 500+ theme classes)
- Difficult to customize (must override specific selectors)
- No inheritance (changing primary color requires 50+ overrides)
- Bundle size bloat (CSS grows with themes)

### Approach 3: CSS-in-JS (MUI DataGrid-style)
```typescript
<DataGrid
  sx={{
    '& .MuiDataGrid-cell': { borderColor: 'divider' },
    '& .MuiDataGrid-row:hover': { bgcolor: 'action.hover' }
  }}
/>
```
**Problems:**
- Runtime cost (styles generated on render)
- No static extraction (can't preload CSS)
- Framework-locked (React-only)
- Harder to debug (styles in JS objects)

### Ideal Theming System Requirements

1. **Easy to customize** — Change primary color once, affects all components
2. **CSS-only** — No JavaScript required to apply themes
3. **Dark mode support** — Automatic `prefers-color-scheme` handling
4. **Type-safe** — TypeScript autocomplete for theme tokens
5. **Small bundle** — Themes don't increase bundle size
6. **SSR-friendly** — Themes apply before hydration (no flash)
7. **Framework-agnostic** — Works in React, Vue, Angular, vanilla

## Decision

We will implement a **three-layer CSS custom property (CSS variables) theming system**:

### Layer 1: Primitive Tokens (Brand)
Global design primitives (colors, spacing, typography) that define brand identity.

```css
:root {
  /* Colors */
  --phz-color-primary-50: #eff6ff;
  --phz-color-primary-100: #dbeafe;
  --phz-color-primary-500: #3b82f6;
  --phz-color-primary-900: #1e3a8a;

  --phz-color-neutral-50: #fafafa;
  --phz-color-neutral-500: #737373;
  --phz-color-neutral-900: #171717;

  /* Spacing (4px base unit) */
  --phz-spacing-0: 0;
  --phz-spacing-1: 4px;
  --phz-spacing-2: 8px;
  --phz-spacing-4: 16px;
  --phz-spacing-6: 24px;

  /* Typography */
  --phz-font-family-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --phz-font-family-mono: 'Fira Code', 'Courier New', monospace;
  --phz-font-size-xs: 12px;
  --phz-font-size-sm: 14px;
  --phz-font-size-base: 16px;
  --phz-font-weight-normal: 400;
  --phz-font-weight-medium: 500;
  --phz-font-weight-bold: 700;

  /* Border radius */
  --phz-radius-none: 0;
  --phz-radius-sm: 4px;
  --phz-radius-md: 8px;
  --phz-radius-lg: 12px;

  /* Shadows */
  --phz-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --phz-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --phz-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.15);
}
```

### Layer 2: Semantic Tokens (Theme)
Semantic tokens reference primitive tokens and define component-agnostic meaning.

```css
:root {
  /* Backgrounds */
  --phz-bg-default: var(--phz-color-neutral-50);
  --phz-bg-subtle: var(--phz-color-neutral-100);
  --phz-bg-emphasis: var(--phz-color-neutral-900);

  /* Text */
  --phz-text-primary: var(--phz-color-neutral-900);
  --phz-text-secondary: var(--phz-color-neutral-500);
  --phz-text-disabled: var(--phz-color-neutral-300);

  /* Borders */
  --phz-border-default: var(--phz-color-neutral-200);
  --phz-border-emphasis: var(--phz-color-neutral-500);

  /* Interactive */
  --phz-interactive-default: var(--phz-color-primary-500);
  --phz-interactive-hover: var(--phz-color-primary-600);
  --phz-interactive-active: var(--phz-color-primary-700);

  /* States */
  --phz-state-success: #10b981;
  --phz-state-warning: #f59e0b;
  --phz-state-error: #ef4444;
  --phz-state-info: var(--phz-color-primary-500);

  /* Focus */
  --phz-focus-ring: 0 0 0 2px var(--phz-interactive-default);
  --phz-focus-ring-offset: 2px;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --phz-bg-default: var(--phz-color-neutral-900);
    --phz-bg-subtle: var(--phz-color-neutral-800);
    --phz-bg-emphasis: var(--phz-color-neutral-50);

    --phz-text-primary: var(--phz-color-neutral-50);
    --phz-text-secondary: var(--phz-color-neutral-400);

    --phz-border-default: var(--phz-color-neutral-700);
    --phz-border-emphasis: var(--phz-color-neutral-500);
  }
}
```

### Layer 3: Component Tokens
Component-specific tokens reference semantic tokens.

```css
:root {
  /* Grid container */
  --phz-grid-bg: var(--phz-bg-default);
  --phz-grid-border-color: var(--phz-border-default);
  --phz-grid-border-width: 1px;
  --phz-grid-border-radius: var(--phz-radius-md);

  /* Header */
  --phz-header-bg: var(--phz-bg-subtle);
  --phz-header-text: var(--phz-text-primary);
  --phz-header-border-color: var(--phz-border-emphasis);
  --phz-header-padding: var(--phz-spacing-2) var(--phz-spacing-4);
  --phz-header-font-weight: var(--phz-font-weight-medium);

  /* Cell */
  --phz-cell-bg: var(--phz-bg-default);
  --phz-cell-text: var(--phz-text-primary);
  --phz-cell-border-color: var(--phz-border-default);
  --phz-cell-padding: var(--phz-spacing-2) var(--phz-spacing-4);
  --phz-cell-font: var(--phz-font-size-sm) var(--phz-font-family-sans);

  /* Row states */
  --phz-row-hover-bg: var(--phz-bg-subtle);
  --phz-row-selected-bg: var(--phz-interactive-default);
  --phz-row-selected-text: white;

  /* Focus */
  --phz-cell-focus-ring: var(--phz-focus-ring);
  --phz-cell-focus-ring-offset: var(--phz-focus-ring-offset);
}
```

### Component Usage

```css
/* @phozart/phz-grid component styles */
.phz-grid {
  background: var(--phz-grid-bg);
  border: var(--phz-grid-border-width) solid var(--phz-grid-border-color);
  border-radius: var(--phz-grid-border-radius);
  font-family: var(--phz-font-family-sans);
}

.phz-header {
  background: var(--phz-header-bg);
  color: var(--phz-header-text);
  border-bottom: 1px solid var(--phz-header-border-color);
  padding: var(--phz-header-padding);
  font-weight: var(--phz-header-font-weight);
}

.phz-cell {
  background: var(--phz-cell-bg);
  color: var(--phz-cell-text);
  border: 1px solid var(--phz-cell-border-color);
  padding: var(--phz-cell-padding);
  font: var(--phz-cell-font);
}

.phz-row:hover .phz-cell {
  background: var(--phz-row-hover-bg);
}

.phz-row--selected .phz-cell {
  background: var(--phz-row-selected-bg);
  color: var(--phz-row-selected-text);
}

.phz-cell:focus {
  outline: var(--phz-cell-focus-ring);
  outline-offset: var(--phz-cell-focus-ring-offset);
}
```

### Developer Experience: Customization

**Scenario 1: Change primary color (simple)**
```css
/* User's CSS file */
:root {
  --phz-color-primary-500: #8b5cf6; /* Purple instead of blue */
}
/* All components update automatically */
```

**Scenario 2: Customize specific component (granular)**
```css
/* User's CSS file */
:root {
  --phz-cell-padding: 12px 20px; /* Larger cells */
  --phz-header-font-weight: 700; /* Bolder headers */
}
```

**Scenario 3: Use pre-built theme (convenience)**
```html
<!-- Material Design theme -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phozart/theme-material@1.0.0/dist/theme.css">

<phz-grid><!-- Automatically styled with Material Design --></phz-grid>
```

### TypeScript Theme Definition (Type-Safe Theming)

```typescript
// @phozart/phz-core/themes.ts

export interface PhzTheme {
  // Primitive tokens
  primitive: {
    color: {
      primary: ColorScale;
      neutral: ColorScale;
    };
    spacing: SpacingScale;
    typography: TypographyScale;
  };

  // Semantic tokens
  semantic: {
    background: { default: string; subtle: string; emphasis: string };
    text: { primary: string; secondary: string; disabled: string };
    border: { default: string; emphasis: string };
    interactive: { default: string; hover: string; active: string };
  };

  // Component tokens
  component: {
    grid: { bg: string; borderColor: string; borderRadius: string };
    header: { bg: string; text: string; borderColor: string; padding: string };
    cell: { bg: string; text: string; borderColor: string; padding: string };
    row: { hoverBg: string; selectedBg: string; selectedText: string };
  };
}

// Generate CSS from theme object
export function generateThemeCSS(theme: PhzTheme): string {
  return `
    :root {
      /* Primitive tokens */
      --phz-color-primary-500: ${theme.primitive.color.primary[500]};
      /* ... */

      /* Semantic tokens */
      --phz-bg-default: ${theme.semantic.background.default};
      /* ... */

      /* Component tokens */
      --phz-grid-bg: ${theme.component.grid.bg};
      /* ... */
    }
  `;
}
```

## Consequences

### Positive

1. **Easy Customization** — Change one variable, affects all components
2. **CSS-Only** — No JavaScript required to apply themes
3. **Dark Mode Auto-Support** — `prefers-color-scheme` handles it
4. **Type-Safe** — TypeScript theme definitions with autocomplete
5. **Small Bundle** — Themes are CSS files, don't affect JS bundle
6. **SSR-Friendly** — CSS loads before hydration, no flash of unstyled content
7. **Framework-Agnostic** — CSS variables work everywhere
8. **Inspectable** — DevTools shows computed values clearly
9. **Inheritance** — Tokens reference other tokens (DRY principle)
10. **Pre-Built Themes Easy** — Can ship Material, Bootstrap, Fluent as separate CSS files

### Negative

1. **IE11 Not Supported** — CSS custom properties don't work in IE11 (acceptable, it's 2026)
2. **No Dynamic Computation** — Can't do `calc()` inside theme definitions easily (mitigated by providing pre-computed values)
3. **Debugging Complexity** — Three layers of indirection can make debugging harder (mitigated by clear naming)

### Neutral

1. **Learning Curve** — Developers must understand three-layer system (but it's standard in design systems like Tailwind, Primer)

## Implementation Strategy

### File Structure

```
packages/grid/src/
├── styles/
│   ├── tokens/
│   │   ├── primitive.css   # Layer 1
│   │   ├── semantic.css    # Layer 2
│   │   └── component.css   # Layer 3
│   ├── components/
│   │   ├── grid.css
│   │   ├── header.css
│   │   ├── cell.css
│   │   └── row.css
│   └── index.css           # Imports all

packages/theme-material/
├── material.css            # Material Design overrides
└── material-dark.css       # Material Dark variant

packages/theme-bootstrap/
├── bootstrap.css           # Bootstrap 5 overrides
```

### Load Order

```html
<!-- User's HTML -->
<head>
  <!-- 1. Grid base styles (includes all three token layers) -->
  <link rel="stylesheet" href="node_modules/@phozart/phz-grid/dist/phz-grid.css">

  <!-- 2. Theme overrides (optional) -->
  <link rel="stylesheet" href="node_modules/@phozart/theme-material/dist/material.css">

  <!-- 3. Custom overrides (optional) -->
  <style>
    :root {
      --phz-color-primary-500: #8b5cf6; /* Custom purple */
    }
  </style>
</head>
```

## Alternatives Considered

### Alternative 1: Tailwind-Style Utility Classes
**Rejected** because it requires JavaScript to apply classes dynamically, and doesn't support theming without rebuilding.

### Alternative 2: Sass/Less Variables
**Rejected** because it requires build-time compilation and doesn't support runtime theme switching.

### Alternative 3: CSS Modules
**Rejected** because it's build-tool-dependent and doesn't support global theming.

### Alternative 4: Emotion/Styled-Components (CSS-in-JS)
**Rejected** because it's framework-locked (React) and has runtime cost.

## Browser Support

| Browser | CSS Custom Properties | Support |
|---------|----------------------|---------|
| Chrome | 49+ | Yes |
| Firefox | 31+ | Yes |
| Safari | 9.1+ | Yes |
| Edge | 15+ | Yes |
| IE11 | No | Not supported (acceptable trade-off) |

## References

- [CSS Custom Properties - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [Design Tokens - W3C Community Group](https://design-tokens.github.io/community-group/)
- [GitHub Primer Design System](https://primer.style/foundations/primitives)
- [Tailwind CSS Color Palette](https://tailwindcss.com/docs/customizing-colors)
- [Material Design Theming](https://m3.material.io/styles/color/the-color-system/tokens)

---

**Author**: Solution Architect
**Date**: 2026-02-24
**Stakeholders**: Design Lead, Engineering Leads, Product Manager
**Tier**: Community MIT License (all tiers)
