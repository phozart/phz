# UX T3-B1 Architecture Spec

**Items**: UX-014 through UX-018 (Delighters)
**Created**: 2026-03-13

---

## UX-014: Expression Autocomplete

### Problem

The expression builder component has a text input for formulas but no autocomplete. Users must memorize field names, parameter IDs, function names, and syntax. This slows authoring and increases errors.

### Solution

Headless state machine for expression autocomplete. Given a formula string and cursor position, computes contextual suggestions (fields, parameters, metrics, calc fields, functions, operators). Supports keyboard navigation and selection.

### Architecture

**Pattern**: Headless state machine (pure functions, immutable state).
**Package**: `@phozart/workspace` under `workspace/src/engine-admin/`

#### Existing Infrastructure

- `formula-parser.ts` — recursive descent parser with tokenizer, 55 built-in functions
- `expression-types.ts` — AST with 5 reference types: `[field]`, `$param`, `@metric`, `~calc`, literal
- `expression-validator.ts` — validation context with available fields/params/metrics/calcFields
- `phz-expression-builder.ts` — Lit component with palette chips (no inline autocomplete)

#### State Shape

```typescript
type SuggestionKind = 'field' | 'parameter' | 'metric' | 'calc-field' | 'function' | 'keyword';

interface AutocompleteSuggestion {
  kind: SuggestionKind;
  label: string; // display name
  insertText: string; // text to insert (e.g., '[field_name]', 'ABS(')
  detail?: string; // e.g., function signature or data type
}

interface AutocompleteContext {
  fields: string[];
  parameters: string[];
  metrics: string[];
  calculatedFields: string[];
  level: 'row' | 'metric'; // determines which refs are valid
}

interface ExpressionAutocompleteState {
  open: boolean;
  suggestions: AutocompleteSuggestion[];
  selectedIndex: number;
  query: string; // partial token being typed
  anchorPosition: number; // cursor position where suggestion starts
}
```

#### Functions

| Function                            | Signature                                                  | Purpose                                   |
| ----------------------------------- | ---------------------------------------------------------- | ----------------------------------------- |
| `createExpressionAutocompleteState` | `() => State`                                              | Factory (closed, empty)                   |
| `computeSuggestions`                | `(state, formulaText, cursorPos, context) => State`        | Parse context at cursor, generate matches |
| `selectNext`                        | `(state) => State`                                         | Move selection down (wraps)               |
| `selectPrevious`                    | `(state) => State`                                         | Move selection up (wraps)                 |
| `acceptSuggestion`                  | `(state) => { state, insertText, anchorPosition } \| null` | Accept current selection                  |
| `dismissAutocomplete`               | `(state) => State`                                         | Close suggestions                         |
| `getSelectedSuggestion`             | `(state) => AutocompleteSuggestion \| null`                | Selector                                  |

#### Suggestion Logic

1. Extract partial token at cursor (scan backwards to find token start)
2. Determine trigger context:
   - After `[` → field suggestions
   - After `$` → parameter suggestions
   - After `@` → metric suggestions (only at metric level)
   - After `~` → calc field suggestions (only at row level)
   - After operator/open-paren/comma/start → function + reference suggestions
3. Filter by prefix match (case-insensitive)
4. Sort: exact prefix first, then alphabetical

#### Affected Files

| File                                                          | Change                     |
| ------------------------------------------------------------- | -------------------------- |
| `workspace/src/engine-admin/expression-autocomplete-state.ts` | NEW                        |
| `workspace/src/engine-admin/index.ts`                         | Export new types/functions |

---

## UX-015: Visual Dependency Graph

### Problem

Users building complex data models with calculated fields, metrics, and KPIs cannot easily see how entities depend on each other. Circular dependencies or broken references are discovered only at evaluation time.

### Solution

Headless state machine for dependency graph visualization. Manages node selection, path highlighting (upstream dependencies and downstream dependents), layer visibility, and layout metadata. Consumes the existing `dependency-graph.ts` infrastructure.

### Architecture

**Pattern**: Headless state machine.
**Package**: `@phozart/workspace` under `workspace/src/engine-admin/`

