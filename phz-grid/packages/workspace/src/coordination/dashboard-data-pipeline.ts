/**
 * @phozart/phz-workspace — Dashboard Data Pipeline (T.4)
 *
 * Preload/full-load parallel data architecture:
 * - Fires preload query immediately for fast initial render.
 * - Fires full load in parallel for complete data.
 * - Distributes results to widgets based on dataTier.
 * - Supports invalidation (re-trigger on server filter change).
 * - Multi-source mode: tracks per-source loading states and results
 *   when `config.sources` is present and non-empty.
 */

import type {
  DashboardDataConfig,
  DashboardLoadingState,
} from '@phozart/phz-shared/coordination';
import type {
  DataAdapter,
  DataResult,
} from '../data-adapter.js';
import type { FilterContextManager } from '../filters/filter-context.js';

export interface DashboardDataPipeline {
  readonly state: DashboardLoadingState;
  readonly sourceStates: ReadonlyMap<string, DashboardLoadingState>;
  start(): Promise<void>;
  onStateChange(cb: (state: DashboardLoadingState) => void): () => void;
  getWidgetData(widgetId: string, tier: 'preload' | 'full' | 'both'): DataResult | undefined;
  getSourceData(sourceId: string, tier: 'preload' | 'full' | 'both'): DataResult | undefined;
  invalidate(sourceId?: string): Promise<void>;
  destroy(): void;
}

