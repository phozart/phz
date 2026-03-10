# @phozart/phz-engine

Headless BI computation engine for phz-grid. Provides KPIs, metrics, aggregation, pivot tables, chart projections, dashboards, reports, selection criteria, expression evaluation, and drill-through with zero DOM dependencies.

## Installation

```bash
npm install @phozart/phz-engine @phozart/phz-core
```

## Quick Start

```ts
import { createBIEngine } from '@phozart/phz-engine';

const engine = createBIEngine({
  dataProducts: [...],
  kpis: [...],
  metrics: [...],
});
```

## Core Concepts

### Data Products

Define your data sources with typed schemas:

```ts
import { createDataProductRegistry } from '@phozart/phz-engine';

const registry = createDataProductRegistry();
registry.register({
  id: 'sales',
  name: 'Sales Data',
  fields: [
    { name: 'revenue', type: 'number', aggregation: 'sum' },
    { name: 'region', type: 'string', role: 'dimension' },
    { name: 'date', type: 'date', role: 'dimension' },
  ],
});
```

### KPIs

```ts
import { createKPIRegistry, computeStatus, computeDelta, classifyKPIScore } from '@phozart/phz-engine';

const kpiRegistry = createKPIRegistry();
kpiRegistry.register({
  id: 'revenue-target',
  name: 'Revenue vs Target',
  unit: 'currency',
  direction: 'higher-is-better',
  thresholds: { danger: 70, warning: 90, target: 100 },
  dataSource: { productId: 'sales', valueField: 'revenue', aggregation: 'sum' },
});

// Compute status
const status = computeStatus(95, { danger: 70, warning: 90, target: 100 });
// { level: 'warning', color: '#f59e0b', icon: '...' }

const delta = computeDelta(95, 85);
// { value: 10, percentage: 11.76, direction: 'up' }
```

### Metrics

```ts
import { createMetricCatalog } from '@phozart/phz-engine';

const catalog = createMetricCatalog();
catalog.register({
  id: 'avg-order-value',
  name: 'Average Order Value',
  formula: { type: 'simple', field: 'revenue', aggregation: 'avg' },
  format: { type: 'currency', currency: 'USD', decimals: 2 },
});
```

### Aggregation

```ts
import { computeAggregation, computeGroupAggregations } from '@phozart/phz-engine';

const total = computeAggregation(data, 'revenue', 'sum');
const grouped = computeGroupAggregations(data, 'region', [
  { field: 'revenue', aggregation: 'sum' },
  { field: 'quantity', aggregation: 'avg' },
]);
```

### Pivot Tables

```ts
import { computePivot, pivotResultToFlatRows } from '@phozart/phz-engine';

const pivot = computePivot(data, {
  rowFields: ['region'],
  columnField: 'quarter',
  valueField: 'revenue',
  aggregation: 'sum',
});

const rows = pivotResultToFlatRows(pivot);
```

### Chart Projections

```ts
import { projectChartData, projectPieData } from '@phozart/phz-engine';

const barData = projectChartData(data, {
  categoryField: 'month',
  valueField: 'revenue',
});

const pieData = projectPieData(data, {
  categoryField: 'region',
  valueField: 'revenue',
});
```

### Reports

```ts
import { createReportConfigStore } from '@phozart/phz-engine';

const store = createReportConfigStore();
store.register({
  id: 'monthly-sales',
  name: 'Monthly Sales Report',
  dataProductId: 'sales',
  columns: [
    { field: 'region', header: 'Region' },
    { field: 'revenue', header: 'Revenue', aggregation: 'sum' },
  ],
});
```

### Dashboards

```ts
import { createDashboardConfigStore } from '@phozart/phz-engine';

const dashStore = createDashboardConfigStore();
dashStore.register({
  id: 'sales-overview',
  name: 'Sales Overview',
  layout: { type: 'grid', columns: 12 },
  widgets: [
    { type: 'kpi-card', kpiId: 'revenue-target', position: { x: 0, y: 0, w: 3, h: 2 } },
    { type: 'bar-chart', config: { ... }, position: { x: 3, y: 0, w: 6, h: 4 } },
  ],
});
```

### Selection Criteria

Page-level filters with presets, date ranges, and dependencies:

```ts
import {
  resolveBuiltinPreset,
  getAvailablePresets,
  applyCriteriaToData,
  serializeCriteria,
  deserializeCriteria,
} from '@phozart/phz-engine';

const presets = getAvailablePresets();
const dateRange = resolveBuiltinPreset('last-30-days');
const filtered = applyCriteriaToData(data, criteria);
```

### Expression Engine

Parse and evaluate formulas:

```ts
import { parseFormula, evaluateRowExpression, validateExpression } from '@phozart/phz-engine';

const ast = parseFormula('revenue * 0.1 + IF(region == "US", bonus, 0)');
const errors = validateExpression(ast, context);
const value = evaluateRowExpression(ast, row, context);
```

### Filter System

```ts
import {
  createFilterRegistry,
  createFilterBindingStore,
  createFilterStateManager,
  createFilterRuleEngine,
  createCriteriaEngine,
} from '@phozart/phz-engine';

// Unified criteria engine facade
const criteriaEngine = createCriteriaEngine({
  filters: filterDefinitions,
  bindings: bindingConfig,
  rules: ruleDefinitions,
});
```

### Drill-Through

```ts
import { resolveDrillFilter, resolveDrillAction } from '@phozart/phz-engine';

const filter = resolveDrillFilter({
  source: { type: 'chart', category: 'US', series: 'Q1' },
  drillConfig: { targetReportId: 'detail-report', filterMapping: { ... } },
});
```

### Services

Runtime orchestrators for reports and dashboards:

```ts
import { createReportService, createDashboardService } from '@phozart/phz-engine';

const reportService = createReportService({ reportStore, criteriaEngine, dataProducts });
const dashboardService = createDashboardService({ dashboardStore, criteriaEngine, dataProducts });
```

## Facade

The `createBIEngine` function provides a unified entry point:

```ts
import { createBIEngine } from '@phozart/phz-engine';
import type { BIEngine, BIEngineConfig } from '@phozart/phz-engine';

const engine = createBIEngine(config);
```

## License

MIT
