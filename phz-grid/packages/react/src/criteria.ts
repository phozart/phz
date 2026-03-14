/**
 * @phozart/react/criteria — Criteria/Filter exports
 *
 * Requires @phozart/criteria peer dependency.
 * import { PhzSelectionCriteria, useCriteria } from '@phozart/react/criteria';
 */

// Criteria Components
export { PhzSelectionCriteria } from './phz-selection-criteria.js';
export type { PhzSelectionCriteriaProps, CriteriaApi } from './phz-selection-criteria.js';
export { PhzFilterDesigner } from './phz-filter-designer.js';
export type { PhzFilterDesignerProps, FilterDesignerApi } from './phz-filter-designer.js';
export { PhzPresetAdmin } from './phz-preset-admin.js';
export type { PhzPresetAdminProps } from './phz-preset-admin.js';
export { PhzFilterConfigurator } from './phz-filter-configurator.js';
export type { PhzFilterConfiguratorProps } from './phz-filter-configurator.js';

// Criteria Hooks
export { useCriteria } from './hooks/use-criteria.js';
export { useFilterDesigner } from './hooks/use-filter-designer.js';
