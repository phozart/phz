/**
 * Sprint X.5 — v14 Exports Verification
 *
 * Verifies all new modules from Sprints S, T, U, V, W are properly
 * exported from the workspace package's sub-module index files.
 */

import { describe, it, expect } from 'vitest';

// ========================================================================
// Sprint S — Visual Design System
// ========================================================================

describe('Sprint S exports (Visual Design System)', () => {
  it('exports design tokens', async () => {
    const styles = await import('../styles/index.js');

    expect(styles.DESIGN_TOKENS).toBeTypeOf('object');
    expect(styles.SHELL_LAYOUT).toBeTypeOf('object');
    expect(styles.SECTION_HEADERS).toBeTypeOf('object');
    expect(styles.generateTokenCSS).toBeTypeOf('function');
  });

  it('exports responsive utilities', async () => {
    const styles = await import('../styles/index.js');

    expect(styles.BREAKPOINT_VALUES).toBeTypeOf('object');
    expect(styles.getViewportBreakpoint).toBeTypeOf('function');
    expect(styles.getBreakpointClasses).toBeTypeOf('function');
    expect(styles.getBottomTabItems).toBeTypeOf('function');
  });

  it('exports container query helpers', async () => {
    const styles = await import('../styles/index.js');

    expect(styles.getKPICardClass).toBeTypeOf('function');
    expect(styles.getChartClass).toBeTypeOf('function');
    expect(styles.getTableClass).toBeTypeOf('function');
    expect(styles.getFilterBarClass).toBeTypeOf('function');
    expect(styles.getVisibleColumns).toBeTypeOf('function');
  });

  it('exports explorer visual helpers', async () => {
    const styles = await import('../styles/index.js');

    expect(styles.EXPLORER_LAYOUT).toBeTypeOf('object');
    expect(styles.SQL_PREVIEW_THEME).toBeTypeOf('object');
    expect(styles.getFieldTypeIcon).toBeTypeOf('function');
    expect(styles.getCardinalityBadgeClass).toBeTypeOf('function');
    expect(styles.getDropZoneClass).toBeTypeOf('function');
  });

  it('exports component pattern helpers', async () => {
    const styles = await import('../styles/index.js');

    expect(styles.DRAWER_DEFAULTS).toBeTypeOf('object');
    expect(styles.STATUS_BADGE_VARIANTS).toBeTypeOf('object');
    expect(styles.getFormDensityClasses).toBeTypeOf('function');
    expect(styles.getModalClasses).toBeTypeOf('function');
    expect(styles.getDrawerClasses).toBeTypeOf('function');
    expect(styles.getEmptyStateProps).toBeTypeOf('function');
    expect(styles.getSkeletonClass).toBeTypeOf('function');
    expect(styles.getOverflowClasses).toBeTypeOf('function');
  });
});

// ========================================================================
// Sprint T — Enterprise Data Architecture
// ========================================================================

