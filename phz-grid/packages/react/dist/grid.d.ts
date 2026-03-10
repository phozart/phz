/**
 * @phozart/phz-react/grid — Grid-only exports (no criteria/admin dependencies)
 *
 * SSR-safe entry point for consumers that only use the grid.
 * import { PhzGrid, useGridState } from '@phozart/phz-react/grid';
 */
export { PhzGrid } from './phz-grid.js';
export type { PhzGridProps } from './phz-grid.js';
export { useGridState } from './hooks/use-grid-state.js';
export { useGridSelection } from './hooks/use-grid-selection.js';
export { useGridSort } from './hooks/use-grid-sort.js';
export { useGridFilter } from './hooks/use-grid-filter.js';
export { useGridEdit } from './hooks/use-grid-edit.js';
export { useGridData } from './hooks/use-grid-data.js';
export { useGridOrchestrator } from './hooks/use-grid-orchestrator.js';
export type { OrchestratorConfig, OrchestratorResult } from './hooks/use-grid-orchestrator.js';
export { settingsToGridProps } from './utils/settings-to-grid-props.js';
//# sourceMappingURL=grid.d.ts.map