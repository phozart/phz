/**
 * @phozart/phz-grid — Web Components Rendering Layer
 *
 * Lit-based custom elements for rendering the phozart data grid.
 */

// Custom Elements
export { PhzGrid } from './components/phz-grid.js';
export { PhzColumn } from './components/phz-column.js';
export { PhzContextMenu } from './components/phz-context-menu.js';
export { PhzFilterPopover } from './components/phz-filter-popover.js';
export { PhzColumnChooser } from './components/phz-column-chooser.js';
export { PhzChartPopover } from './components/phz-chart-popover.js';
export { PhzToolbar } from './components/phz-toolbar.js';
export { PhzReportView } from './components/phz-report-view.js';

// Shared types
export type { Density, FilterInfo, RowAction, ScrollMode } from './types.js';

// Virtual Scroll
export { VirtualScroller } from './virtual-scroller.js';
export type { VirtualScrollerOptions } from './virtual-scroller.js';
export { RemoteDataManager } from './remote-data-manager.js';
export type { RemoteDataManagerOptions } from './remote-data-manager.js';

// Toolbar event types
export type { ToolbarSearchEvent, ToolbarExportEvent } from './components/phz-toolbar.js';

// Component types
export type { MenuItem, ContextMenuOpenEvent } from './components/phz-context-menu.js';
export type { FilterValueEntry, FilterApplyEvent } from './components/phz-filter-popover.js';
export type { ColumnProfile, ColumnChooserChangeEvent, ComputedColumnDef } from './components/phz-column-chooser.js';

// Base classes for custom renderers/editors
export { PhzCellRenderer } from './renderers/base-renderer.js';
export { PhzCellEditor } from './editors/base-editor.js';

// Built-in cell renderers
export {
  TextCellRenderer,
  NumberCellRenderer,
  DateCellRenderer,
  BooleanCellRenderer,
  LinkCellRenderer,
  ImageCellRenderer,
  ProgressCellRenderer,
} from './renderers/built-in.js';

// Sparkline renderer
export { renderSparkline } from './renderers/sparkline-renderer.js';
export type { SparklineOptions, SparklineType } from './renderers/sparkline-renderer.js';

// Built-in cell editors
export {
  TextCellEditor,
  NumberCellEditor,
  SelectCellEditor,
  DateCellEditor,
  CheckboxCellEditor,
} from './editors/built-in.js';

// CSS Token Constants (Phz Console Three-Layer System)
export { BrandTokens, SemanticTokens, ComponentTokens, generateTokenStyles } from './tokens.js';

// Theme Presets
export {
  lightTheme,
  darkTheme,
  midnightTheme,
  sandTheme,
  highContrastTheme,
  themes,
  applyGridTheme,
  detectColorScheme,
  resolveGridTheme,
} from './themes.js';
export type { GridTheme, GridThemeTokens } from './themes.js';

// Accessibility utilities
export { AriaManager } from './a11y/aria-manager.js';
export { KeyboardNavigator } from './a11y/keyboard-navigator.js';
export { ForcedColorsAdapter, forcedColorsCSS } from './a11y/forced-colors-adapter.js';

// Export utilities
export { exportToCSV, downloadCSV } from './export/csv-exporter.js';
export type { CsvExportOptions, ExportGroupRow } from './export/csv-exporter.js';
export { exportToExcel, downloadExcel, matchesThreshold } from './export/excel-exporter.js';
export type { ExcelExportOptions, CellFormatting } from './export/excel-exporter.js';

// Feature engines
export {
  createConditionalFormattingEngine,
  createThresholdRule,
  createHighlightAboveTarget,
  createHighlightBelowTarget,
} from './features/conditional-formatting.js';
export type {
  ConditionalFormattingEngine,
  ComputedCellStyle,
} from './features/conditional-formatting.js';

export { detectAnomalies, detectAllAnomalies } from './features/anomaly-detector.js';
export type { AnomalyResult, AnomalyDetectionOptions } from './features/anomaly-detector.js';

// Date formatting
export { formatDate, DEFAULT_DATE_FORMAT, DEFAULT_DATETIME_FORMAT, DATE_FORMAT_PRESETS } from './formatters/date-formatter.js';

// Clipboard / Copy
export { buildCopyText, formatCellForCopy, copyToClipboard } from './clipboard/copy-engine.js';
export type { CopyOptions, CopyResult } from './clipboard/copy-engine.js';

// DOM Event Map
export type { PhzGridEventMap, RowClickEventDetail, RowActionEventDetail, GenerateDashboardEventDetail } from './events.js';
export { dispatchGridEvent } from './events.js';

// Micro-Widget Cell Resolver (7A-B)
export { resolveCellRenderer, getMicroWidgetFallbackText } from './formatters/micro-widget-cell.js';
