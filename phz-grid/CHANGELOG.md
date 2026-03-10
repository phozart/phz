# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-24

### Added

#### @phozart/phz-core (v0.1.0)
- Headless grid engine with zero DOM dependencies
- `createGrid()` factory function with full GridApi
- Complete state management: sort, filter, selection, edit, columns, viewport, grouping
- Row model pipeline: parse, filter, sort, group, flatten, virtualize
- EventEmitter with typed events (30+ event types)
- Immutable state update utilities
- Type guards for edit states and data sources
- Serializable grid state (export/import)
- 51 unit tests

#### @phozart/phz-grid (v0.1.0)
- `<phz-grid>` Web Component (Lit v5)
- `<phz-column>` declarative column configuration
- Three-layer CSS token system (Brand, Semantic, Component)
- 7 built-in cell renderers: text, number, date, boolean, link, image, progress
- 5 built-in cell editors: text, number, select, date, checkbox
- Accessibility: AriaManager, KeyboardNavigator (roving tabindex), ForcedColorsAdapter
- WCAG 2.2 AA keyboard navigation (arrows, Home/End, PgUp/PgDn, F2, Esc, Enter, Space)
- Windows High Contrast / Forced Colors Mode support
- DOM custom events bridging core EventEmitter
- 21 unit tests

#### @phozart/phz-react (v0.1.0)
- `<PhzGrid>` React component with forwardRef
- 6 hooks: useGridState, useGridSelection, useGridSort, useGridFilter, useGridEdit, useGridData
- Full TypeScript support with GridApi ref handle

#### @phozart/phz-vue (v0.1.0)
- Factory pattern (no hard Vue peer dependency at build time)
- `createPhzGridComponent()` — Vue component factory
- 5 composable factories: useGrid, useGridSelection, useGridSort, useGridFilter, useGridEdit

#### @phozart/phz-angular (v0.1.0)
- Factory pattern (no hard Angular peer dependency at build time)
- `createPhzGridComponent()` — Angular component factory
- `createGridService()` — Injectable GridService factory

#### @phozart/phz-duckdb (v0.1.0)
- `createDuckDBDataSource()` factory for DuckDB-WASM integration
- In-browser SQL analytics with Apache Arrow zero-copy data transfer
- File loading: CSV, Parquet, JSON, Arrow (with auto-detection)
- Schema introspection and table management
- Streaming query results with progress tracking
- Query plan analysis via `getQueryPlan()`
- Parquet metadata inspection
- Grid attachment for automatic data sync
- 16 unit tests

#### @phozart/phz-ai (v0.1.0)
- `createAIToolkit()` factory for AI-powered grid features
- Schema-as-contract: `getStructuredSchema()` returns JSON Schema 7
- Schema inference from sample data (AI-powered + heuristic fallback)
- Natural language to SQL query translation
- Anomaly detection (Z-score and IQR methods)
- Data type suggestions and duplicate detection
- Data summarization and insight generation
- Filter suggestions from natural language input
- 3 built-in providers: OpenAIProvider, AnthropicProvider, GoogleProvider
- 19 unit tests

#### @phozart/phz-collab (v0.1.0)
- `createCollabSession()` factory for real-time collaboration
- Yjs CRDT-based document synchronization
- Presence awareness (cursor, selection, editing indicators)
- Change tracking with full history (local + remote changes)
- Conflict detection and resolution (last-write-wins, manual, custom)
- WebSocketSyncProvider for server-based sync
- WebRTCSyncProvider for peer-to-peer sync
- `getYGridDocument()` for direct Yjs document access
- 33 unit tests

#### @phozart/phz-docs (v0.1.0)
- VitePress documentation site scaffold
- Navigation structure: Guide, API Reference, Examples
- Sections for all 8 public packages

#### @phozart/phz-python (v0.1.0)
- `phz-grid` pip package for Jupyter notebooks
- `Grid` anywidget with Arrow IPC zero-copy data transfer
- `Column` dataclass for typed column definitions
- `Theme` dataclass for theme configuration
- Supports pandas, polars, and pyarrow DataFrames
- Event callbacks: selection, sort, filter, edit, click
- Export to CSV, state import/export
