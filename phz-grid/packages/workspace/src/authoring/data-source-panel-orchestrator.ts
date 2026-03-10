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
import {
  setSources,
  setSchema,
  setSchemaLoading,
  setFieldStats as setFieldStatsState,
  setError,
  type DataSourceState,
} from './data-source-state.js';

// Re-export state type for consumers
export type { DataSourceState } from './data-source-state.js';

type SetState = (updater: (state: DataSourceState) => DataSourceState) => void;

/**
 * Load available data sources from the adapter.
 */
export async function loadSources(
  adapter: DataAdapter,
  setState: SetState,
): Promise<void> {
  setState(s => ({ ...s, sourcesLoading: true }));
  try {
    const sources = await adapter.listDataSources();
    setState(s => setSources(s, sources));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    setState(s => ({
      ...setError(s, `Failed to load data sources: ${msg}`),
      sourcesLoading: false,
    }));
  }
}

/**
 * Load schema for a specific data source and classify its fields.
 */
export async function loadSchema(
  adapter: DataAdapter,
  sourceId: string,
  setState: SetState,
): Promise<void> {
  setState(s => setSchemaLoading(s, true));
  try {
    const schema = await adapter.getSchema(sourceId);
    setState(s => setSchema(s, schema));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    setState(s => ({
      ...setError(s, `Failed to load schema: ${msg}`),
      schemaLoading: false,
    }));
  }
}

/**
 * Load statistics for a specific field (min, max, cardinality, nulls).
 */
export async function loadFieldStats(
  adapter: DataAdapter,
  sourceId: string,
  fieldName: string,
  setState: SetState,
): Promise<void> {
  try {
    const stats = await adapter.getFieldStats(sourceId, fieldName);
    setState(s => setFieldStatsState(s, fieldName, stats));
  } catch {
    // Stats are informational — don't block the UI on failure
  }
}
