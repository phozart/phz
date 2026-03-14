/**
 * @phozart/workspace — Authoring Module
 *
 * UX-first authoring flows for reports and dashboards.
 * All state management is pure functions; Lit components are thin view layers.
 */

// Phase 1 — State machines
export * from './authoring-state.js';
export * from './catalog-state.js';
export * from './creation-flow.js';
export * from './publish-workflow.js';

// Phase 2 — Report authoring
export * from './report-editor-state.js';
export * from './report-context-menu.js';
export * from './report-undo.js';
export * from './auto-save.js';

// Phase 3 — Dashboard authoring
export * from './dashboard-editor-state.js';
export * from './dashboard-context-menu.js';
export * from './drag-drop-state.js';
export * from './dashboard-undo.js';

// Phase 4 — Config & filters
export * from './widget-config-state.js';
export * from './filter-authoring.js';
export * from './template-selection.js';

// Phase 5 — Lit components (side-effect registrations)
import './phz-artifact-catalog.js';
import './phz-creation-wizard.js';
import './phz-report-editor.js';
import './phz-dashboard-editor.js';
import './phz-config-panel.js';
import './phz-context-menu.js';

export { PhzArtifactCatalog } from './phz-artifact-catalog.js';
export { PhzCreationWizard } from './phz-creation-wizard.js';
export { PhzReportEditor } from './phz-report-editor.js';
export { PhzDashboardEditor } from './phz-dashboard-editor.js';
export { PhzConfigPanel } from './phz-config-panel.js';
export { PhzContextMenu } from './phz-context-menu.js';

// Phase 6 — Cross-cutting
export * from './keyboard-shortcuts.js';
export * from './widget-library.js';

// B-3 enhancements
export * from './creation-wizard-state.js';
export * from './wide-report-state.js';
export * from './freeform-grid-state.js';
export * from './data-config-panel-state.js';
export * from './publish-workflow-state.js';

// 7A-A — Alert binding for single-value widgets
export * from './alert-binding-state.js';

// 7A-B — Micro-widget cell display configuration
export * from './cell-display-state.js';

// 7A-C — Decision tree variant picker
export * from './variant-picker-state.js';

// Phase 1C — Cross-cutting P0
export * from './editor-criteria-state.js';
export * from './report-drill-config-state.js';
export * from './report-formatting-state.js';
export * from './visibility-dialog-state.js';

// Phase 2A — Report chart toggle + encoding
export * from './report-chart-state.js';

// Phase 2B — Widget palette gallery
export * from './widget-palette-state.js';

// WE-6 — Hierarchy editor state
export * from './hierarchy-editor-state.js';

// WE-7 — Cross-filter rule editor
export * from './cross-filter-rule-state.js';

// Source relationship editor (multi-data-source join semantics)
export * from './source-relationship-state.js';

// WE-10 — Chart overlay config panel state
export * from './chart-overlay-state.js';

// WE-11 — Chart tooltip editor state
export * from './chart-tooltip-state.js';

// WE-12 — Conditional widget visibility
export * from './widget-visibility-state.js';

// Data source browsing — interactive field browser
export * from './data-source-state.js';
export * from './data-source-panel-orchestrator.js';
import './phz-data-source-panel.js';
export { PhzDataSourcePanel } from './phz-data-source-panel.js';

// Multi-page dashboards
export * from './dashboard-page-state.js';
export * from './sql-editor-state.js';
import './phz-page-nav.js';
import './phz-sql-editor.js';
export { PhzPageNav } from './phz-page-nav.js';
export { PhzSqlEditor } from './phz-sql-editor.js';

// Canvas Phase 3A — Data shelf (drop zone bridge)
export * from './data-shelf-state.js';

// Canvas Phase 2A — Enhanced config panel state
export * from './enhanced-config-state.js';

// Canvas Phase 1D — Canvas interaction state
export * from './canvas-interaction-state.js';

// Canvas Phase 1E — Canvas pointer controller
export * from './canvas-pointer.controller.js';

// Canvas Phase 2C — Micro-components
import './phz-color-picker.js';
import './phz-shadow-picker.js';
import './phz-slider-input.js';
export { PhzColorPicker } from './phz-color-picker.js';
export { PhzShadowPicker } from './phz-shadow-picker.js';
export { PhzSliderInput } from './phz-slider-input.js';

// Canvas toolbar state (Phase 4A)
export * from './canvas-toolbar-state.js';

// Responsive fallback (Phase 4C)
export * from './responsive-fallback.js';

// UX-016 — Field-drop inference state machine
export * from './field-drop-inference-state.js';

// UX-017 — Live preview toggle state machine
export * from './live-preview-state.js';

// UX-019 — Report designer shortcut mode
export * from './shortcut-mode-state.js';
