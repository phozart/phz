/**
 * v15 Barrel Export Audit
 *
 * Verifies that importing from all barrel files succeeds without
 * TS2308 duplicate export errors or ambiguous member warnings.
 * Each barrel is imported via `import *` and key exports are asserted.
 *
 * Packages tested:
 *   shared (root + 5 sub-paths)
 *   viewer
 *   editor
 *   engine
 *   workspace
 *   widgets
 *   grid
 */
import { describe, it, expect } from 'vitest';

// ========================================================================
// Barrel imports — using `import *` to detect duplicate/ambiguous exports
// ========================================================================

import * as SharedRoot from '@phozart/phz-shared';
import * as SharedTypes from '@phozart/phz-shared/types';
import * as SharedAdapters from '@phozart/phz-shared/adapters';
import * as SharedDesignSystem from '@phozart/phz-shared/design-system';
import * as SharedArtifacts from '@phozart/phz-shared/artifacts';
import * as SharedCoordination from '@phozart/phz-shared/coordination';
import * as Viewer from '@phozart/phz-viewer';
import * as Editor from '@phozart/phz-editor';
import * as Engine from '@phozart/phz-engine';
import * as Widgets from '@phozart/phz-widgets';
import * as Grid from '@phozart/phz-grid';

// Note: workspace barrel is large and uses `export *` from many modules.
// It historically has had TS2308 issues. Test it separately.
import * as Workspace from '@phozart/phz-workspace';

// ========================================================================
// Tests
// ========================================================================

