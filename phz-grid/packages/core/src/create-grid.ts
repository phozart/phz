/**
 * @phozart/core — createGrid Factory
 *
 * Main entry point. Creates a headless grid instance with full API.
 */

import type { GridConfig } from './types/config.js';
import type { GridApi, VirtualizerConfig, ScrollToOptions, ExportCsvOptions } from './types/api.js';
import type { ColumnDefinition } from './types/column.js';
import type { RowId, RowData } from './types/row.js';
import type { CellPosition } from './types/cell.js';
import type {
  GridState,
  SortState,
  FilterState,
  SerializedGridState,
} from './types/state.js';
import type { GridEventMap, GridEventHandler } from './types/events.js';
import type { Plugin } from './types/plugin.js';
import type { CoreRowModel, GroupedRowModel } from './types/row-model.js';
import type { Unsubscribe } from './types/common.js';

import type { SavedView, SaveViewOptions, ViewsSummary } from './types/views.js';

import { EventEmitter } from './event-emitter.js';
import { StateManager, createInitialState } from './state.js';
import { ViewsManager } from './views.js';
import {
  parseData,
  buildCoreRowModel,
  filterRows,
  sortRows,
  groupRows,
  flattenRows,
  virtualizeRows,
} from './row-model.js';
import { generateRowId } from './utils.js';
import { inferColumns } from './infer-columns.js';
import type { QueryBackend, LocalQuery, LocalQueryResult } from './types/query-backend.js';
import type { ProgressiveLoadConfig } from './progressive-load.js';
import type { ProgressiveLoadInfo } from './types/api.js';
import {
  createInitialProgressiveState,
  startProgressiveLoad,
  onChunkReceived,
  onAllChunksComplete,
  startRefresh,
  shouldShowOverlay as progShowOverlay,
  getProgressMessage,
  type ProgressiveLoadState,
} from './progressive-load.js';

function measureStage<T>(name: string, fn: () => T): T {
  if (typeof performance === 'undefined') return fn();
  const mark = `phz:${name}:start`;
  performance.mark(mark);
  const result = fn();
  performance.measure(`phz:${name}`, mark);
  return result;
}

export interface PreparedGrid<TData = any> {
  columns: ColumnDefinition<TData>[];
  data: RowData<TData>[];
  initialState: GridState<TData>;
  restrictedFields: Set<string>;
  maskedFields: Set<string>;
  plugins?: Plugin[];
  rowIdField?: string;
  userRole?: string;
  queryBackend?: QueryBackend;
  progressiveLoad?: ProgressiveLoadConfig;
}

export function prepareGrid<TData = any>(config: GridConfig<TData>): PreparedGrid<TData> {
  const columns: ColumnDefinition<TData>[] = config.columns
    ?? (config.autoColumns !== false ? inferColumns(config.data) as ColumnDefinition<TData>[] : []);
  const userRole = config.userRole;

  const restrictedFields = new Set<string>();
  const maskedFields = new Set<string>();
  for (const col of columns) {
    if (col.access?.requiredRoles && userRole && !col.access.requiredRoles.includes(userRole)) {
      if (col.access.mask) {
        maskedFields.add(col.field);
      } else {
        restrictedFields.add(col.field);
      }
    }
  }

  const data = parseData(config.data, config.rowIdField);
  let initialState = createInitialState<TData>(columns, userRole);

  if (config.initialState) {
    initialState = { ...initialState, ...config.initialState as Partial<GridState<TData>> };
  }

  if (config.enableSelection !== undefined) {
    initialState = {
      ...initialState,
      selection: { ...initialState.selection, mode: config.enableSelection ? 'single' : 'none' },
    };
  }

  return {
    columns,
    data,
    initialState,
    restrictedFields,
    maskedFields,
    plugins: config.plugins,
    rowIdField: config.rowIdField,
    userRole: config.userRole,
    queryBackend: config.queryBackend,
    progressiveLoad: config.progressiveLoad,
  };
}