#### Existing Infrastructure

- `engine/src/dependency-graph.ts` — full DAG with `extractDependencies()`, `getDependents()`, `detectCycles()`, `topologicalSort()`
- 5 layers: fields → params → calc fields → metrics → KPIs
- Layer colors defined in `phz-expression-builder.ts`

#### State Shape

```typescript
type GraphNodeKind = 'field' | 'parameter' | 'calc-field' | 'metric' | 'kpi';

interface GraphNode {
  id: string;
  kind: GraphNodeKind;
  label: string;
  layer: number; // 1-5 matching dependency-graph layers
}

interface GraphEdge {
  from: string; // source node id
  to: string; // target node id
}

interface DependencyGraphViewState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string | null;
  highlightedNodeIds: ReadonlySet<string>; // upstream + downstream path
  highlightDirection: 'none' | 'upstream' | 'downstream' | 'both';
  collapsedLayers: ReadonlySet<number>; // hidden layers (1-5)
  searchQuery: string;
  filteredNodeIds: ReadonlySet<string>; // nodes matching search
}
```

#### Functions

| Function                         | Signature                         | Purpose                                            |
| -------------------------------- | --------------------------------- | -------------------------------------------------- |
| `createDependencyGraphViewState` | `(nodes, edges) => State`         | Factory                                            |
| `selectNode`                     | `(state, nodeId) => State`        | Select + highlight both directions                 |
| `clearSelection`                 | `(state) => State`                | Deselect                                           |
| `highlightUpstream`              | `(state, nodeId, edges) => State` | Highlight dependencies                             |
| `highlightDownstream`            | `(state, nodeId, edges) => State` | Highlight dependents                               |
| `highlightBoth`                  | `(state, nodeId, edges) => State` | Highlight full path                                |
| `toggleLayerVisibility`          | `(state, layer) => State`         | Show/hide a layer                                  |
| `setGraphSearch`                 | `(state, query, nodes) => State`  | Filter nodes by search                             |
| `getVisibleNodes`                | `(state) => GraphNode[]`          | Selector: visible (non-collapsed, matching search) |
| `getVisibleEdges`                | `(state) => GraphEdge[]`          | Selector: edges between visible nodes              |

#### Path Computation

`highlightUpstream` / `highlightDownstream` — BFS traversal of edges to collect all reachable node IDs. Pure function, takes edges as parameter (no graph instance dependency).

#### Affected Files

| File                                                        | Change                     |
| ----------------------------------------------------------- | -------------------------- |
| `workspace/src/engine-admin/dependency-graph-view-state.ts` | NEW                        |
| `workspace/src/engine-admin/index.ts`                       | Export new types/functions |

---

## UX-016: Drag-Drop Data Model to Canvas

### Problem

When a user drags a field from the data model sidebar to an empty canvas area, the system auto-creates a widget using a simple heuristic (number → kpi-card, else → bar-chart). This often produces poor results (e.g., a currency field becomes a plain KPI instead of a formatted card, or a date field becomes a bar chart instead of a trend line).

### Solution

Headless state machine for smart field-to-widget inference. Uses field metadata (data type, semantic hint, cardinality) to recommend the best widget type, variant, and initial configuration. Also supports multi-field drop (dropping several fields at once).

### Architecture

**Pattern**: Headless state machine.
**Package**: `@phozart/workspace` under `workspace/src/authoring/`

#### Existing Infrastructure

- `drag-drop-state.ts` — DragSource/DropTarget with `executeDrop()` (uses simple number→kpi, else→bar heuristic)
- `data-adapter.ts` — `FieldMetadata` with semanticHint ('measure'|'dimension'|'timestamp'|'category'|'currency'|'percentage')
- `chart-suggest.ts` — `suggestChartType(query)` for multi-field queries

#### State Shape

```typescript
interface FieldDropInference {
  widgetType: string; // recommended widget type
  variant?: string; // recommended variant
  rationale: string; // why this was chosen
  confidence: number; // 0-1 confidence score
  dataConfig: {
    dimensions: string[];
    measures: string[];
  };
}

interface FieldDropInferenceState {
  inferences: FieldDropInference[]; // ranked list (best first)
  selectedIndex: number; // which inference is selected
  fields: FieldInput[]; // fields being dropped
}

interface FieldInput {
  name: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  semanticHint?: string;
}
```

