/**
 * data-source-panel-orchestrator — Async coordination for the data source panel
 *
 * Pure async functions that call DataAdapter methods and feed results
 * into the data-source-state machine. These are extracted from the Lit
 * component so they can be tested in Node without DOM.
 *
 * The Lit component calls these functions, passing its setState callback.
 */
import type { DataAdapter } from '@phozart/phz-shared';
import { type DataSourceState } from './data-source-state.js';
export type { DataSourceState } from './data-source-state.js';
type SetState = (updater: (state: DataSourceState) => DataSourceState) => void;
/**
 * Load available data sources from the adapter.
 */
export declare function loadSources(adapter: DataAdapter, setState: SetState): Promise<void>;
/**
 * Load schema for a specific data source and classify its fields.
 */
export declare function loadSchema(adapter: DataAdapter, sourceId: string, setState: SetState): Promise<void>;
/**
 * Load statistics for a specific field (min, max, cardinality, nulls).
 */
export declare function loadFieldStats(adapter: DataAdapter, sourceId: string, fieldName: string, setState: SetState): Promise<void>;
//# sourceMappingURL=data-source-panel-orchestrator.d.ts.map