describe('Sprint T exports (Enterprise Data Architecture)', () => {
  it('exports DashboardDataConfig types from types.ts', async () => {
    const types = await import('../types.js');

    // T.1 — DashboardDataConfig
    expect(types.isDashboardDataConfig).toBeTypeOf('function');
    expect(types.isDetailSourceConfig).toBeTypeOf('function');
    expect(types.validateDashboardDataConfig).toBeTypeOf('function');
  });

  it('exports QueryStrategy and Arrow IPC from data-adapter.ts', async () => {
    const adapter = await import('../data-adapter.js');

    // T.2 — QueryStrategy is a type (no runtime check), but DataQuery now has strategy field
    expect(adapter.hasArrowBuffer).toBeTypeOf('function');

    // T.3 — Arrow IPC: hasArrowBuffer guard
    const emptyResult = { columns: [], rows: [], metadata: { totalRows: 0, truncated: false, queryTimeMs: 0 } };
    expect(adapter.hasArrowBuffer(emptyResult)).toBe(false);
  });

  it('exports DashboardDataPipeline from coordination', async () => {
    const coord = await import('../coordination/index.js');

    // T.4 — DashboardDataPipeline
    expect(coord.createDashboardDataPipeline).toBeTypeOf('function');
  });

  it('exports DetailSourceLoader from coordination', async () => {
    const coord = await import('../coordination/index.js');

    // T.5 — DetailSourceLoader
    expect(coord.createDetailSourceLoader).toBeTypeOf('function');
  });

  it('exports LoadingIndicatorState from layout', async () => {
    const layout = await import('../layout/index.js');

    // T.6 — LoadingIndicator
    expect(layout.createLoadingIndicatorState).toBeTypeOf('function');
  });

  it('exports query-layer utilities from filters', async () => {
    const filters = await import('../filters/index.js');

    // T.2 — Query layer resolution
    expect(filters.resolveQueryLayer).toBeTypeOf('function');
    expect(filters.classifyFilterChange).toBeTypeOf('function');
  });
});

// ========================================================================
// Sprint U — Enterprise Filter Architecture
// ========================================================================

describe('Sprint U exports (Enterprise Filter Architecture)', () => {
  it('exports FilterDefinition factory and validators', async () => {
    const filters = await import('../filters/index.js');

    // U.1 — FilterDefinition
    expect(filters.createFilterDefinition).toBeTypeOf('function');
    expect(filters.isFilterDefinition).toBeTypeOf('function');
    expect(filters.validateFilterDefinition).toBeTypeOf('function');
    expect(filters.resolveBindingsForSource).toBeTypeOf('function');
    expect(filters.evaluateSecurityBinding).toBeTypeOf('function');
    expect(filters.resolveFilterDefault).toBeTypeOf('function');
  });

  it('exports FilterRuleEngine', async () => {
    const filters = await import('../filters/index.js');

    // U.2 — FilterRuleEngine
    expect(filters.evaluateFilterRules).toBeTypeOf('function');
    expect(filters.evaluateCondition).toBeTypeOf('function');
  });

  it('exports FilterContractResolver', async () => {
    const filters = await import('../filters/index.js');

    // U.3 — FilterContractResolver
    expect(filters.resolveFilterContract).toBeTypeOf('function');
    expect(filters.validateFilterValues).toBeTypeOf('function');
  });

  it('exports FilterRuleEditor', async () => {
    const filters = await import('../filters/index.js');

    // U.4 — FilterRuleEditor
    expect(filters.createFilterRuleEditorState).toBeTypeOf('function');
    expect(filters.addCondition).toBeTypeOf('function');
    expect(filters.removeCondition).toBeTypeOf('function');
    expect(filters.updateCondition).toBeTypeOf('function');
    expect(filters.addAction).toBeTypeOf('function');
    expect(filters.removeAction).toBeTypeOf('function');
    expect(filters.updateAction).toBeTypeOf('function');
    expect(filters.getRuleFromState).toBeTypeOf('function');
    expect(filters.validateRuleState).toBeTypeOf('function');
  });

  it('exports FilterOwnership', async () => {
    const filters = await import('../filters/index.js');

    // U.5 — FilterOwnership
    expect(filters.resolveFiltersFromContract).toBeTypeOf('function');
    expect(filters.prunePresetValues).toBeTypeOf('function');
    expect(filters.applySecurityRestrictions).toBeTypeOf('function');
    expect(filters.buildFilterBarFromContract).toBeTypeOf('function');
  });
});

// ========================================================================
// Sprint V — Navigation & Artifact Management
// ========================================================================

