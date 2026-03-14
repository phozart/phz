# @phozart/criteria

Selection criteria components for phz-grid. Provides page-level filter panels with date range pickers, tree selects, numeric ranges, searchable dropdowns, preset management, and admin configuration. Built as Lit Web Components.

## Installation

```bash
npm install @phozart/criteria @phozart/engine @phozart/core
```

**Peer dependency:** `lit ^3.0.0`

## Quick Start

```ts
import '@phozart/criteria';
```

```html
<!-- Full criteria panel -->
<phz-criteria-panel
  .fields=${criteriaFields}
  .values=${criteriaValues}
  @criteria-change=${handleChange}
></phz-criteria-panel>

<!-- Bar + Drawer paradigm -->
<phz-selection-criteria
  .fields=${criteriaFields}
  .values=${criteriaValues}
  .presets=${presets}
></phz-selection-criteria>
```

## Components

### Main Components

| Element | Class | Description |
|---------|-------|-------------|
| `<phz-criteria-panel>` | `PhzCriteriaPanel` | Full criteria panel with all fields |
| `<phz-criteria-field>` | `PhzCriteriaField` | Single criteria field renderer |
| `<phz-criteria-summary>` | `PhzCriteriaSummary` | Active criteria summary display |
| `<phz-preset-manager>` | `PhzPresetManager` | Save/load filter presets |
| `<phz-criteria-admin>` | `PhzCriteriaAdmin` | Admin interface for criteria config |

### Bar + Drawer Pattern

| Element | Class | Description |
|---------|-------|-------------|
| `<phz-selection-criteria>` | `PhzSelectionCriteria` | Orchestrator: bar + drawer |
| `<phz-criteria-bar>` | `PhzCriteriaBar` | Horizontal bar showing active criteria |
| `<phz-filter-drawer>` | `PhzFilterDrawer` | Slide-out drawer with criteria fields |
| `<phz-filter-section>` | `PhzFilterSection` | Collapsible section within the drawer |
| `<phz-expanded-modal>` | `PhzExpandedModal` | Full-screen criteria editing modal |
| `<phz-preset-sidebar>` | `PhzPresetSidebar` | Sidebar for preset management |

### Specialized Field Controls

| Element | Class | Description |
|---------|-------|-------------|
| `<phz-date-range-picker>` | `PhzDateRangePicker` | Date range with presets (last 30 days, YTD, etc.) |
| `<phz-numeric-range-input>` | `PhzNumericRangeInput` | Min/max numeric range input |
| `<phz-tree-select>` | `PhzTreeSelect` | Hierarchical tree selection |
| `<phz-searchable-dropdown>` | `PhzSearchableDropdown` | Searchable multi-select dropdown |
| `<phz-field-presence-filter>` | `PhzFieldPresenceFilter` | Filter by field presence (has/missing value) |
| `<phz-chip-select>` | `PhzChipSelect` | Chip-based multi-select |
| `<phz-match-filter-pill>` | `PhzMatchFilterPill` | Text match filter pill (contains, equals, etc.) |

### Admin Components

| Element | Class | Description |
|---------|-------|-------------|
| `<phz-filter-definition-admin>` | `PhzFilterDefinitionAdmin` | CRUD for filter definitions |
| `<phz-rule-admin>` | `PhzRuleAdmin` | CRUD for filter rules |
| `<phz-preset-admin>` | `PhzPresetAdmin` | CRUD for filter presets |

## Integration with Engine

The criteria components work with `@phozart/engine`'s criteria system:

```ts
import { createCriteriaEngine } from '@phozart/engine';

const engine = createCriteriaEngine({
  filters: filterDefinitions,
  bindings: bindingConfig,
  rules: ruleDefinitions,
});

// Feed resolved values to criteria components
const resolved = engine.resolve(criteriaValues);
```

## License

MIT
