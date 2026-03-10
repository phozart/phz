/**
 * @phozart/phz-workspace/grid-admin — Embeddable Admin Components for Grid Configuration
 *
 * All components are Lit Web Components that can be dropped into any page.
 */

export { PhzAdminTableSettings } from './phz-admin-table-settings.js';
export { PhzAdminColumns } from './phz-admin-columns.js';
export { PhzAdminFormatting } from './phz-admin-formatting.js';
export { PhzAdminFilters } from './phz-admin-filters.js';
export { PhzAdminTheme } from './phz-admin-theme.js';
export { PhzAdminExport } from './phz-admin-export.js';
/** @deprecated Use PhzAdminTableSettings instead. Will be removed in a future version. */
export { PhzAdminOptions } from './phz-admin-options.js';
export { PhzAdminReport } from './phz-admin-report.js';
export { PhzAdminDataSource } from './phz-admin-data-source.js';
export { PhzAdminCriteria } from './phz-admin-criteria.js';
export { PhzGridAdmin } from './phz-grid-admin.js';

export type { DataProductListItem, DataProductFieldInfo } from './phz-admin-data-source.js';
export type { CriteriaDefinitionItem, CriteriaBindingItem } from './phz-admin-criteria.js';

// Re-export presentation types from engine for convenience
export type {
  ReportPresentation, TableSettings, ColumnFormatting, ColumnColorThreshold,
  NumberFormat, ReportExportSettings,
} from '@phozart/phz-engine';
export { DEFAULT_TABLE_SETTINGS, DEFAULT_REPORT_PRESENTATION } from '@phozart/phz-engine';