describe('Sprint V exports (Navigation & Artifact Management)', () => {
  it('exports NavigationLink', async () => {
    const nav = await import('../navigation/index.js');

    // V.1 — NavigationLink
    expect(nav.isNavigationLink).toBeTypeOf('function');
    expect(nav.createNavigationLink).toBeTypeOf('function');
    expect(nav.resolveNavigationFilters).toBeTypeOf('function');
    expect(nav.detectCircularLinks).toBeTypeOf('function');
  });

  it('exports NavigationEditor', async () => {
    const nav = await import('../navigation/index.js');

    // V.2 — NavigationEditor
    expect(nav.createNavigationEditorState).toBeTypeOf('function');
    expect(nav.setTarget).toBeTypeOf('function');
    expect(nav.addFilterMapping).toBeTypeOf('function');
    expect(nav.removeFilterMapping).toBeTypeOf('function');
    expect(nav.setOpenBehavior).toBeTypeOf('function');
    expect(nav.getNavigationLink).toBeTypeOf('function');
    expect(nav.validateNavigationEditorState).toBeTypeOf('function');
    expect(nav.autoMapFilters).toBeTypeOf('function');
  });

  it('exports NavigationEvent', async () => {
    const nav = await import('../navigation/index.js');

    // V.3 — NavigationEvent
    expect(nav.buildNavigationEvent).toBeTypeOf('function');
    expect(nav.emitNavigationEvent).toBeTypeOf('function');
  });

  it('exports ArtifactVisibility', async () => {
    const nav = await import('../navigation/index.js');

    // V.4 — ArtifactVisibility
    expect(nav.isVisibleToViewer).toBeTypeOf('function');
    expect(nav.groupByVisibility).toBeTypeOf('function');
    expect(nav.canTransition).toBeTypeOf('function');
    expect(nav.transitionVisibility).toBeTypeOf('function');
    expect(nav.duplicateWithVisibility).toBeTypeOf('function');
  });

  it('exports DefaultPresentation', async () => {
    const nav = await import('../navigation/index.js');

    // V.5 — DefaultPresentation
    expect(nav.createDefaultPresentation).toBeTypeOf('function');
    expect(nav.mergePresentation).toBeTypeOf('function');
    expect(nav.createPersonalView).toBeTypeOf('function');
    expect(nav.applyPersonalView).toBeTypeOf('function');
  });

  it('exports GridArtifact', async () => {
    const nav = await import('../navigation/index.js');

    // V.6 — GridArtifact
    expect(nav.createGridArtifact).toBeTypeOf('function');
    expect(nav.isGridArtifact).toBeTypeOf('function');
    expect(nav.gridArtifactToMeta).toBeTypeOf('function');
  });
});

// ========================================================================
// Sprint W — Local Playground & File Management
// ========================================================================

describe('Sprint W exports (Local Playground & File Management)', () => {
  it('exports session compat functions', async () => {
    const local = await import('../local/index.js');

    // W.7 — Session compat
    expect(local.createExportBundle).toBeTypeOf('function');
    expect(local.validateExportBundle).toBeTypeOf('function');
    expect(local.convertBundleForImport).toBeTypeOf('function');
    expect(local.isLocalServerBundle).toBeTypeOf('function');
    expect(local.SESSION_FORMAT_VERSION).toBe(1);
  });

  it('exports sheet picker', async () => {
    const local = await import('../local/index.js');

    // W.3 — SheetPicker
    expect(local.createSheetPicker).toBeTypeOf('function');
  });

  it('exports demo datasets', async () => {
    const local = await import('../local/index.js');

    // W.5 — DemoDatasets
    expect(local.SAMPLE_DATASETS).toBeInstanceOf(Array);
    expect(local.SAMPLE_DATASETS.length).toBeGreaterThan(0);
    expect(local.generateSampleRows).toBeTypeOf('function');
  });

  it('exports upload preview', async () => {
    const local = await import('../local/index.js');

    // W.3 — Upload preview
    expect(local.inferColumnTypes).toBeTypeOf('function');
  });

  it('exports data source panel', async () => {
    const local = await import('../local/index.js');

    // W.6 — Data source panel
    expect(local.getRefreshBadge).toBeTypeOf('function');
    expect(local.getSourceDisplayProps).toBeTypeOf('function');
    expect(local.SOURCE_TYPE_ICONS).toBeTypeOf('object');
    expect(local.DATA_SOURCE_PICKER_OPTIONS).toBeInstanceOf(Array);
  });

  it('exports local data store', async () => {
    const local = await import('../local/index.js');

    // W.1 — Local data store (session management)
    expect(local.createSessionMeta).toBeTypeOf('function');
    expect(local.registerTable).toBeTypeOf('function');
    expect(local.createSessionList).toBeTypeOf('function');
    expect(local.addSession).toBeTypeOf('function');
    expect(local.removeSession).toBeTypeOf('function');
    expect(local.getResumePrompt).toBeTypeOf('function');
    expect(local.createExportManifest).toBeTypeOf('function');
    expect(local.validateImportManifest).toBeTypeOf('function');
  });

  it('exports file upload manager', async () => {
    const local = await import('../local/index.js');

    // W.2 — File upload manager
    expect(local.detectFileFormat).toBeTypeOf('function');
    expect(local.createUploadOptions).toBeTypeOf('function');
    expect(local.validateFileName).toBeTypeOf('function');
    expect(local.getAcceptAttribute).toBeTypeOf('function');
    expect(local.SUPPORTED_FORMATS).toBeInstanceOf(Array);
  });
});

