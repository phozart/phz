/**
 * @phozart/workspace — Data Explorer Orchestrator (P.5)
 *
 * Main headless controller combining field palette, drop zones,
 * preview, chart suggest, and undo/redo.
 */

import type { FieldMetadata } from '../data-adapter.js';
import type { ExploreQuery } from '../explore-types.js';
import type { DropZoneState, ZoneName } from './phz-drop-zones.js';
import { createDropZoneState, addFieldToZone, removeFieldFromZone } from './phz-drop-zones.js';
import { autoPlaceField, type DropZoneType } from './phz-field-palette.js';
import { toExploreQuery } from './phz-pivot-preview.js';
import { suggestChartType } from './chart-suggest.js';

// ========================================================================
// State
// ========================================================================

export interface DataExplorerState {
  dataSourceId?: string;
  fields: FieldMetadata[];
  dropZones: DropZoneState;
}

// ========================================================================
// DataExplorer interface
// ========================================================================

export interface DataExplorer {
  getState(): DataExplorerState;
  setDataSource(id: string, fields: FieldMetadata[]): void;
  autoPlaceField(field: FieldMetadata): void;
  addToZone(zone: ZoneName, field: FieldMetadata): void;
  removeFromZone(zone: ZoneName, fieldName: string): void;
  toQuery(): ExploreQuery;
  suggestChart(): string;
  subscribe(listener: () => void): () => void;
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
}

// ========================================================================
// createDataExplorer
// ========================================================================

export function createDataExplorer(): DataExplorer {
  let state: DataExplorerState = {
    fields: [],
    dropZones: createDropZoneState(),
  };

  // Undo/redo stacks store drop zone snapshots
  const undoStack: DropZoneState[] = [];
  let redoStack: DropZoneState[] = [];

  const listeners = new Set<() => void>();

  function notify(): void {
    for (const listener of listeners) {
      listener();
    }
  }

  function pushUndo(): void {
    undoStack.push(cloneDropZones(state.dropZones));
    redoStack = []; // new action clears redo
  }

  function cloneDropZones(dz: DropZoneState): DropZoneState {
    return {
      rows: [...dz.rows],
      columns: [...dz.columns],
      values: [...dz.values],
      filters: [...dz.filters],
    };
  }

  return {
    getState(): DataExplorerState {
      return { ...state, dropZones: cloneDropZones(state.dropZones) };
    },

    setDataSource(id: string, fields: FieldMetadata[]): void {
      state = { dataSourceId: id, fields: [...fields], dropZones: createDropZoneState() };
      undoStack.length = 0;
      redoStack = [];
      notify();
    },

    autoPlaceField(field: FieldMetadata): void {
      const zone = autoPlaceField(field) as ZoneName;
      pushUndo();
      state = { ...state, dropZones: addFieldToZone(state.dropZones, zone, field) };
      notify();
    },

    addToZone(zone: ZoneName, field: FieldMetadata): void {
      pushUndo();
      state = { ...state, dropZones: addFieldToZone(state.dropZones, zone, field) };
      notify();
    },

    removeFromZone(zone: ZoneName, fieldName: string): void {
      pushUndo();
      state = { ...state, dropZones: removeFieldFromZone(state.dropZones, zone, fieldName) };
      notify();
    },

    toQuery(): ExploreQuery {
      return toExploreQuery(state.dropZones);
    },

    suggestChart(): string {
      return suggestChartType(toExploreQuery(state.dropZones));
    },

    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },

    undo(): void {
      if (undoStack.length === 0) return;
      redoStack.push(cloneDropZones(state.dropZones));
      state = { ...state, dropZones: undoStack.pop()! };
      notify();
    },

    redo(): void {
      if (redoStack.length === 0) return;
      undoStack.push(cloneDropZones(state.dropZones));
      state = { ...state, dropZones: redoStack.pop()! };
      notify();
    },

    canUndo(): boolean {
      return undoStack.length > 0;
    },

    canRedo(): boolean {
      return redoStack.length > 0;
    },
  };
}
