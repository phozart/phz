# Workstream A: Foundation

> Detailed implementation guide for package extraction, type creation,
> and data architecture changes.

## Objective

Extract shared infrastructure from workspace into phz-shared. Move explorer
to engine. Build multi-source data pipeline. Establish all new types and
adapter contracts. Everything else depends on this workstream.

## Phase A-1: Package Extraction

### Step-by-step extraction order

The extraction must happen in a specific order to avoid circular dependencies
and broken builds.

**Step 1: Create the package shell (A-1.01)**
```
packages/shared/
├── package.json         # name: @phozart/phz-shared, no dependencies
├── tsconfig.json        # extends workspace tsconfig, strict mode
├── src/
│   ├── index.ts         # barrel export
│   ├── adapters/
│   ├── types/
│   ├── design-system/
│   ├── coordination/
│   └── components/
└── vitest.config.ts
```

**Step 2: Move adapter interfaces (A-1.02)**
Move from `packages/workspace/src/data-adapter.ts` and create new files:
```
src/adapters/
├── data-adapter.ts              # existing DataAdapter + new async methods
├── persistence-adapter.ts       # existing + new filter/alert methods
├── alert-channel-adapter.ts     # existing
├── measure-registry-adapter.ts  # NEW
├── help-config.ts               # NEW
├── attention-adapter.ts         # NEW
├── usage-analytics-adapter.ts   # NEW
├── subscription-adapter.ts      # NEW
└── index.ts                     # barrel
```

In workspace, replace the original files with re-exports from shared:
```typescript
// packages/workspace/src/data-adapter.ts
/** @deprecated Import from @phozart/phz-shared instead */
export { DataAdapter, DataQuery, DataResult } from '@phozart/phz-shared';
```

**Step 3: Move design system (A-1.03)**
Move from `packages/workspace/src/styles/` to `packages/shared/src/design-system/`.
Files: design-tokens.ts, responsive.ts, container-queries.ts, explorer-visual.ts,
mobile-interactions.ts. Same deprecation re-export pattern in workspace.

**Step 4: Move artifact types (A-1.04)**
Move from `packages/workspace/src/navigation/` to `packages/shared/src/types/`.
Files: artifact-visibility.ts, default-presentation.ts, grid-artifact.ts.

**Step 5: Move runtime coordination (A-1.05)**
Move from `packages/workspace/src/coordination/` and `packages/workspace/src/filters/`
to `packages/shared/src/coordination/`. Files: dashboard-data-pipeline.ts,
filter-context-manager.ts, query-coordinator.ts, interaction-bus.ts,
navigation-event.ts, loading-indicator.ts.

**Step 6-22: Create new types (A-1.06 through A-1.22)**
Create each new type in `packages/shared/src/types/`. Each type gets its own
file with the type definition and any associated pure functions.

**Step 23: Update workspace imports (A-1.23)**
Find-and-replace all imports in workspace that referenced moved files.
Every import must come from `@phozart/phz-shared`. Build must pass.

**Step 24: Deprecation warnings (A-1.24)**
Add `./internals` subpath in workspace package.json exports field.
Add console.warn deprecation notices on old export paths.

### Verification after A-1

```bash
# Build shared package
cd packages/shared && npm run build

# Build workspace (must still pass)
cd packages/workspace && npm run build

# Run existing workspace tests (must still pass)
cd packages/workspace && npm run test

# Run new shared tests
cd packages/shared && npm run test
```

## Phase A-2: Explorer Move + Data Architecture

### Explorer extraction (A-2.01, A-2.02, A-2.03)

Move from `packages/workspace/src/` to `packages/engine/src/explorer/`:
- createDataExplorer, DataExplorerState, subscribe, getState
- Drop zone state: createDropZoneState, addFieldToZone, removeFieldFromZone, moveFieldBetweenZones
- Field palette: createFieldPalette, groupFieldsByType, searchFields, PaletteField
- autoPlaceField, getDefaultAggregation, getCardinalityWarning
- suggestChartType
- exploreToReport, exploreToDashboardWidget, promoteFilterToDashboard

Add deprecation re-exports in workspace. Update workspace to import from engine.

### Multi-source data config (A-2.04)

Replace the existing DashboardDataConfig:

```typescript
// OLD (single source)
interface DashboardDataConfig {
  preload: PreloadConfig;
  fullLoad: FullLoadConfig;
  detailSources?: DetailSourceConfig[];
  transition?: 'seamless' | 'fade' | 'replace';
}

// NEW (multi-source)
interface DashboardDataConfig {
  sources: DashboardSourceConfig[];
  detailSources?: DetailSourceConfig[];
  transition?: 'seamless' | 'fade' | 'replace';
  fullLoadConcurrency?: number;  // default 2
}
```

Must maintain backward compatibility: if an existing config has `preload`
and `fullLoad` instead of `sources`, auto-convert to a single-entry
sources array. Add a migration function.

### Loading orchestrator (A-2.05)

Replace the existing DashboardDataPipeline.start() with multi-source logic.
The pipeline must:
1. Sort sources by priority (lowest first)
2. Build dependency graph from dependsOn
3. Fire all preloads in parallel
4. Fire full-loads in parallel with concurrency limit
5. Respect dependency ordering (wait for dependsOn sources)
6. Update DashboardLoadingState as each source completes
7. Provide getWidgetData(widgetId, tier) across all sources

### Execution engine selection (A-2.06)

Extend buildQueryPlan to implement the automatic decision chain.
The key function:

```typescript
function selectExecutionEngine(
  result: DataResult,
  config: DashboardSourceConfig
): 'js' | 'duckdb' | 'server' {
  if (config.forceServerSide) return 'server';
  const rowCount = result.metadata.totalRows;
  if (rowCount < 10000) return 'js';
  if (rowCount <= 100000 && hasArrowBuffer(result)) return 'duckdb';
  if (hasArrowBuffer(result)) return 'duckdb';
  return 'server';
}
```