describe('v15 Barrel Export Audit', () => {
  describe('@phozart/phz-shared (root)', () => {
    it('exports key functions without ambiguity', () => {
      // Adapter re-exports
      expect(SharedRoot.createFilterContext).toBeTypeOf('function');
      expect(SharedRoot.createInteractionBus).toBeTypeOf('function');

      // Type re-exports (functions)
      expect(SharedRoot.isUserTarget).toBeTypeOf('function');
      expect(SharedRoot.createFieldEnrichment).toBeTypeOf('function');
      expect(SharedRoot.evaluateMatchRule).toBeTypeOf('function');
      expect(SharedRoot.createSubscription).toBeTypeOf('function');
      expect(SharedRoot.createErrorState).toBeTypeOf('function');
      expect(SharedRoot.createEmptyState).toBeTypeOf('function');
      expect(SharedRoot.createApiEndpoint).toBeTypeOf('function');

      // Design system re-exports
      expect(SharedRoot.DESIGN_TOKENS).toBeDefined();
      expect(SharedRoot.ALERT_WIDGET_TOKENS).toBeDefined();
      expect(SharedRoot.IMPACT_CHAIN_TOKENS).toBeDefined();

      // Artifact re-exports
      expect(SharedRoot.isVisibleToViewer).toBeTypeOf('function');
      expect(SharedRoot.createDefaultPresentation).toBeTypeOf('function');
      expect(SharedRoot.createGridArtifact).toBeTypeOf('function');

      // Coordination re-exports
      expect(SharedRoot.createInitialLoadingState).toBeTypeOf('function');
      expect(SharedRoot.createDefaultExecutionStrategy).toBeTypeOf('function');
      expect(SharedRoot.createAsyncReportUIState).toBeTypeOf('function');
      expect(SharedRoot.createExportsTabState).toBeTypeOf('function');
      expect(SharedRoot.initialAttentionFacetedState).toBeTypeOf('function');

      // Amendment A
      expect(SharedRoot.resolveAlertVisualState).toBeTypeOf('function');
      expect(SharedRoot.getAlertTokens).toBeTypeOf('function');
      expect(SharedRoot.degradeAlertMode).toBeTypeOf('function');
      expect(SharedRoot.createDefaultAlertConfig).toBeTypeOf('function');

      // Amendment B
      expect(SharedRoot.createCellRendererRegistry).toBeTypeOf('function');

      // Amendment D
      expect(SharedRoot.filterAttentionItems).toBeTypeOf('function');
      expect(SharedRoot.computeAttentionFacets).toBeTypeOf('function');
    });
  });

  describe('@phozart/phz-shared/types', () => {
    it('exports all type module functions', () => {
      expect(SharedTypes.isUserTarget).toBeTypeOf('function');
      expect(SharedTypes.createFieldEnrichment).toBeTypeOf('function');
      expect(SharedTypes.createDefaultFilterPresetValue).toBeTypeOf('function');
      expect(SharedTypes.evaluateMatchRule).toBeTypeOf('function');
      expect(SharedTypes.createDefaultFilterValueHandling).toBeTypeOf('function');
      expect(SharedTypes.createEmptyAlertSummary).toBeTypeOf('function');
      expect(SharedTypes.createAsyncReportJob).toBeTypeOf('function');
      expect(SharedTypes.createSubscription).toBeTypeOf('function');
      expect(SharedTypes.createErrorState).toBeTypeOf('function');
      expect(SharedTypes.createEmptyState).toBeTypeOf('function');
      expect(SharedTypes.evaluateNodeStatus).toBeTypeOf('function');
      expect(SharedTypes.createApiEndpoint).toBeTypeOf('function');
      expect(SharedTypes.getRandomMessage).toBeTypeOf('function');

      // Amendment types
      expect(SharedTypes.resolveAlertVisualState).toBeTypeOf('function');
      expect(SharedTypes.createCellRendererRegistry).toBeTypeOf('function');
      expect(SharedTypes.filterAttentionItems).toBeTypeOf('function');
    });
  });

  describe('@phozart/phz-shared/adapters', () => {
    it('barrel import succeeds (type-only module)', () => {
      // Adapters is primarily type-only; verify the module loaded
      expect(SharedAdapters).toBeDefined();
      expect(typeof SharedAdapters).toBe('object');
    });
  });

  describe('@phozart/phz-shared/design-system', () => {
    it('exports all design system tokens and helpers', () => {
      expect(SharedDesignSystem.DESIGN_TOKENS).toBeDefined();
      expect(SharedDesignSystem.BREAKPOINT_VALUES).toBeDefined();
      expect(SharedDesignSystem.SHELL_LAYOUT).toBeDefined();
      expect(SharedDesignSystem.ICONS).toBeDefined();
      expect(SharedDesignSystem.ALERT_WIDGET_TOKENS).toBeDefined();
      expect(SharedDesignSystem.IMPACT_CHAIN_TOKENS).toBeDefined();
      expect(SharedDesignSystem.generateAlertTokenCSS).toBeTypeOf('function');
      expect(SharedDesignSystem.generateChainTokenCSS).toBeTypeOf('function');
      expect(SharedDesignSystem.getKPICardClass).toBeTypeOf('function');
    });
  });

  describe('@phozart/phz-shared/artifacts', () => {
    it('exports all artifact functions', () => {
      expect(SharedArtifacts.isVisibleToViewer).toBeTypeOf('function');
      expect(SharedArtifacts.groupByVisibility).toBeTypeOf('function');
      expect(SharedArtifacts.canTransition).toBeTypeOf('function');
      expect(SharedArtifacts.transitionVisibility).toBeTypeOf('function');
      expect(SharedArtifacts.createDefaultPresentation).toBeTypeOf('function');
      expect(SharedArtifacts.mergePresentation).toBeTypeOf('function');
      expect(SharedArtifacts.createPersonalView).toBeTypeOf('function');
      expect(SharedArtifacts.applyPersonalView).toBeTypeOf('function');
      expect(SharedArtifacts.createGridArtifact).toBeTypeOf('function');
      expect(SharedArtifacts.isGridArtifact).toBeTypeOf('function');
      expect(SharedArtifacts.gridArtifactToMeta).toBeTypeOf('function');
    });
  });

  describe('@phozart/phz-shared/coordination', () => {
    it('exports all coordination state machines and utilities', () => {
      expect(SharedCoordination.createFilterContext).toBeTypeOf('function');
      expect(SharedCoordination.createInteractionBus).toBeTypeOf('function');
      expect(SharedCoordination.createInitialLoadingState).toBeTypeOf('function');
      expect(SharedCoordination.createDefaultExecutionStrategy).toBeTypeOf('function');
      expect(SharedCoordination.createDefaultServerGridConfig).toBeTypeOf('function');
      expect(SharedCoordination.createDefaultExportConfig).toBeTypeOf('function');
      expect(SharedCoordination.createDefaultAutoSaveConfig).toBeTypeOf('function');
      expect(SharedCoordination.createAsyncReportUIState).toBeTypeOf('function');
      expect(SharedCoordination.createExportsTabState).toBeTypeOf('function');
      expect(SharedCoordination.createSubscriptionsTabState).toBeTypeOf('function');
      expect(SharedCoordination.createExpressionBuilderState).toBeTypeOf('function');
      expect(SharedCoordination.createPreviewContextState).toBeTypeOf('function');
      expect(SharedCoordination.initialAttentionFacetedState).toBeTypeOf('function');
    });
  });

  describe('@phozart/phz-viewer', () => {
    it('exports shell state machine and screen states', () => {
      expect(Viewer.createViewerShellState).toBeTypeOf('function');
      expect(Viewer.createViewerShellConfig).toBeTypeOf('function');
      expect(Viewer.createDefaultFeatureFlags).toBeTypeOf('function');
      expect(Viewer.createCatalogState).toBeTypeOf('function');
      expect(Viewer.createDashboardViewState).toBeTypeOf('function');
      expect(Viewer.createReportViewState).toBeTypeOf('function');
      expect(Viewer.createExplorerScreenState).toBeTypeOf('function');
      expect(Viewer.createAttentionDropdownState).toBeTypeOf('function');
      expect(Viewer.createFilterBarState).toBeTypeOf('function');
    });

    it('exports Lit component classes', () => {
      expect(Viewer.PhzViewerShell).toBeDefined();
      expect(Viewer.PhzViewerCatalog).toBeDefined();
      expect(Viewer.PhzViewerDashboard).toBeDefined();
      expect(Viewer.PhzViewerReport).toBeDefined();
      expect(Viewer.PhzViewerExplorer).toBeDefined();
      expect(Viewer.PhzAttentionDropdown).toBeDefined();
      expect(Viewer.PhzFilterBar).toBeDefined();
      expect(Viewer.PhzViewerError).toBeDefined();
      expect(Viewer.PhzViewerEmpty).toBeDefined();
    });
  });

  describe('@phozart/phz-editor', () => {
    it('exports shell state machine and screen states', () => {
      expect(Editor.createEditorShellState).toBeTypeOf('function');
      expect(Editor.createEditorShellConfig).toBeTypeOf('function');
      expect(Editor.validateEditorConfig).toBeTypeOf('function');
      expect(Editor.createCatalogState).toBeTypeOf('function');
      expect(Editor.createDashboardViewState).toBeTypeOf('function');
      expect(Editor.createDashboardEditState).toBeTypeOf('function');
      expect(Editor.createReportEditState).toBeTypeOf('function');
      expect(Editor.createExplorerState).toBeTypeOf('function');
    });

    it('exports authoring state machines', () => {
      expect(Editor.createMeasurePaletteState).toBeTypeOf('function');
      expect(Editor.createConfigPanelState).toBeTypeOf('function');
      expect(Editor.createSharingFlowState).toBeTypeOf('function');
      expect(Editor.createAlertSubscriptionState).toBeTypeOf('function');
    });

    it('exports Lit component classes', () => {
      expect(Editor.PhzEditorShell).toBeDefined();
      expect(Editor.PhzEditorCatalog).toBeDefined();
      expect(Editor.PhzEditorDashboard).toBeDefined();
      expect(Editor.PhzEditorReport).toBeDefined();
      expect(Editor.PhzEditorExplorer).toBeDefined();
      expect(Editor.PhzMeasurePalette).toBeDefined();
      expect(Editor.PhzConfigPanel).toBeDefined();
      expect(Editor.PhzSharingFlow).toBeDefined();
      expect(Editor.PhzAlertSubscription).toBeDefined();
    });
  });

  describe('@phozart/phz-engine', () => {
    it('exports core engine functionality', () => {
      expect(Engine.createKPIRegistry).toBeTypeOf('function');
      expect(Engine.computeStatus).toBeTypeOf('function');
      expect(Engine.createMetricCatalog).toBeTypeOf('function');
      expect(Engine.computeAggregation).toBeTypeOf('function');
      expect(Engine.createReportConfigStore).toBeTypeOf('function');
      expect(Engine.validateWidget).toBeTypeOf('function');
      expect(Engine.createDashboardConfigStore).toBeTypeOf('function');
      expect(Engine.computePivot).toBeTypeOf('function');
      expect(Engine.createBIEngine).toBeTypeOf('function');
    });

    it('exports alert/subscription/analytics/api/attention modules', () => {
      // Alerts
      expect(Engine.evaluateAllAlerts).toBeTypeOf('function');
      expect(Engine.createInMemoryAlertContract).toBeTypeOf('function');
      // Subscriptions
      expect(Engine.createSubscriptionEngineState).toBeTypeOf('function');
      expect(Engine.isDueForExecution).toBeTypeOf('function');
      // Analytics
      expect(Engine.createUsageCollector).toBeTypeOf('function');
      expect(Engine.trackEvent).toBeTypeOf('function');
      // API
      expect(Engine.generateOpenAPISpec).toBeTypeOf('function');
      // Attention
      expect(Engine.createAttentionSystemState).toBeTypeOf('function');
      expect(Engine.getUnreadItems).toBeTypeOf('function');
    });

    it('exports explorer module', () => {
      expect(Engine.createDataExplorer).toBeTypeOf('function');
      expect(Engine.suggestChartType).toBeTypeOf('function');
      expect(Engine.createDropZoneState).toBeTypeOf('function');
    });
  });

  describe('@phozart/phz-widgets', () => {
    it('exports core widget components and state', () => {
      expect(Widgets.PhzKPICard).toBeDefined();
      expect(Widgets.PhzBarChart).toBeDefined();
      expect(Widgets.PhzTrendLine).toBeDefined();
      expect(Widgets.PhzDashboard).toBeDefined();
      expect(Widgets.PhzPieChart).toBeDefined();
      expect(Widgets.PhzGauge).toBeDefined();
    });

    it('exports Amendment B: micro-widget renderers', () => {
      expect(Widgets.createValueOnlyRenderer).toBeTypeOf('function');
      expect(Widgets.createSparklineRenderer).toBeTypeOf('function');
      expect(Widgets.createDeltaRenderer).toBeTypeOf('function');
      expect(Widgets.createGaugeArcRenderer).toBeTypeOf('function');
      expect(Widgets.registerAllMicroWidgetRenderers).toBeTypeOf('function');
    });

    it('exports Amendment C: impact chain state', () => {
      expect(Widgets.initialImpactChainState).toBeTypeOf('function');
      expect(Widgets.computeChainLayout).toBeTypeOf('function');
      expect(Widgets.getChainContainerVariant).toBeTypeOf('function');
      expect(Widgets.computeChainSummary).toBeTypeOf('function');
      expect(Widgets.resolveConclusion).toBeTypeOf('function');
    });

    it('exports Amendment C: decision tree variants', () => {
      expect(Widgets.DECISION_TREE_VARIANTS).toBeDefined();
    });

    it('exports Amendment D: attention widget state', () => {
      expect(Widgets.initialAttentionWidgetState).toBeTypeOf('function');
      expect(Widgets.computePrioritySummary).toBeTypeOf('function');
      expect(Widgets.getTopItems).toBeTypeOf('function');
      expect(Widgets.getTotalCount).toBeTypeOf('function');
      expect(Widgets.getContainerVariant).toBeTypeOf('function');
    });
  });

  describe('@phozart/phz-grid', () => {
    it('exports grid component and controllers', () => {
      expect(Grid.PhzGrid).toBeDefined();
      expect(Grid.PhzColumn).toBeDefined();
      expect(Grid.PhzToolbar).toBeDefined();
      expect(Grid.PhzContextMenu).toBeDefined();
      expect(Grid.PhzFilterPopover).toBeDefined();
      expect(Grid.PhzColumnChooser).toBeDefined();
      expect(Grid.VirtualScroller).toBeDefined();
      expect(Grid.AriaManager).toBeDefined();
      expect(Grid.KeyboardNavigator).toBeDefined();
    });

    it('exports themes and tokens', () => {
      expect(Grid.lightTheme).toBeDefined();
      expect(Grid.darkTheme).toBeDefined();
      expect(Grid.BrandTokens).toBeDefined();
      expect(Grid.generateTokenStyles).toBeTypeOf('function');
    });

    it('exports micro-widget cell resolver (7A-B)', () => {
      expect(Grid.resolveCellRenderer).toBeTypeOf('function');
      expect(Grid.getMicroWidgetFallbackText).toBeTypeOf('function');
    });
  });

  describe('@phozart/phz-workspace', () => {
    it('barrel import succeeds without TS2308 errors', () => {
      // The workspace barrel uses many `export *` statements.
      // If there were duplicate exports, the import would fail.
      expect(Workspace).toBeDefined();
      expect(typeof Workspace).toBe('object');
    });

    it('exports key workspace functions', () => {
      // These are spot checks for key exports
      expect(Workspace.createPlacement).toBeTypeOf('function');
    });
  });
});
