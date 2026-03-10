# @phozart/phz-grid

Web Components rendering layer for the phz-grid SDK. Built with Lit, provides custom elements for the data grid, toolbar, column chooser, context menu, and more. Includes accessibility support (ARIA, keyboard navigation, Forced Colors Mode), cell renderers/editors, export utilities, and a three-layer CSS token system.

## Installation

```bash
npm install @phozart/phz-grid
```

## Quick Start

### As a Module

```ts
import '@phozart/phz-grid';
```

```html
<phz-grid
  selection-mode="multi"
  edit-mode="dblclick"
  grid-height="500px"
></phz-grid>

<script type="module">
  const grid = document.querySelector('phz-grid');
  grid.columns = [
    { field: 'name', header: 'Name', type: 'string' },
    { field: 'age', header: 'Age', type: 'number' },
  ];
  grid.data = [
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 },
  ];
</script>
```

### Via CDN

```html
<!-- Grid only -->
<script type="module" src="https://cdn.example.com/phz-grid.js"></script>

<!-- All-in-one (grid + widgets + criteria + admin) -->
<script type="module" src="https://cdn.example.com/phz-all.js"></script>
```

## Custom Elements

| Element | Description |
|---------|-------------|
| `<phz-grid>` | Main data grid with sorting, filtering, editing, selection |
| `<phz-toolbar>` | Toolbar with search, export, density, column chooser |
| `<phz-column>` | Declarative column definition (alternative to JS config) |
| `<phz-column-chooser>` | Column visibility/reorder dialog |
| `<phz-context-menu>` | Right-click context menu |
| `<phz-filter-popover>` | Column filter popover |
| `<phz-chart-popover>` | Inline chart visualization popover |

## Grid Attributes

| Attribute | Values | Default |
|-----------|--------|---------|
| `selection-mode` | `none`, `single`, `multi`, `range` | `none` |
| `edit-mode` | `none`, `click`, `dblclick`, `manual` | `none` |
| `grid-height` | CSS height string | `400px` |
| `grid-width` | CSS width string | `100%` |
| `theme` | Theme name | `auto` |
| `locale` | BCP 47 locale | `en-US` |
| `loading` | Boolean | `false` |
| `responsive` | Boolean | `true` |
| `virtualization` | Boolean | `true` |

## DOM Events

The grid dispatches standard `CustomEvent`s (hyphen-separated names):

```ts
grid.addEventListener('cell-click', (e: CustomEvent) => {
  console.log(e.detail.rowId, e.detail.field, e.detail.value);
});

grid.addEventListener('selection-change', (e: CustomEvent) => {
  console.log('Selected rows:', e.detail.selectedRows);
});
```

Available events: `grid-ready`, `state-change`, `cell-click`, `cell-dblclick`, `row-click`, `row-action`, `selection-change`, `sort-change`, `filter-change`, `edit-start`, `edit-commit`, `edit-cancel`, `scroll`.

## Cell Renderers

Built-in renderers for common data types:

```ts
import {
  TextCellRenderer,
  NumberCellRenderer,
  DateCellRenderer,
  BooleanCellRenderer,
  LinkCellRenderer,
  ImageCellRenderer,
  ProgressCellRenderer,
  renderSparkline,
} from '@phozart/phz-grid';
```

### Custom Renderers

Extend `PhzCellRenderer` to create custom renderers:

```ts
import { PhzCellRenderer } from '@phozart/phz-grid';
import { html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('my-status-renderer')
class StatusRenderer extends PhzCellRenderer {
  render() {
    const color = this.value === 'active' ? 'green' : 'red';
    return html`<span style="color: ${color}">${this.value}</span>`;
  }
}
```

## Cell Editors

Built-in editors:

```ts
import {
  TextCellEditor,
  NumberCellEditor,
  SelectCellEditor,
  DateCellEditor,
  CheckboxCellEditor,
} from '@phozart/phz-grid';
```

### Custom Editors

Extend `PhzCellEditor`:

```ts
import { PhzCellEditor } from '@phozart/phz-grid';

@customElement('my-rating-editor')
class RatingEditor extends PhzCellEditor {
  render() {
    return html`<input type="range" min="1" max="5"
      .value=${this.value}
      @change=${(e) => this.commit(Number(e.target.value))} />`;
  }
}
```

## Theming

phz-grid uses a three-layer CSS custom property system:

```ts
import { BrandTokens, SemanticTokens, ComponentTokens, generateTokenStyles } from '@phozart/phz-grid';
```

```css
/* Brand layer — your colors */
phz-grid {
  --phz-brand-primary: #2563eb;
  --phz-brand-surface: #ffffff;
}

/* Semantic layer — mapped from brand */
phz-grid {
  --phz-color-text: var(--phz-brand-text);
  --phz-color-border: var(--phz-brand-border);
}

/* Component layer — specific component tokens */
phz-grid {
  --phz-grid-header-bg: var(--phz-color-surface-raised);
  --phz-grid-row-hover: var(--phz-color-surface-hover);
}
```

## Accessibility

```ts
import { AriaManager, KeyboardNavigator, ForcedColorsAdapter, forcedColorsCSS } from '@phozart/phz-grid';
```

- Full keyboard navigation (arrow keys, Tab, Enter, Escape)
- ARIA roles and live regions
- Forced Colors Mode support (Windows High Contrast)
- Screen reader announcements for sort, filter, edit operations

## Export

```ts
import { exportToCSV, downloadCSV, exportToExcel, downloadExcel } from '@phozart/phz-grid';

// CSV
const csv = exportToCSV(data, columns, options);
downloadCSV(csv, 'export.csv');

// Excel
const excel = exportToExcel(data, columns, options);
downloadExcel(excel, 'export.xlsx');
```

## Features

```ts
import { createConditionalFormattingEngine, detectAnomalies } from '@phozart/phz-grid';

// Conditional formatting
const engine = createConditionalFormattingEngine([
  createHighlightAboveTarget('revenue', 100000),
  createThresholdRule('score', [
    { min: 0, max: 50, style: { color: 'red' } },
    { min: 50, max: 100, style: { color: 'green' } },
  ]),
]);

// Anomaly detection
const anomalies = detectAnomalies(data, 'revenue');
```

## Clipboard

```ts
import { buildCopyText, copyToClipboard } from '@phozart/phz-grid';

const text = buildCopyText(selectedCells, data, columns);
await copyToClipboard(text);
```

## Extended Column Types

In addition to core types (`string`, `number`, `boolean`, `date`, `custom`), the grid package adds: `status`, `bar`, `link`, `image`, `datetime`.

## Re-exports

This package re-exports everything from `@phozart/phz-core` for convenience. You can import core types directly:

```ts
import { createGrid, type ColumnDefinition, type GridApi } from '@phozart/phz-grid';
```

## License

MIT