export function activateGrid<TData = any>(prepared: PreparedGrid<TData>): GridApi<TData> {
  const { columns, restrictedFields, maskedFields, userRole } = prepared;
  const emitter = new EventEmitter();
  const stateManager = new StateManager<TData>(prepared.initialState);
  const viewsManager = new ViewsManager();
  const plugins = new Map<string, Plugin>();

  // --- Data Store ---
  let rawData: RowData<TData>[] = [...prepared.data];
  const rowMap = new Map<RowId, RowData<TData>>();
  let dataVersion = 0; // Monotonic counter — incremented on every setData() call
  rebuildRowMap();

  // --- Deprecation flags ---
  let filterDeprecationWarned = false;

  // --- Pipeline caches ---
  let coreModelCache: CoreRowModel<TData> | null = null;
  let filteredModelCache: CoreRowModel<TData> | null = null;
  let sortedModelCache: CoreRowModel<TData> | null = null;
  let groupedModelCache: GroupedRowModel<TData> | null = null;
  let flattenedModelCache: CoreRowModel<TData> | null = null;

  function rebuildRowMap(): void {
    rowMap.clear();
    for (const row of rawData) {
      rowMap.set(row.__id, row);
    }
  }

  // --- QueryBackend async dispatch ---
  let queryBackend: QueryBackend | null = prepared.queryBackend ?? null;
  let pendingQueryId = 0; // monotonic counter for cancellation

  // --- Progressive loading state ---
  let progressiveState: ProgressiveLoadState | null = prepared.progressiveLoad
    ? createInitialProgressiveState(prepared.progressiveLoad)
    : null;
  let refreshTimer: ReturnType<typeof setInterval> | null = null;

  function clearRefreshTimer(): void {
    if (refreshTimer !== null) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  function setupRefreshTimer(): void {
    clearRefreshTimer();
    if (progressiveState && progressiveState.refreshIntervalMs > 0) {
      refreshTimer = setInterval(() => {
        dispatchProgressiveLoad(true);
      }, progressiveState.refreshIntervalMs);
    }
  }

  function updateProgressiveStatus(pState: ProgressiveLoadState): void {
    const status = stateManager.getState().status;
    stateManager.setState({
      status: {
        ...status,
        progressivePhase: pState.phase,
        loadedRowCount: pState.loadedRowCount,
        estimatedTotalCount: pState.estimatedTotalCount,
      },
    });
  }

  function dispatchProgressiveLoad(isRefresh = false): void {
    if (!queryBackend || !progressiveState) return;

    const queryId = ++pendingQueryId;
    const state = stateManager.getState();

    progressiveState = isRefresh
      ? startRefresh(progressiveState, queryId)
      : startProgressiveLoad(progressiveState, queryId);

    // Only show full overlay for initial load (not refresh)
    stateManager.setState({
      status: {
        ...state.status,
        loading: progShowOverlay(progressiveState),
        progressivePhase: progressiveState.phase,
        loadedRowCount: 0,
        estimatedTotalCount: progressiveState.estimatedTotalCount,
      },
    });

    const chunkSize = progressiveState.chunkSize;

    // Build base LocalQuery from current state
    const baseQuery: LocalQuery = {
      filters: state.filter.filters.map(f => ({
        field: f.field,
        operator: String(f.operator),
        value: f.value,
      })),
      sort: state.sort.columns.map(s => ({
        field: s.field,
        direction: s.direction,
      })),
      groupBy: state.grouping.groupBy,
    };

    // Async chunk loading loop
    (async () => {
      let offset = 0;
      let isFirstChunk = true;

      try {
        while (true) {
          if (queryId !== pendingQueryId) return; // cancelled

          const result = await queryBackend!.execute({
            ...baseQuery,
            offset,
            limit: chunkSize,
          });

          if (queryId !== pendingQueryId) return; // cancelled while awaiting

          const chunkRows = parseData(result.rows as unknown[], prepared.rowIdField);

          if (isFirstChunk) {
            // Replace data with first chunk
            rawData = isRefresh ? [] : [];
            rawData = chunkRows;
            isFirstChunk = false;
          } else {
            // Append subsequent chunks
            rawData = [...rawData, ...chunkRows];
          }
          rebuildRowMap();
          invalidatePipeline();

          // Use filteredCount (not totalCount) for completion — totalCount is
          // unfiltered in backends like DuckDB, filteredCount reflects actual
          // rows matching current query (filters/sort/group).
          progressiveState = onChunkReceived(
            progressiveState!,
            chunkRows.length,
            result.filteredCount,
          );

          // Clear full-screen overlay after first chunk
          stateManager.setState({
            status: {
              ...stateManager.getState().status,
              loading: false,
              rowCount: rawData.length,
              filteredRowCount: result.filteredCount,
              progressivePhase: progressiveState!.phase,
              loadedRowCount: progressiveState!.loadedRowCount,
              estimatedTotalCount: progressiveState!.estimatedTotalCount,
            },
          });

          emitter.emit('data:progress', {
            type: 'data:progress',
            timestamp: Date.now(),
            loadedRowCount: progressiveState!.loadedRowCount,
            estimatedTotalCount: progressiveState!.estimatedTotalCount,
            phase: progressiveState!.phase,
          });

          // Check if done
          if (progressiveState!.phase === 'complete' || chunkRows.length === 0) {
            progressiveState = onAllChunksComplete(progressiveState!);
            updateProgressiveStatus(progressiveState!);
            emitter.emit('data:change', {
              type: 'data:change',
              timestamp: Date.now(),
              rowCount: rawData.length,
            });
            break;
          }

          offset = progressiveState!.currentOffset;
        }
      } catch (err) {
        if (queryId !== pendingQueryId) return;
        stateManager.setState({
          status: { ...stateManager.getState().status, loading: false },
        });
        emitter.emit('data:error', {
          type: 'data:error',
          timestamp: Date.now(),
          error: err instanceof Error ? err : new Error(String(err)),
        });
      }
    })();
  }

  function invalidatePipeline(): void {
    coreModelCache = null;
    filteredModelCache = null;
    sortedModelCache = null;
    groupedModelCache = null;
    flattenedModelCache = null;
  }

  function dispatchQueryBackend(): void {
    if (!queryBackend) return;

    // If progressive loading is configured and backend supports pagination, use it
    if (progressiveState && queryBackend.getCapabilities().pagination) {
      dispatchProgressiveLoad();
      return;
    }

    // Increment the query ID to cancel any pending query
    const queryId = ++pendingQueryId;

    // Build LocalQuery from current state
    const state = stateManager.getState();
    const localQuery: LocalQuery = {
      filters: state.filter.filters.map(f => ({
        field: f.field,
        operator: String(f.operator),
        value: f.value,
      })),
      sort: state.sort.columns.map(s => ({
        field: s.field,
        direction: s.direction,
      })),
      groupBy: state.grouping.groupBy,
    };

    // Set loading state
    stateManager.setState({
      status: { ...state.status, loading: true },
    });

    // Fire async query
    queryBackend.execute(localQuery).then(result => {
      // Check if this query was cancelled by a newer one
      if (queryId !== pendingQueryId) return;

      // Update data with results
      rawData = parseData(result.rows as unknown[], prepared.rowIdField);
      rebuildRowMap();
      invalidatePipeline();

      stateManager.setState({
        status: {
          ...stateManager.getState().status,
          loading: false,
          rowCount: result.totalCount,
          filteredRowCount: result.filteredCount,
        },
      });

      emitter.emit('data:change', {
        type: 'data:change',
        timestamp: Date.now(),
        rowCount: result.totalCount,
      });
    }).catch(err => {
      if (queryId !== pendingQueryId) return;
      stateManager.setState({
        status: { ...stateManager.getState().status, loading: false },
      });
      emitter.emit('data:error', {
        type: 'data:error',
        timestamp: Date.now(),
        error: err instanceof Error ? err : new Error(String(err)),
      });
    });
  }

  function updateStatus(): void {
    const state = stateManager.getState();
    stateManager.setState({
      status: {
        ...state.status,
        rowCount: rawData.length,
        filteredRowCount: getFilteredRowModel().rowCount,
      },
    });
  }

  // --- Hook execution ---
  function executeBeforeHooks<T>(hookName: string, value: T): T | false {
    for (const plugin of plugins.values()) {
      const hooks = plugin.hooks as Record<string, ((...args: any[]) => any) | undefined> | undefined;
      const hook = hooks?.[hookName];
      if (hook) {
        const result = hook(value);
        if (result === false) return false;
        if (result !== undefined && result !== true) {
          value = result as T;
        }
      }
    }
    return value;
  }

  function executeAfterHooks(hookName: string, ...args: unknown[]): void {
    for (const plugin of plugins.values()) {
      const hooks = plugin.hooks as Record<string, ((...args: any[]) => void) | undefined> | undefined;
      const hook = hooks?.[hookName];
      if (hook) {
        hook(...args);
      }
    }
  }

  // --- Row Model Pipeline ---

  function getCoreRowModel(): CoreRowModel<TData> {
    if (!coreModelCache) {
      coreModelCache = buildCoreRowModel(rawData);
    }
    return coreModelCache;
  }

  function getFilteredRowModel(): CoreRowModel<TData> {
    if (!filteredModelCache) {
      // When queryBackend is active, data is already filtered by the backend
      // (via SQL WHERE clause) — skip local re-filtering to avoid mismatches.
      if (queryBackend) {
        filteredModelCache = getCoreRowModel();
      } else {
        filteredModelCache = measureStage('filter', () => {
          const core = getCoreRowModel();
          const state = stateManager.getState();
          return filterRows(core, state.filter, columns);
        });
      }
    }
    return filteredModelCache;
  }

  function getSortedRowModel(): CoreRowModel<TData> {
    if (!sortedModelCache) {
      // When queryBackend is active, data is already sorted by the backend
      // (via SQL ORDER BY) — skip local re-sorting to preserve backend order.
      if (queryBackend) {
        sortedModelCache = getFilteredRowModel();
      } else {
        sortedModelCache = measureStage('sort', () => {
          const filtered = getFilteredRowModel();
          const state = stateManager.getState();
          return sortRows(filtered, state.sort, columns);
        });
      }
    }
    return sortedModelCache;
  }

  function getGroupedRowModel(): GroupedRowModel<TData> {
    if (!groupedModelCache) {
      groupedModelCache = measureStage('group', () => {
        const sorted = getSortedRowModel();
        const state = stateManager.getState();
        return groupRows(sorted, state.grouping);
      });
    }
    return groupedModelCache;
  }

  function getFlattenedRowModel(): CoreRowModel<TData> {
    if (!flattenedModelCache) {
      flattenedModelCache = measureStage('flatten', () => {
        const grouped = getGroupedRowModel();
        return flattenRows(grouped as any);
      });
    }
    return flattenedModelCache;
  }

  function getVirtualRowModel(virtConfig?: VirtualizerConfig): CoreRowModel<TData> {
    const flat = getFlattenedRowModel();
    const state = stateManager.getState();
    return virtualizeRows(
      flat,
      {
        ...state.virtualization,
        overscan: virtConfig?.overscan ?? state.virtualization.overscan,
      },
      state.scroll.scrollTop,
      state.responsive.containerHeight || 600,
    );
  }

  // --- API ---

  const api: GridApi<TData> = {
    // Data
    getData() {
      if (maskedFields.size === 0) return rawData;
      return rawData.map(row => {
        const masked = { ...row } as Record<string, unknown>;
        for (const field of maskedFields) {
          if (field in masked) masked[field] = '****';
        }
        return masked as RowData<TData>;
      });
    },

    setData(data: unknown[]) {
      const hookResult = executeBeforeHooks('beforeDataChange', data);
      if (hookResult === false) return;

      rawData = parseData(hookResult as unknown[], prepared.rowIdField);
      dataVersion++;
      rebuildRowMap();
      invalidatePipeline();
      updateStatus();

      executeAfterHooks('afterDataChange', rawData);
      emitter.emit('data:change', {
        type: 'data:change',
        timestamp: Date.now(),
        rowCount: rawData.length,
      });
    },

    updateRow(id: RowId, data: Partial<Record<string, unknown>>) {
      const existing = rowMap.get(id);
      if (!existing) return;

      const oldData = { ...existing };
      for (const [key, value] of Object.entries(data)) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
        (existing as Record<string, unknown>)[key] = value;
      }
      invalidatePipeline();

      emitter.emit('row:update', {
        type: 'row:update',
        timestamp: Date.now(),
        rowId: id,
        changes: data,
        oldData: oldData as RowData,
        newData: existing as RowData,
      });
    },

    updateRows(updates) {
      const changed: Array<{
        rowId: RowId;
        changes: Partial<Record<string, unknown>>;
        oldData: RowData;
        newData: RowData;
      }> = [];
      for (const { id, data } of updates) {
        const existing = rowMap.get(id);
        if (!existing) continue;
        const oldData = { ...existing };
        for (const [key, value] of Object.entries(data)) {
          if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
          (existing as Record<string, unknown>)[key] = value;
        }
        changed.push({
          rowId: id,
          changes: data,
          oldData: oldData as RowData,
          newData: existing as RowData,
        });
      }
      if (changed.length > 0) {
        invalidatePipeline();
        for (const c of changed) {
          emitter.emit('row:update', {
            type: 'row:update',
            timestamp: Date.now(),
            rowId: c.rowId,
            changes: c.changes,
            oldData: c.oldData,
            newData: c.newData,
          });
        }
      }
    },

    deleteRow(id: RowId) {
      const existing = rowMap.get(id);
      if (!existing) return;

      rawData = rawData.filter((r) => r.__id !== id);
      rowMap.delete(id);
      invalidatePipeline();
      updateStatus();

      emitter.emit('row:delete', {
        type: 'row:delete',
        timestamp: Date.now(),
        rowId: id,
        data: existing as RowData,
      });
    },

    deleteRows(ids: RowId[]) {
      const deleted: Array<{ rowId: RowId; data: RowData }> = [];
      for (const id of ids) {
        const existing = rowMap.get(id);
        if (!existing) continue;
        rowMap.delete(id);
        deleted.push({ rowId: id, data: existing as RowData });
      }
      if (deleted.length > 0) {
        const deletedIds = new Set(deleted.map(d => d.rowId));
        rawData = rawData.filter(
          (r) => !deletedIds.has(r.__id),
        );
        invalidatePipeline();
        updateStatus();
        for (const d of deleted) {
          emitter.emit('row:delete', {
            type: 'row:delete',
            timestamp: Date.now(),
            rowId: d.rowId,
            data: d.data,
          });
        }
      }
    },

    addRow(data: Record<string, unknown>, position?: number): RowId {
      const id = generateRowId();
      const row: RowData<TData> = { ...data, __id: id } as RowData<TData>;

      if (position !== undefined && position >= 0 && position < rawData.length) {
        rawData.splice(position, 0, row);
      } else {
        rawData.push(row);
      }

      rowMap.set(id, row);
      invalidatePipeline();
      updateStatus();

      emitter.emit('row:add', {
        type: 'row:add',
        timestamp: Date.now(),
        rowId: id,
        data: row as RowData,
        position: position ?? rawData.length - 1,
      });

      return id;
    },

    addRows(dataArr, position?) {
      const ids: RowId[] = [];
      for (let i = 0; i < dataArr.length; i++) {
        const id = generateRowId();
        const row: RowData<TData> = { ...dataArr[i], __id: id } as RowData<TData>;
        const insertAt = position !== undefined ? position + i : undefined;

        if (insertAt !== undefined && insertAt >= 0 && insertAt < rawData.length) {
          rawData.splice(insertAt, 0, row);
        } else {
          rawData.push(row);
        }
        rowMap.set(id, row);
        ids.push(id);

        emitter.emit('row:add', {
          type: 'row:add',
          timestamp: Date.now(),
          rowId: id,
          data: row as RowData,
          position: insertAt ?? rawData.length - 1,
        });
      }
      if (ids.length > 0) {
        invalidatePipeline();
        updateStatus();
      }
      return ids;
    },

    // State
    getState() {
      return stateManager.getState();
    },

    exportState() {
      return stateManager.exportState();
    },

    importState(state: SerializedGridState) {
      stateManager.importState(state);
      // Re-enforce restricted column visibility after import
      if (restrictedFields.size > 0) {
        const current = stateManager.getState();
        const enforced = { ...current.columns.visibility };
        for (const field of restrictedFields) {
          enforced[field] = false;
        }
        stateManager.setState({
          columns: { ...current.columns, visibility: enforced },
        });
      }
      invalidatePipeline();
    },

    // Undo/Redo
    undo(): boolean {
      const result = stateManager.undo();
      if (result) invalidatePipeline();
      return result;
    },

    redo(): boolean {
      const result = stateManager.redo();
      if (result) invalidatePipeline();
      return result;
    },

    canUndo(): boolean {
      return stateManager.canUndo();
    },

    canRedo(): boolean {
      return stateManager.canRedo();
    },

    // Sort
    sort(field: string, direction: 'asc' | 'desc' | null) {
      stateManager.pushUndo();
      const newSort: SortState = direction
        ? { columns: [{ field, direction }] }
        : { columns: [] };

      const hookResult = executeBeforeHooks('beforeSort', newSort);
      if (hookResult === false) return;

      stateManager.setState({ sort: hookResult as SortState });
      sortedModelCache = null;
      groupedModelCache = null;
      flattenedModelCache = null;

      executeAfterHooks('afterSort', hookResult);
      emitter.emit('sort:change', {
        type: 'sort:change',
        timestamp: Date.now(),
        sort: hookResult as SortState,
      });
      if (queryBackend) dispatchQueryBackend();
    },

    multiSort(sorts) {
      stateManager.pushUndo();
      const newSort: SortState = { columns: sorts };
      const hookResult = executeBeforeHooks('beforeSort', newSort);
      if (hookResult === false) return;

      stateManager.setState({ sort: hookResult as SortState });
      sortedModelCache = null;
      groupedModelCache = null;
      flattenedModelCache = null;

      executeAfterHooks('afterSort', hookResult);
      emitter.emit('sort:change', {
        type: 'sort:change',
        timestamp: Date.now(),
        sort: hookResult as SortState,
      });
      if (queryBackend) dispatchQueryBackend();
    },

    clearSort() {
      stateManager.pushUndo();
      stateManager.setState({ sort: { columns: [] } });
      sortedModelCache = null;
      groupedModelCache = null;
      flattenedModelCache = null;
      emitter.emit('sort:clear', { type: 'sort:clear', timestamp: Date.now() });
      if (queryBackend) dispatchQueryBackend();
    },

    getSortState() {
      return stateManager.getState().sort;
    },

    // Filter
    /** @deprecated Use `addFilter()` instead. `filter()` replaces all filters with a single one. */
    filter(field, operator, value) {
      if (!filterDeprecationWarned) {
        filterDeprecationWarned = true;
        console.warn('phz-grid: filter() is deprecated. Use addFilter() instead.');
      }
      api.addFilter(field, operator, value);
    },

    addFilter(field, operator, value) {
      stateManager.pushUndo();
      const current = stateManager.getState().filter;
      const existing = current.filters.filter((f) => f.field !== field);
      const newFilter: FilterState = {
        ...current,
        filters: [...existing, { field, operator, value }],
      };

      const hookResult = executeBeforeHooks('beforeFilter', newFilter);
      if (hookResult === false) return;

      stateManager.setState({ filter: hookResult as FilterState });
      filteredModelCache = null;
      sortedModelCache = null;
      groupedModelCache = null;
      flattenedModelCache = null;

      executeAfterHooks('afterFilter', hookResult);
      emitter.emit('filter:change', {
        type: 'filter:change',
        timestamp: Date.now(),
        filter: hookResult as FilterState,
      });
      if (queryBackend) dispatchQueryBackend();
    },

    setFilters(filters) {
      stateManager.pushUndo();
      const current = stateManager.getState().filter;
      const newFilter: FilterState = { ...current, filters };

      const hookResult = executeBeforeHooks('beforeFilter', newFilter);
      if (hookResult === false) return;

      stateManager.setState({ filter: hookResult as FilterState });
      filteredModelCache = null;
      sortedModelCache = null;
      groupedModelCache = null;
      flattenedModelCache = null;

      executeAfterHooks('afterFilter', hookResult);
      emitter.emit('filter:change', {
        type: 'filter:change',
        timestamp: Date.now(),
        filter: hookResult as FilterState,
      });
      if (queryBackend) dispatchQueryBackend();
    },

    removeFilter(field) {
      stateManager.pushUndo();
      const current = stateManager.getState().filter;
      stateManager.setState({
        filter: {
          ...current,
          filters: current.filters.filter((f) => f.field !== field),
        },
      });
      filteredModelCache = null;
      sortedModelCache = null;
      groupedModelCache = null;
      flattenedModelCache = null;
      if (queryBackend) dispatchQueryBackend();
    },

    clearFilters() {
      stateManager.pushUndo();
      stateManager.setState({
        filter: { ...stateManager.getState().filter, filters: [], activePreset: undefined },
      });
      filteredModelCache = null;
      sortedModelCache = null;
      groupedModelCache = null;
      flattenedModelCache = null;
      emitter.emit('filter:clear', { type: 'filter:clear', timestamp: Date.now() });
      if (queryBackend) dispatchQueryBackend();
    },

    getFilterState() {
      return stateManager.getState().filter;
    },

    saveFilterPreset(name) {
      const current = stateManager.getState().filter;
      const preset = { name, filters: [...current.filters] };
      stateManager.setState({
        filter: {
          ...current,
          presets: { ...current.presets, [name]: preset },
        },
      });
      emitter.emit('filter:preset:save', {
        type: 'filter:preset:save',
        timestamp: Date.now(),
        presetName: name,
        preset,
      });
    },

    loadFilterPreset(name) {
      const current = stateManager.getState().filter;
      const preset = current.presets[name];
      if (!preset) return;

      stateManager.setState({
        filter: { ...current, filters: [...preset.filters], activePreset: name },
      });
      filteredModelCache = null;
      sortedModelCache = null;
      groupedModelCache = null;
      flattenedModelCache = null;
      emitter.emit('filter:preset:load', {
        type: 'filter:preset:load',
        timestamp: Date.now(),
        presetName: name,
        preset,
      });
      if (queryBackend) dispatchQueryBackend();
    },

    deleteFilterPreset(name) {
      const current = stateManager.getState().filter;
      const { [name]: _, ...rest } = current.presets;
      stateManager.setState({ filter: { ...current, presets: rest } });
    },

    // Selection
    select(rowIds) {
      const ids = Array.isArray(rowIds) ? rowIds : [rowIds];
      const hookResult = executeBeforeHooks('beforeSelect', ids);
      if (hookResult === false) return;

      const state = stateManager.getState();
      const newSelected = new Set(state.selection.selectedRows);
      const added: RowId[] = [];

      for (const id of hookResult as RowId[]) {
        if (!newSelected.has(id)) {
          newSelected.add(id);
          added.push(id);
        }
      }

      stateManager.setState({
        selection: { ...state.selection, selectedRows: newSelected },
      });

      executeAfterHooks('afterSelect', Array.from(newSelected));
      emitter.emit('selection:change', {
        type: 'selection:change',
        timestamp: Date.now(),
        selectedRows: Array.from(newSelected),
        selectedCells: [],
        delta: { addedRows: added, removedRows: [], addedCells: [], removedCells: [] },
      });
    },

    deselect(rowIds) {
      const ids = Array.isArray(rowIds) ? rowIds : [rowIds];
      const state = stateManager.getState();
      const newSelected = new Set(state.selection.selectedRows);

      for (const id of ids) {
        newSelected.delete(id);
      }

      stateManager.setState({
        selection: { ...state.selection, selectedRows: newSelected },
      });

      emitter.emit('selection:change', {
        type: 'selection:change',
        timestamp: Date.now(),
        selectedRows: Array.from(newSelected),
        selectedCells: [],
        delta: { addedRows: [], removedRows: ids, addedCells: [], removedCells: [] },
      });
    },

    selectAll() {
      const allIds = rawData.map((r) => r.__id);
      const state = stateManager.getState();
      stateManager.setState({
        selection: { ...state.selection, selectedRows: new Set(allIds) },
      });

      emitter.emit('selection:change', {
        type: 'selection:change',
        timestamp: Date.now(),
        selectedRows: allIds,
        selectedCells: [],
        delta: { addedRows: allIds, removedRows: [], addedCells: [], removedCells: [] },
      });
    },

    deselectAll() {
      const state = stateManager.getState();
      const removed = Array.from(state.selection.selectedRows);
      stateManager.setState({
        selection: { ...state.selection, selectedRows: new Set(), selectedCells: new Set() },
      });

      emitter.emit('selection:change', {
        type: 'selection:change',
        timestamp: Date.now(),
        selectedRows: [],
        selectedCells: [],
        delta: { addedRows: [], removedRows: removed, addedCells: [], removedCells: [] },
      });
    },

    getSelection() {
      const s = stateManager.getState().selection;
      return {
        rows: Array.from(s.selectedRows),
        cells: Array.from(s.selectedCells).map((key) => {
          const sep = key.indexOf(':');
          return { rowId: key.slice(0, sep), field: key.slice(sep + 1) };
        }),
      };
    },

    selectRange(start: CellPosition, end: CellPosition) {
      // Simplified: select all rows between start and end
      const sorted = getSortedRowModel();
      const startIdx = sorted.rows.findIndex((r) => r.__id === start.rowId);
      const endIdx = sorted.rows.findIndex((r) => r.__id === end.rowId);
      if (startIdx === -1 || endIdx === -1) return;

      const min = Math.min(startIdx, endIdx);
      const max = Math.max(startIdx, endIdx);
      const ids = sorted.rows.slice(min, max + 1).map((r) => r.__id);
      api.select(ids);
    },

    selectRow(id: RowId) {
      api.select(id);
    },

    selectRows(ids: RowId[]) {
      api.select(ids);
    },

    // Editing
    startEdit(position: CellPosition) {
      const row = rowMap.get(position.rowId);
      if (!row) return;

      const currentValue = row[position.field];
      const hookResult = executeBeforeHooks('beforeEdit', currentValue);
      if (hookResult === false) return;

      stateManager.setState({
        edit: {
          status: 'editing',
          position,
          value: currentValue,
          originalValue: currentValue,
        },
      });

      emitter.emit('edit:start', {
        type: 'edit:start',
        timestamp: Date.now(),
        position,
        currentValue,
      });
    },

    async commitEdit(position: CellPosition, value: unknown): Promise<boolean> {
      const row = rowMap.get(position.rowId);
      if (!row) return false;

      const column = columns.find((c) => c.field === position.field);
      if (column?.validator) {
        stateManager.setState({
          edit: { status: 'validating', position, value },
        });

        let result: true | string;
        try {
          result = await column.validator({
            value,
            oldValue: row[position.field],
            field: position.field,
            rowId: position.rowId,
          });
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          stateManager.setState({
            edit: { status: 'error', position, value, error: errorMsg },
          });
          emitter.emit('edit:validation:error', {
            type: 'edit:validation:error',
            timestamp: Date.now(),
            position,
            value,
            error: errorMsg,
          });
          return false;
        }

        if (result !== true) {
          stateManager.setState({
            edit: { status: 'error', position, value, error: result },
          });
          emitter.emit('edit:validation:error', {
            type: 'edit:validation:error',
            timestamp: Date.now(),
            position,
            value,
            error: result,
          });
          return false;
        }
      }

      const oldValue = row[position.field];
      row[position.field] = value;
      invalidatePipeline();

      stateManager.setState({ edit: { status: 'idle' } });

      executeAfterHooks('afterEdit', position, value);
      emitter.emit('edit:commit', {
        type: 'edit:commit',
        timestamp: Date.now(),
        position,
        oldValue,
        newValue: value,
      });

      return true;
    },

    cancelEdit(position: CellPosition) {
      stateManager.setState({ edit: { status: 'idle' } });
      emitter.emit('edit:cancel', {
        type: 'edit:cancel',
        timestamp: Date.now(),
        position,
      });
    },

    getEditState() {
      return stateManager.getState().edit;
    },

    isDirty() {
      const edit = stateManager.getState().edit;
      return edit.status === 'editing';
    },

    getDirtyRows() {
      const edit = stateManager.getState().edit;
      if (edit.status === 'editing') {
        return [edit.position.rowId];
      }
      return [];
    },

    // Column Management
    setColumnOrder(fields: string[]) {
      stateManager.pushUndo();
      const state = stateManager.getState();
      stateManager.setState({
        columns: { ...state.columns, order: fields },
      });
    },

    setColumnWidth(field: string, width: number) {
      stateManager.pushUndo();
      const state = stateManager.getState();
      const oldWidth = state.columns.widths[field] ?? 150;
      stateManager.setState({
        columns: { ...state.columns, widths: { ...state.columns.widths, [field]: width } },
      });
      emitter.emit('column:resize', {
        type: 'column:resize',
        timestamp: Date.now(),
        field,
        oldWidth,
        newWidth: width,
      });
    },

    setColumnVisibility(field: string, visible: boolean) {
      if (visible && restrictedFields.has(field)) {
        emitter.emit('column:access:denied', {
          type: 'column:access:denied',
          timestamp: Date.now(),
          field,
          userRole: userRole ?? '',
          requiredRoles: columns.find(c => c.field === field)?.access?.requiredRoles ?? [],
        });
        return;
      }
      stateManager.pushUndo();
      const state = stateManager.getState();
      stateManager.setState({
        columns: {
          ...state.columns,
          visibility: { ...state.columns.visibility, [field]: visible },
        },
      });
      emitter.emit('column:visibility:change', {
        type: 'column:visibility:change',
        timestamp: Date.now(),
        field,
        visible,
      });
    },

    getColumnState() {
      return stateManager.getState().columns;
    },

    resetColumns() {
      stateManager.setState({
        columns: {
          order: columns.map((c) => c.field),
          widths: Object.fromEntries(columns.map((c) => [c.field, c.width ?? 150])),
          visibility: Object.fromEntries(columns.map((c) => [c.field, !restrictedFields.has(c.field)])),
          pinOverrides: {},
        },
      });
    },

    getAccessibleColumns(): ReadonlyArray<ColumnDefinition> {
      return columns.filter((c) => !restrictedFields.has(c.field));
    },

    getRestrictedFields(): ReadonlySet<string> {
      return restrictedFields;
    },

    getMaskedFields(): ReadonlySet<string> {
      return maskedFields;
    },

    // Grouping
    groupBy(fields) {
      stateManager.pushUndo();
      const arr = Array.isArray(fields) ? fields : [fields];
      const state = stateManager.getState();
      stateManager.setState({
        grouping: { ...state.grouping, groupBy: arr },
      });
      invalidatePipeline();
    },

    ungroupBy(fields?) {
      stateManager.pushUndo();
      const state = stateManager.getState();
      if (!fields) {
        stateManager.setState({
          grouping: { ...state.grouping, groupBy: [] },
        });
      } else {
        const arr = Array.isArray(fields) ? fields : [fields];
        stateManager.setState({
          grouping: {
            ...state.grouping,
            groupBy: state.grouping.groupBy.filter((f) => !arr.includes(f)),
          },
        });
      }
      invalidatePipeline();
    },

    expandGroup(groupKey: string) {
      const state = stateManager.getState();
      const expanded = new Set(state.grouping.expandedGroups);
      expanded.add(groupKey);
      stateManager.setState({
        grouping: { ...state.grouping, expandedGroups: expanded },
      });
      emitter.emit('group:expand', {
        type: 'group:expand',
        timestamp: Date.now(),
        groupKey,
      });
    },

    collapseGroup(groupKey: string) {
      const state = stateManager.getState();
      const expanded = new Set(state.grouping.expandedGroups);
      expanded.delete(groupKey);
      stateManager.setState({
        grouping: { ...state.grouping, expandedGroups: expanded },
      });
      emitter.emit('group:collapse', {
        type: 'group:collapse',
        timestamp: Date.now(),
        groupKey,
      });
    },

    expandAllGroups() {
      const grouped = getGroupedRowModel() as any;
      if (!grouped.groups) return;
      const keys = collectGroupKeys(grouped.groups);
      const state = stateManager.getState();
      stateManager.setState({
        grouping: { ...state.grouping, expandedGroups: new Set(keys) },
      });
    },

    collapseAllGroups() {
      const state = stateManager.getState();
      stateManager.setState({
        grouping: { ...state.grouping, expandedGroups: new Set() },
      });
    },

    // Row Model Pipeline
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    getGroupedRowModel,
    getFlattenedRowModel,
    getVirtualRowModel,

    // Viewport
    scrollToRow(_id: RowId, _options?: ScrollToOptions) {
      // No-op in headless mode; rendering layer handles scrolling
    },
    scrollToColumn(_field: string, _options?: ScrollToOptions) {
      // No-op in headless mode
    },
    scrollToCell(_position: CellPosition, _options?: ScrollToOptions) {
      // No-op in headless mode
    },

    // Events
    on<K extends keyof GridEventMap>(event: K, handler: GridEventHandler<K>): Unsubscribe {
      return emitter.on(event, handler);
    },

    once<K extends keyof GridEventMap>(event: K, handler: GridEventHandler<K>): Unsubscribe {
      return emitter.once(event, handler);
    },

    off<K extends keyof GridEventMap>(event: K, handler: GridEventHandler<K>): void {
      emitter.off(event, handler);
    },

    // Plugins
    registerPlugin(plugin: Plugin) {
      plugins.set(plugin.id, plugin);
      plugin.initialize?.(api);
    },

    unregisterPlugin(id: string) {
      const plugin = plugins.get(id);
      if (plugin) {
        plugin.destroy?.();
        plugins.delete(id);
      }
    },

    getPlugin(id: string) {
      return plugins.get(id);
    },

    // Subscriber
    subscribe(listener) {
      return stateManager.subscribe(listener);
    },

    subscribeSelector(selector, callback, equalityFn?) {
      return stateManager.subscribeSelector(selector, callback, equalityFn);
    },

    // Views
    saveView(name: string, options?: SaveViewOptions): SavedView {
      const view = viewsManager.saveView(name, stateManager.exportState(), options);
      emitter.emit('view:save', {
        type: 'view:save',
        timestamp: Date.now(),
        viewId: view.id,
        viewName: view.name,
      });
      return view;
    },

    loadView(id: string): void {
      const view = viewsManager.loadView(id);
      stateManager.importState(view.state);
      invalidatePipeline();
      emitter.emit('view:load', {
        type: 'view:load',
        timestamp: Date.now(),
        viewId: id,
      });
    },

    deleteView(id: string): void {
      viewsManager.deleteView(id);
      emitter.emit('view:delete', {
        type: 'view:delete',
        timestamp: Date.now(),
        viewId: id,
      });
    },

    renameView(id: string, name: string): void {
      viewsManager.renameView(id, name);
    },

    getView(id: string): SavedView | undefined {
      return viewsManager.getView(id);
    },

    listViews(): ViewsSummary[] {
      return viewsManager.listViews();
    },

    getActiveViewId(): string | null {
      return viewsManager.getActiveViewId();
    },

    setDefaultView(id: string | null): void {
      viewsManager.setDefaultView(id);
    },

    isViewDirty(): boolean {
      return viewsManager.isViewDirty(stateManager.exportState());
    },

    saveCurrentToView(viewId: string): SavedView {
      return viewsManager.saveCurrentToView(viewId, stateManager.exportState());
    },

    importViews(views: SavedView[]): void {
      viewsManager.importViews(views);
    },

    exportViews(): SavedView[] {
      return viewsManager.exportViews();
    },

    // Export
    exportCsv(options?: ExportCsvOptions): string {
      const sep = options?.separator ?? ',';
      const includeHeaders = options?.includeHeaders ?? true;
      const model = getSortedRowModel();
      const requestedCols = options?.columns ?? columns.map((c) => c.field);
      // Exclude restricted fields from export
      const visibleCols = requestedCols.filter((f) => !restrictedFields.has(f));

      const rows = options?.selectedOnly
        ? model.rows.filter((r) => stateManager.getState().selection.selectedRows.has(r.__id))
        : model.rows;

      emitter.emit('export:start', {
        type: 'export:start',
        timestamp: Date.now(),
        format: 'csv',
        rowCount: rows.length,
        columnCount: visibleCols.length,
      });

      const lines: string[] = [];
      if (includeHeaders) {
        lines.push(visibleCols.map((f) => {
          const col = columns.find((c) => c.field === f);
          return col?.header ?? f;
        }).join(sep));
      }

      for (const row of rows) {
        lines.push(visibleCols.map((f) => {
          const val = row[f];
          // Apply mask function for masked fields
          if (maskedFields.has(f)) {
            const col = columns.find((c) => c.field === f);
            if (col?.access?.mask) {
              const masked = typeof col.access.mask === 'function' ? col.access.mask(val) : col.access.mask;
              return masked.includes(sep) || masked.includes('"') || masked.includes('\n')
                ? `"${masked.replace(/"/g, '""')}"`
                : masked;
            }
          }
          const str = val == null ? '' : String(val);
          return str.includes(sep) || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        }).join(sep));
      }

      const csvResult = lines.join('\n');

      emitter.emit('export:complete', {
        type: 'export:complete',
        timestamp: Date.now(),
        format: 'csv',
        rowCount: rows.length,
      });

      return csvResult;
    },

    // QueryBackend
    setQueryBackend(backend: QueryBackend | null): void {
      clearRefreshTimer();
      queryBackend = backend;
      if (backend) {
        dispatchQueryBackend();
        setupRefreshTimer();
      }
    },

    getQueryBackend(): QueryBackend | null {
      return queryBackend;
    },

    isLoading(): boolean {
      return stateManager.getState().status.loading ?? false;
    },

    getDataVersion(): number {
      return dataVersion;
    },

    // Progressive Loading
    getProgressiveState(): ProgressiveLoadInfo | null {
      if (!progressiveState) return null;
      return {
        phase: progressiveState.phase,
        loadedRowCount: progressiveState.loadedRowCount,
        estimatedTotalCount: progressiveState.estimatedTotalCount,
      };
    },

    refreshData(): void {
      if (progressiveState && queryBackend) {
        dispatchProgressiveLoad(progressiveState.phase === 'complete' || progressiveState.phase === 'idle');
      } else if (queryBackend) {
        dispatchQueryBackend();
      }
    },

    // Lifecycle
    destroy() {
      clearRefreshTimer();
      queryBackend?.destroy?.();
      queryBackend = null;
      for (const plugin of plugins.values()) {
        plugin.destroy?.();
      }
      plugins.clear();
      emitter.removeAllListeners();
      stateManager.destroy();
    },
  };

  // --- Initialize plugins ---
  if (prepared.plugins) {
    for (const plugin of prepared.plugins) {
      api.registerPlugin(plugin);
    }
  }

  // Update initial status
  updateStatus();

  // Start auto-refresh timer if configured
  if (progressiveState && queryBackend) {
    setupRefreshTimer();
  }

  // Auto-dispatch initial query when queryBackend is provided at creation time
  if (queryBackend) {
    dispatchQueryBackend();
  }

  // Emit ready
  emitter.emit('grid:ready', {
    type: 'grid:ready',
    timestamp: Date.now(),
    rowCount: rawData.length,
    columnCount: columns.length,
  });

  return api;
}