#### Functions

| Function                        | Signature                               | Purpose                     |
| ------------------------------- | --------------------------------------- | --------------------------- |
| `createFieldDropInferenceState` | `() => State`                           | Factory (empty)             |
| `inferWidgetForField`           | `(state, field) => State`               | Single field inference      |
| `inferWidgetForFields`          | `(state, fields) => State`              | Multi-field inference       |
| `selectInference`               | `(state, index) => State`               | Pick alternative suggestion |
| `getSelectedInference`          | `(state) => FieldDropInference \| null` | Selector                    |
| `clearInference`                | `(state) => State`                      | Reset                       |

#### Inference Rules

| Field Profile              | Widget        | Variant  | Confidence |
| -------------------------- | ------------- | -------- | ---------- |
| number + currency          | kpi-card      | standard | 0.9        |
| number + percentage        | gauge         | standard | 0.85       |
| number (other)             | kpi-card      | standard | 0.8        |
| date/timestamp             | trend-line    | standard | 0.9        |
| string + low cardinality   | pie-chart     | standard | 0.8        |
| string + high cardinality  | data-table    | standard | 0.85       |
| boolean                    | kpi-card      | standard | 0.7        |
| Multi: 1 date + 1 number   | trend-line    | —        | 0.95       |
| Multi: 1 string + 1 number | bar-chart     | —        | 0.9        |
| Multi: 2+ number           | kpi-scorecard | —        | 0.8        |

#### Affected Files

| File                                                    | Change                     |
| ------------------------------------------------------- | -------------------------- |
| `workspace/src/authoring/field-drop-inference-state.ts` | NEW                        |
| `workspace/src/authoring/index.ts`                      | Export new types/functions |

---

## UX-017: Live Preview Toggle in Builders

### Problem

The dashboard editor has `enterPreview`/`exitPreview` but lacks responsive breakpoint preview (tablet, mobile) and the toggle is buried in menus. Users can't quickly check how their dashboard will look at different screen sizes or for different roles.

### Solution

Headless state machine for enhanced preview mode. Adds responsive breakpoints (desktop/tablet/mobile with pixel widths), quick-cycle through breakpoints, and annotation visibility toggle. Complements the existing editorMode state.

### Architecture

**Pattern**: Headless state machine.
**Package**: `@phozart/workspace` under `workspace/src/authoring/`

#### Existing Infrastructure

- `dashboard-editor-state.ts` — `editorMode: 'edit'|'preview'`, `previewRole`, `enterPreview()`, `exitPreview()`

#### State Shape

```typescript
type PreviewBreakpoint = 'desktop' | 'tablet' | 'mobile';

interface PreviewBreakpointConfig {
  name: PreviewBreakpoint;
  label: string;
  width: number; // px
}

interface LivePreviewState {
  active: boolean;
  breakpoint: PreviewBreakpoint;
  role: 'admin' | 'author' | 'viewer';
  showAnnotations: boolean; // show design annotations in preview
  showBreakpointLabel: boolean; // show current breakpoint name
}
```

#### Constants

```typescript
PREVIEW_BREAKPOINTS: PreviewBreakpointConfig[] = [
  { name: 'desktop', label: 'Desktop', width: 1440 },
  { name: 'tablet', label: 'Tablet', width: 768 },
  { name: 'mobile', label: 'Mobile', width: 375 },
]
```

#### Functions

