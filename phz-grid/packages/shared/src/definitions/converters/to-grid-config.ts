/**
 * Convert a GridDefinition to a GridConfig for createGrid().
 */

import type { GridConfig, ColumnDefinition } from '@phozart/core';
import type { GridDefinition } from '../types/grid-definition.js';
import type { DefinitionColumnSpec } from '../types/column.js';

export interface ToGridConfigOptions {
  userRole?: string;
}

function columnSpecToDefinition(spec: DefinitionColumnSpec): ColumnDefinition {
  return {
    field: spec.field,
    header: spec.header,
    type: spec.type,
    width: spec.width,
    minWidth: spec.minWidth,
    maxWidth: spec.maxWidth,
    sortable: spec.sortable,
    filterable: spec.filterable,
    editable: spec.editable,
    resizable: spec.resizable,
    frozen: spec.frozen,
    priority: spec.priority,
  };
}

export function definitionToGridConfig(def: GridDefinition, options?: ToGridConfigOptions): GridConfig {
  const columns = def.columns.map(columnSpecToDefinition);

  const config: GridConfig = {
    data: def.dataSource.type === 'local' ? def.dataSource.data : [],
    columns,
    userRole: options?.userRole as import('@phozart/core').UserRole | undefined,
  };

  if (def.defaults?.sort) {
    config.initialState = {
      ...config.initialState,
      sort: { columns: [{ field: def.defaults.sort.field, direction: def.defaults.sort.direction ?? 'asc' }] },
    };
  }

  if (def.behavior) {
    config.enableSelection = def.behavior.selectionMode !== 'none';
    config.enableEditing = def.behavior.editMode !== 'none';
    config.enableVirtualization = def.behavior.enableVirtualization;
  }

  return config;
}