/**
 * Create a headless grid instance with the full {@link GridApi}.
 *
 * This is the primary entry point for `@phozart/core`. It parses the
 * supplied data, builds the initial row model, and returns a stateful API
 * object that can be used directly or wired to a rendering layer (e.g. the
 * `<phz-grid>` Web Component or a React/Vue/Angular wrapper).
 *
 * @param config - Grid configuration: data, columns, features, plugins, etc.
 * @returns A fully initialized {@link GridApi} instance.
 *
 * @example
 * ```ts
 * import { createGrid } from '@phozart/core';
 *
 * const grid = createGrid({
 *   data: salesRows,
 *   columns: [
 *     { field: 'product', header: 'Product', type: 'string' },
 *     { field: 'revenue', header: 'Revenue', type: 'number' },
 *   ],
 *   enableSorting: true,
 *   enableFiltering: true,
 * });
 *
 * grid.sort('revenue', 'desc');
 * console.log(grid.getData().length);
 * ```
 */
export function createGrid<TData = any>(config: GridConfig<TData>): GridApi<TData> {
  return activateGrid(prepareGrid(config));
}

function collectGroupKeys(groups: any[]): string[] {
  const keys: string[] = [];
  for (const group of groups) {
    keys.push(group.key);
    if (group.subGroups) {
      keys.push(...collectGroupKeys(group.subGroups));
    }
  }
  return keys;
}
