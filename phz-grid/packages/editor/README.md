# @phozart/phz-editor

Constrained authoring shell for the phz-grid SDK. Provides headless state machines and Lit Web Components for content authors to create dashboards, design reports, explore data, configure alerts, and share artifacts within admin-defined constraints.

## Installation

```bash
npm install @phozart/phz-editor
```

**Dependencies:** `@phozart/phz-shared`, `@phozart/phz-core`, `@phozart/phz-engine`, `lit`

> **Note:** Authors work within admin-defined constraints. Pair with `@phozart/phz-viewer` for the read-only consumption layer.

## Quick Start (Lit)

```ts
import '@phozart/phz-editor';
```

```html
<phz-editor-shell
  .config=${editorConfig}
  @editor-navigate=${handleNavigation}
>
</phz-editor-shell>
```

## Quick Start (React)

The editor components can be wrapped with `@lit/react` for React integration:

```tsx
import React from 'react';
import { createComponent } from '@lit/react';
import { PhzEditorShell } from '@phozart/phz-editor';

const EditorShell = createComponent({
  tagName: 'phz-editor-shell',
  elementClass: PhzEditorShell,
  react: React,
  events: {
    onEditorNavigate: 'editor-navigate',
  },
});

function AuthoringApp() {
  return (
    <EditorShell
      config={editorConfig}
      onEditorNavigate={(e) => console.log('Navigate:', e.detail)}
    />
  );
}
```

## Custom Elements

| Element | Description |
|---------|-------------|
| `<phz-editor-shell>` | Top-level editor shell with navigation, undo/redo, auto-save |
| `<phz-editor-catalog>` | Artifact catalog with create dialog, type and visibility filtering |
| `<phz-editor-dashboard>` | Dashboard editor with drag-and-drop widget placement |
| `<phz-editor-report>` | Report designer with column, filter, and sort configuration |
| `<phz-editor-explorer>` | Data explorer with dimension/measure selection and save-to-artifact |
| `<phz-measure-palette>` | Draggable palette of available measures and dimensions |
| `<phz-editor-config-panel>` | Widget configuration panel with validation |
| `<phz-sharing-flow>` | Artifact sharing dialog with visibility and target selection |
| `<phz-alert-subscription>` | Personal alert and subscription management |

## Headless State Machines

All state management is provided as pure functions for testability and framework flexibility:

### Editor Shell State

```ts
import { createEditorShellState, navigateTo, toggleEditMode, pushUndo, undo } from '@phozart/phz-editor';

let state = createEditorShellState();
state = navigateTo(state, { screen: 'catalog' });
state = toggleEditMode(state);
state = pushUndo(state, currentSnapshot);
state = undo(state);
```

### Dashboard Editing

```ts
import {
  createDashboardEditState,
  addWidget,
  moveWidget,
  resizeWidget,
  setDashboardTitle,
} from '@phozart/phz-editor';

let dashboard = createDashboardEditState();
dashboard = setDashboardTitle(dashboard, 'Q4 Revenue Dashboard');
dashboard = addWidget(dashboard, { type: 'kpi-card', config: { ... } });
dashboard = moveWidget(dashboard, 'widget-1', { row: 0, col: 2 });
dashboard = resizeWidget(dashboard, 'widget-1', { width: 2, height: 1 });
```

### Report Editing

```ts
import {
  createReportEditState,
  addReportColumn,
  addReportFilter,
  setReportSorts,
  toggleReportPreview,
} from '@phozart/phz-editor';

let report = createReportEditState();
report = addReportColumn(report, { field: 'revenue', header: 'Revenue' });
report = addReportFilter(report, { field: 'region', operator: 'eq', value: 'EMEA' });
report = setReportSorts(report, [{ field: 'revenue', direction: 'desc' }]);
report = toggleReportPreview(report);
```

### Explorer

```ts
import {
  createExplorerState,
  addDimension,
  addMeasure,
  setExplorerResults,
} from '@phozart/phz-editor';

let explorer = createExplorerState();
explorer = addDimension(explorer, 'region');
explorer = addMeasure(explorer, 'total_revenue');
explorer = setExplorerResults(explorer, queryResults);
```

### Measure Palette

```ts
import { createMeasurePaletteState, searchMeasures, filterByCategory } from '@phozart/phz-editor';

let palette = createMeasurePaletteState();
palette = searchMeasures(palette, 'revenue');
palette = filterByCategory(palette, 'financial');
```

### Sharing

```ts
import {
  createSharingFlowState,
  setTargetVisibility,
  addShareTarget,
} from '@phozart/phz-editor';

let sharing = createSharingFlowState();
sharing = setTargetVisibility(sharing, 'shared');
sharing = addShareTarget(sharing, { type: 'role', value: 'analyst' });
```

### Alerts and Subscriptions

```ts
import {
  createAlertSubscriptionState,
  addAlert,
  addSubscription,
  toggleAlertEnabled,
} from '@phozart/phz-editor';

let alertSub = createAlertSubscriptionState();
alertSub = addAlert(alertSub, { name: 'Revenue Drop', condition: '...' });
alertSub = addSubscription(alertSub, { name: 'Weekly Summary', frequency: 'weekly' });
```

## Configuration

```ts
import { createEditorShellConfig, validateEditorConfig } from '@phozart/phz-editor';

const config = createEditorShellConfig({
  features: {
    dashboards: true,
    reports: true,
    explorer: true,
    alerts: true,
    sharing: true,
  },
  autoSave: true,
  autoSaveDebounceMs: 2000,
});

const validation = validateEditorConfig(config);
if (!validation.valid) {
  console.error('Config errors:', validation.errors);
}
```

## Key Features

- **Undo/Redo** — Full undo/redo stack for all editing operations
- **Auto-save** — Configurable debounced auto-save with dirty state tracking
- **Measure Palette** — Drag measures and dimensions onto widgets
- **Widget Config Panel** — Validated configuration with section-level expand/collapse
- **Sharing Flow** — Visibility transitions (personal > shared > published) with target selection
- **Alert Management** — Create personal alerts with threshold conditions and notification channels
- **Subscription Management** — Schedule recurring report deliveries

## License

MIT
