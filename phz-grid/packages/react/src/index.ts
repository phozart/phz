/**
 * @phozart/react — React Wrapper for phz-grid
 */

// Grid Components
export { PhzGrid } from './phz-grid.js';
export type { PhzGridProps } from './phz-grid.js';
export { PhzGridAdmin } from './phz-grid-admin.js';
export type { PhzGridAdminProps, GridAdminApi } from './phz-grid-admin.js';

// Filter / Criteria Components
export { PhzSelectionCriteria } from './phz-selection-criteria.js';
export type { PhzSelectionCriteriaProps, CriteriaApi } from './phz-selection-criteria.js';
export { PhzFilterDesigner } from './phz-filter-designer.js';
export type { PhzFilterDesignerProps, FilterDesignerApi } from './phz-filter-designer.js';
export { PhzPresetAdmin } from './phz-preset-admin.js';
export type { PhzPresetAdminProps } from './phz-preset-admin.js';
export { PhzFilterConfigurator } from './phz-filter-configurator.js';
export type { PhzFilterConfiguratorProps } from './phz-filter-configurator.js';

// Grid Hooks
export { useGridState } from './hooks/use-grid-state.js';
export { useGridSelection } from './hooks/use-grid-selection.js';
export { useGridSort } from './hooks/use-grid-sort.js';
export { useGridFilter } from './hooks/use-grid-filter.js';
export { useGridEdit } from './hooks/use-grid-edit.js';
export { useGridData } from './hooks/use-grid-data.js';
export { useGridAdmin } from './hooks/use-grid-admin.js';

// Orchestration
export { useGridOrchestrator } from './hooks/use-grid-orchestrator.js';
export type { OrchestratorConfig, OrchestratorResult } from './hooks/use-grid-orchestrator.js';

// Filter / Criteria Hooks
export { useCriteria } from './hooks/use-criteria.js';
export { useFilterDesigner } from './hooks/use-filter-designer.js';

// Utilities
export { settingsToGridProps } from './utils/settings-to-grid-props.js';
