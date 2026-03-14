# @phozart/workspace

The Sequencer -- BI authoring environment for assembling dashboards, reports, and data explorations.

In the phozart modular system, the workspace is where you **compose** the other modules. It connects grid, engine, widgets, criteria, and shared into complete BI artifacts: reports, dashboards, templates, and exploratory views.

## Install

```bash
npm install @phozart/workspace
```

## What It Does

The workspace provides the administrative and authoring tools for building BI content:

- **Grid Admin** (`./grid-admin`) -- Column management, formatting, export settings
- **Engine Admin** (`./engine-admin`) -- Report and dashboard designers, KPI configuration
- **Grid Creator** (`./grid-creator`) -- Stepped wizard for creating new grid/report artifacts
- **Criteria Admin** (`./criteria-admin`) -- Filter definition management, rule configuration
- **Definition UI** (`./definition-ui`) -- Blueprint editor for serializable grid definitions
- **Widget Registry** (`./registry`) -- ManifestRegistry with variant support for widget discovery
- **Templates** (`./templates`) -- Schema analyzer, template matcher, auto-binding
- **Layout** (`./layout`) -- Composable LayoutNode tree with CSS Grid rendering
- **Filters** (`./filters`) -- 4-level filter hierarchy, cascading, URL sync
- **Explore** (`./explore`) -- Visual query explorer, chart suggest, artifact conversion
- **Connectors** (`./connectors`) -- Remote data connectors, CORS handling, credentials

## I/O

| Input                                                   | Output                                    |
| ------------------------------------------------------- | ----------------------------------------- |
| `DataAdapter` (consumer-provided backend SPI)           | Configured dashboards, reports, templates |
| `@phozart/engine` types (ReportConfig, DashboardConfig) | Lit Web Components for admin UIs          |
| `@phozart/core` types (GridConfig, ColumnDefinition)    | Orchestrated data pipelines               |
| `@phozart/criteria` filter definitions                  | Filter state management                   |

## Sub-path Imports

```ts
import '@phozart/workspace/grid-admin'; // Grid admin panel
import '@phozart/workspace/engine-admin'; // Dashboard/report designers
import '@phozart/workspace/grid-creator'; // Creation wizard
import '@phozart/workspace/criteria-admin'; // Filter admin
import '@phozart/workspace/registry'; // Widget registry
import '@phozart/workspace/templates'; // Template matching
import '@phozart/workspace/layout'; // Layout system
import '@phozart/workspace/filters'; // Filter hierarchy
import '@phozart/workspace/explore'; // Visual explorer
import '@phozart/workspace/connectors'; // Remote data
```

## The Three Shells

The workspace is the **studio console** -- where the synthesist (author) builds patches. It is not intended for end-user consumption. The output flows to:

- **`@phozart/viewer`** -- The speaker (read-only consumption for analysts)
- **`@phozart/editor`** -- The performer's interface (authoring with live preview)

## Dependencies

- `@phozart/core` -- Grid state and column types
- `@phozart/engine` -- Report/dashboard configuration types
- `@phozart/shared` -- Adapters, types, design tokens
- `@phozart/criteria` -- Filter definitions
- `lit` -- Web Component rendering

## License

MIT