// ========================================================================
// Cross-check: workspace root re-exports
// ========================================================================

describe('Workspace root re-exports all sub-modules', () => {
  it('re-exports Sprint S styles from workspace root', async () => {
    const ws = await import('../index.js');
    expect(ws.DESIGN_TOKENS).toBeTypeOf('object');
    expect(ws.getBreakpointClasses).toBeTypeOf('function');
    expect(ws.getFormDensityClasses).toBeTypeOf('function');
    expect(ws.STATUS_BADGE_VARIANTS).toBeTypeOf('object');
    expect(ws.EXPLORER_LAYOUT).toBeTypeOf('object');
    expect(ws.getFieldTypeIcon).toBeTypeOf('function');
  });

  it('re-exports Sprint T types from workspace root', async () => {
    const ws = await import('../index.js');
    expect(ws.isDashboardDataConfig).toBeTypeOf('function');
    expect(ws.validateDashboardDataConfig).toBeTypeOf('function');
    expect(ws.hasArrowBuffer).toBeTypeOf('function');
    expect(ws.createDashboardDataPipeline).toBeTypeOf('function');
    expect(ws.createDetailSourceLoader).toBeTypeOf('function');
    expect(ws.createLoadingIndicatorState).toBeTypeOf('function');
  });

  it('re-exports Sprint U types from workspace root', async () => {
    const ws = await import('../index.js');
    expect(ws.createFilterDefinition).toBeTypeOf('function');
    expect(ws.evaluateFilterRules).toBeTypeOf('function');
    expect(ws.resolveFilterContract).toBeTypeOf('function');
    expect(ws.resolveFiltersFromContract).toBeTypeOf('function');
  });

  it('re-exports Sprint V types from workspace root', async () => {
    const ws = await import('../index.js');
    expect(ws.createNavigationLink).toBeTypeOf('function');
    expect(ws.isVisibleToViewer).toBeTypeOf('function');
    expect(ws.createDefaultPresentation).toBeTypeOf('function');
    expect(ws.createGridArtifact).toBeTypeOf('function');
  });

  it('re-exports Sprint W types from workspace root', async () => {
    const ws = await import('../index.js');
    expect(ws.createExportBundle).toBeTypeOf('function');
    expect(ws.createSheetPicker).toBeTypeOf('function');
    expect(ws.SAMPLE_DATASETS).toBeInstanceOf(Array);
    expect(ws.createSessionMeta).toBeTypeOf('function');
    expect(ws.detectFileFormat).toBeTypeOf('function');
  });
});
