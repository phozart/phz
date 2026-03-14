/**
 * @phozart/grid — Unified CDN Entry Point
 *
 * All-in-one bundle: grid + engine + widgets + grid-admin + engine-admin.
 * For use in plain HTML demos and prototypes.
 *
 * Usage:
 *   <script type="module" src="phz-all.js"></script>
 */

// Grid components (registers custom elements)
import './components/phz-grid.js';
import './components/phz-column.js';
import './components/phz-context-menu.js';
import './components/phz-filter-popover.js';
import './components/phz-column-chooser.js';
import './components/phz-chart-popover.js';
import './components/phz-toolbar.js';
import './components/phz-report-view.js';

// Widget components — import each directly for side-effect registration
import '@phozart/widgets/components/phz-kpi-card.js';
import '@phozart/widgets/components/phz-kpi-scorecard.js';
import '@phozart/widgets/components/phz-bar-chart.js';
import '@phozart/widgets/components/phz-trend-line.js';
import '@phozart/widgets/components/phz-bottom-n.js';
import '@phozart/widgets/components/phz-status-table.js';
import '@phozart/widgets/components/phz-drill-link.js';
import '@phozart/widgets/components/phz-dashboard.js';
import '@phozart/widgets/components/phz-view-manager.js';
import '@phozart/widgets/components/phz-selection-bar.js';
import '@phozart/widgets/components/phz-widget.js';

// Grid Admin — barrel import registers all custom elements via @customElement decorators
import '@phozart/workspace/grid-admin';

// Engine Admin — barrel import registers all custom elements via @customElement decorators
import '@phozart/workspace/engine-admin';

// Criteria components — import each directly for side-effect registration
import '@phozart/criteria/components/phz-criteria-panel.js';
import '@phozart/criteria/components/phz-criteria-field.js';
import '@phozart/criteria/components/phz-criteria-summary.js';
import '@phozart/criteria/components/phz-preset-manager.js';
import '@phozart/criteria/components/phz-criteria-admin.js';
import '@phozart/criteria/components/fields/phz-date-range-picker.js';
import '@phozart/criteria/components/fields/phz-numeric-range-input.js';
import '@phozart/criteria/components/fields/phz-tree-select.js';
import '@phozart/criteria/components/fields/phz-searchable-dropdown.js';
import '@phozart/criteria/components/fields/phz-field-presence-filter.js';
import '@phozart/criteria/components/fields/phz-chip-select.js';
import '@phozart/criteria/components/fields/phz-match-filter-pill.js';
import '@phozart/criteria/components/phz-selection-criteria.js';
import '@phozart/criteria/components/phz-criteria-bar.js';
import '@phozart/criteria/components/phz-filter-drawer.js';
import '@phozart/criteria/components/phz-filter-section.js';
import '@phozart/criteria/components/phz-expanded-modal.js';
import '@phozart/criteria/components/phz-preset-sidebar.js';

// Criteria Engine admin components (registry mode)
// NOTE: phz-filter-definition-admin removed from CDN — use phz-filter-designer instead
import '@phozart/criteria/components/phz-rule-admin.js';
import '@phozart/criteria/components/phz-preset-admin.js';

// Designer + Configurator (new admin components)
import '@phozart/criteria/components/phz-filter-designer.js';
import '@phozart/criteria/components/phz-filter-configurator.js';
import '@phozart/criteria/components/phz-rule-editor-modal.js';
import '@phozart/criteria/components/fields/phz-combobox.js';

// Re-export grid entry (grid's AnomalyResult / detectAnomalies take precedence)
export * from './index.js';

// Re-export engine values that don't conflict with grid's own exports.
// grid and engine both export AnomalyResult and detectAnomalies — grid wins.
export {
  createCriteriaEngine, migrateFromCriteriaConfig,
  createReportService, createDashboardService,
  createJSComputeBackend, JSComputeBackend,
  compileRowExpression, compileMetricExpression,
  MemoryStorageAdapter, LocalStorageAdapter,
  createFilterAdapter, applyArtefactCriteria, globalFiltersToCriteriaBindings,
  EngineMetrics, MetricsController,
  detectTrendChange,
  createKPIAlertEngine,
  runningSum, runningAvg, movingAverage, movingSum,
  rank, percentRank, lag, lead, rowNumber,
  ResolutionCache, DirtyTracker, EmbedManager,
  createBIEngine,
} from '@phozart/engine';
