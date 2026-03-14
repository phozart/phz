# @phozart/widgets

Lit Web Component widgets for the phz-grid SDK. Provides KPI cards, scorecards, bar charts, trend lines, status tables, dashboards, and more. All components are framework-agnostic custom elements.

## Installation

```bash
npm install @phozart/widgets @phozart/engine @phozart/core
```

**Peer dependency:** `lit ^3.0.0`

## Quick Start

```ts
import '@phozart/widgets';
```

```html
<!-- KPI Card -->
<phz-kpi-card
  title="Revenue"
  value="1250000"
  format="currency"
  target="1000000"
  trend="up"
></phz-kpi-card>

<!-- Bar Chart -->
<phz-bar-chart
  title="Sales by Region"
></phz-bar-chart>

<!-- Dashboard -->
<phz-dashboard
  dashboard-id="sales-overview"
></phz-dashboard>
```

## Components

| Element | Class | Description |
|---------|-------|-------------|
| `<phz-kpi-card>` | `PhzKPICard` | Single KPI with value, target, delta, and status |
| `<phz-kpi-scorecard>` | `PhzKPIScorecard` | Multi-KPI scorecard grid |
| `<phz-bar-chart>` | `PhzBarChart` | Vertical/horizontal bar chart |
| `<phz-trend-line>` | `PhzTrendLine` | Time-series trend line |
| `<phz-bottom-n>` | `PhzBottomN` | Bottom/top N ranked list |
| `<phz-status-table>` | `PhzStatusTable` | Status-colored data table |
| `<phz-drill-link>` | `PhzDrillLink` | Drill-through navigation link |
| `<phz-dashboard>` | `PhzDashboard` | Dashboard container with grid layout |
| `<phz-view-manager>` | `PhzViewManager` | Saved view management (tabs/dropdown) |
| `<phz-selection-bar>` | `PhzSelectionBar` | Active selection criteria display bar |
| `<phz-widget>` | `PhzWidget` | Generic widget wrapper with title bar |

## Usage with Engine

Widgets are designed to work with the `@phozart/engine` computation layer:

```ts
import { resolveWidgetProps, resolveDashboardWidgets } from '@phozart/engine';

// Resolve widget data from engine config
const props = resolveWidgetProps(widgetConfig, data, scoreProvider);

// Resolve all widgets in a dashboard
const widgets = resolveDashboardWidgets(dashboardConfig, data, scoreProvider);
```

## Programmatic Usage

```ts
import { PhzKPICard } from '@phozart/widgets';

const card = document.createElement('phz-kpi-card') as PhzKPICard;
card.title = 'Revenue';
card.value = 1250000;
card.format = 'currency';
card.target = 1000000;
document.body.appendChild(card);
```

## Shared Styles

```ts
import { widgetBaseStyles } from '@phozart/widgets';
```

The `widgetBaseStyles` export provides the base CSS for consistent styling across all widget components.

## License

MIT