| Function                 | Signature                                 | Purpose                             |
| ------------------------ | ----------------------------------------- | ----------------------------------- |
| `createLivePreviewState` | `(overrides?) => State`                   | Factory                             |
| `togglePreview`          | `(state) => State`                        | Toggle active on/off                |
| `setPreviewBreakpoint`   | `(state, breakpoint) => State`            | Set specific breakpoint             |
| `cycleBreakpoint`        | `(state) => State`                        | Cycle desktop→tablet→mobile→desktop |
| `setPreviewRole`         | `(state, role) => State`                  | Change viewer perspective           |
| `toggleAnnotations`      | `(state) => State`                        | Toggle design annotations           |
| `toggleBreakpointLabel`  | `(state) => State`                        | Toggle breakpoint label             |
| `getBreakpointWidth`     | `(state) => number`                       | Get current breakpoint width        |
| `getBreakpointConfig`    | `(breakpoint) => PreviewBreakpointConfig` | Lookup config                       |

#### Affected Files

| File                                            | Change                     |
| ----------------------------------------------- | -------------------------- |
| `workspace/src/authoring/live-preview-state.ts` | NEW                        |
| `workspace/src/authoring/index.ts`              | Export new types/functions |

---

## UX-018: Smart Filter Recommendations

### Problem

When building dashboards, users must manually create filter definitions and figure out which fields to filter, what filter types to use, and how filters should cascade. This requires understanding the data model deeply.

### Solution

Headless state machine that analyzes the data schema and current dashboard widgets to recommend filters. Recommendations include field, filter type, rationale, confidence, and suggested cascade relationships.

### Architecture

**Pattern**: Headless state machine.
**Package**: `@phozart/workspace` under `workspace/src/filters/`

#### Existing Infrastructure

- `schema-analyzer.ts` — classifies fields: timeFields, suggestedMeasures, suggestedDimensions
- `filter-definition.ts` — FilterDefinition with filterType, bindings, dependsOn
- `chart-suggest.ts` — field analysis heuristics

#### State Shape

```typescript
interface FilterRecommendation {
  id: string;
  field: string;
  filterType: 'select' | 'multi-select' | 'range' | 'date-range' | 'boolean';
  rationale: string;
  confidence: number; // 0-1
  suggestedLabel: string;
  cascadeParentId?: string; // recommended parent filter
}

interface FilterRecommendationState {
  recommendations: FilterRecommendation[];
  appliedIds: ReadonlySet<string>;
  dismissedIds: ReadonlySet<string>;
}
```

#### Functions

| Function                          | Signature                                        | Purpose                              |
| --------------------------------- | ------------------------------------------------ | ------------------------------------ |
| `createFilterRecommendationState` | `() => State`                                    | Factory (empty)                      |
| `computeFilterRecommendations`    | `(state, fields, existingFilterFields) => State` | Generate recommendations             |
| `applyRecommendation`             | `(state, id) => State`                           | Mark as applied                      |
| `dismissRecommendation`           | `(state, id) => State`                           | Mark as dismissed                    |
| `undoDismiss`                     | `(state, id) => State`                           | Remove from dismissed                |
| `getActiveRecommendations`        | `(state) => FilterRecommendation[]`              | Selector: not applied, not dismissed |
| `getRecommendationById`           | `(state, id) => FilterRecommendation \| null`    | Selector                             |

#### Recommendation Rules

| Field Profile               | Filter Type  | Confidence | Rationale                               |
| --------------------------- | ------------ | ---------- | --------------------------------------- |
| string + low cardinality    | select       | 0.9        | "Few distinct values — dropdown filter" |
| string + medium cardinality | multi-select | 0.85       | "Multiple values — multi-select filter" |
| string + high cardinality   | text         | 0.7        | "Many distinct values — search filter"  |
| date/timestamp              | date-range   | 0.95       | "Date field — date range picker"        |
| number + measure            | range        | 0.8        | "Numeric measure — range slider"        |
| boolean                     | boolean      | 0.9        | "Boolean field — toggle filter"         |

Cascade: if a date field and a category field both exist, recommend date as parent of category.

#### Affected Files

| File                                                   | Change                     |
| ------------------------------------------------------ | -------------------------- |
| `workspace/src/filters/filter-recommendation-state.ts` | NEW                        |
| `workspace/src/filters/index.ts`                       | Export new types/functions |

---

## Cross-Cutting

- All 5 state machines are pure functions with no DOM dependency
- All use `environment: 'node'` Vitest tests
- No changes to existing public APIs or state machines
- All in workspace package (different sub-paths)