export function createDashboardDataPipeline(
  config: DashboardDataConfig,
  dataAdapter: DataAdapter,
  _filterContext: FilterContextManager,
  widgetSourceMap?: ReadonlyMap<string, string>,
): DashboardDataPipeline {
  let currentState: DashboardLoadingState = { phase: 'idle' };
  let preloadResult: DataResult | undefined;
  let fullResult: DataResult | undefined;
  const listeners = new Set<(state: DashboardLoadingState) => void>();
  let destroyed = false;

  // Multi-source support
  const sources = config.sources ?? [];
  const isMultiSource = sources.length > 0;
  const sourcePreloadResults = new Map<string, DataResult>();
  const sourceFullResults = new Map<string, DataResult>();
  const perSourceStates = new Map<string, DashboardLoadingState>();

  // Initialize per-source states
  for (const src of sources) {
    perSourceStates.set(src.sourceId, { phase: 'idle' });
  }

  function setState(update: Partial<DashboardLoadingState>): void {
    currentState = { ...currentState, ...update };
    if (destroyed) return;
    for (const listener of listeners) {
      listener({ ...currentState });
    }
  }

  /** Legacy single-source load (backward compatible). */
  async function runLoad(): Promise<void> {
    if (destroyed) return;

    setState({ phase: 'preloading', error: undefined, progress: 0 });

    try {
      // Fire preload + full-load in parallel
      const preloadPromise = config.preload
        ? dataAdapter.execute(config.preload.query)
        : Promise.resolve(undefined);
      const fullLoadPromise = config.fullLoad
        ? dataAdapter.execute({
            ...config.fullLoad.query,
            limit: config.fullLoad.maxRows,
          })
        : Promise.resolve(undefined);

      // Handle preload completion
      preloadResult = await preloadPromise;
      if (destroyed) return;
      setState({ phase: 'preload-complete', progress: 50 });

      // Handle full-load completion
      fullResult = await fullLoadPromise;
      if (destroyed) return;
      setState({ phase: 'full-complete', progress: 100 });
    } catch (err) {
      if (destroyed) return;
      const message = err instanceof Error ? err.message : String(err);
      setState({ phase: 'error', error: message });
    }
  }

  /** Multi-source parallel load. */
  async function runMultiSourceLoad(): Promise<void> {
    if (destroyed) return;
    setState({ phase: 'preloading', error: undefined, progress: 0 });

    try {
      // Fire all source preloads in parallel
      const preloadPromises = sources
        .filter(s => s.preload)
        .map(async (src) => {
          perSourceStates.set(src.sourceId, { phase: 'preloading' });
          const result = await dataAdapter.execute(src.preload!.query);
          if (destroyed) return;
          sourcePreloadResults.set(src.sourceId, result);
          perSourceStates.set(src.sourceId, { phase: 'preload-complete', progress: 50 });
        });

      await Promise.all(preloadPromises);
      if (destroyed) return;
      setState({ phase: 'preload-complete', progress: 50 });

      // Fire all source full loads in parallel
      const fullLoadPromises = sources
        .filter(s => s.fullLoad)
        .map(async (src) => {
          const result = await dataAdapter.execute({
            ...src.fullLoad!.query,
            limit: src.fullLoad!.maxRows,
          });
          if (destroyed) return;
          sourceFullResults.set(src.sourceId, result);
          perSourceStates.set(src.sourceId, { phase: 'full-complete', progress: 100 });
        });

      await Promise.all(fullLoadPromises);
      if (destroyed) return;
      setState({ phase: 'full-complete', progress: 100 });
    } catch (err) {
      if (destroyed) return;
      const message = err instanceof Error ? err.message : String(err);
      setState({ phase: 'error', error: message });
    }
  }

  function getSourceDataFn(sourceId: string, tier: 'preload' | 'full' | 'both'): DataResult | undefined {
    if (tier === 'preload') return sourcePreloadResults.get(sourceId);
    if (tier === 'full') return sourceFullResults.get(sourceId);
    return sourceFullResults.get(sourceId) ?? sourcePreloadResults.get(sourceId);
  }

  return {
    get state(): DashboardLoadingState {
      return { ...currentState };
    },

    get sourceStates(): ReadonlyMap<string, DashboardLoadingState> {
      return new Map(perSourceStates);
    },

    async start(): Promise<void> {
      if (isMultiSource) {
        await runMultiSourceLoad();
      } else {
        await runLoad();
      }
    },

    onStateChange(cb: (state: DashboardLoadingState) => void): () => void {
      listeners.add(cb);
      return () => { listeners.delete(cb); };
    },

    getWidgetData(widgetId: string, tier: 'preload' | 'full' | 'both'): DataResult | undefined {
      if (!isMultiSource) {
        // Legacy single-source behavior
        if (tier === 'preload') return preloadResult;
        if (tier === 'full') return fullResult;
        return fullResult ?? preloadResult;
      }

      // Multi-source: find widget's source via widgetSourceMap
      const sourceId = widgetSourceMap?.get(widgetId) ?? sources[0]?.sourceId;
      if (!sourceId) return undefined;
      return getSourceDataFn(sourceId, tier);
    },

    getSourceData(sourceId: string, tier: 'preload' | 'full' | 'both'): DataResult | undefined {
      return getSourceDataFn(sourceId, tier);
    },

    async invalidate(sourceId?: string): Promise<void> {
      if (!isMultiSource || !sourceId) {
        // Full re-load
        preloadResult = undefined;
        fullResult = undefined;
        sourcePreloadResults.clear();
        sourceFullResults.clear();
        if (isMultiSource) {
          await runMultiSourceLoad();
        } else {
          await runLoad();
        }
        return;
      }

      // Per-source invalidation
      sourcePreloadResults.delete(sourceId);
      sourceFullResults.delete(sourceId);
      const src = sources.find(s => s.sourceId === sourceId);
      if (!src) return;

      perSourceStates.set(sourceId, { phase: 'preloading' });
      // Notify listeners of state change
      setState({ ...currentState });

      try {
        if (src.preload) {
          const pr = await dataAdapter.execute(src.preload.query);
          if (!destroyed) sourcePreloadResults.set(sourceId, pr);
        }
        if (src.fullLoad) {
          const fr = await dataAdapter.execute({ ...src.fullLoad.query, limit: src.fullLoad.maxRows });
          if (!destroyed) sourceFullResults.set(sourceId, fr);
        }
        if (!destroyed) perSourceStates.set(sourceId, { phase: 'full-complete', progress: 100 });
      } catch (err) {
        if (!destroyed) {
          const message = err instanceof Error ? err.message : String(err);
          perSourceStates.set(sourceId, { phase: 'error', error: message });
        }
      }
    },

    destroy(): void {
      destroyed = true;
      listeners.clear();
      preloadResult = undefined;
      fullResult = undefined;
      sourcePreloadResults.clear();
      sourceFullResults.clear();
      perSourceStates.clear();
    },
  };
}
