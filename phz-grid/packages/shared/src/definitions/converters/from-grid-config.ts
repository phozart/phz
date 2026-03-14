/**
 * Capture a GridConfig as a GridDefinition.
 */

import type { GridConfig, ColumnDefinition } from '@phozart/core';
import type { GridDefinition } from '../types/grid-definition.js';
import type { DefinitionColumnSpec } from '../types/column.js';
import { createDefinitionId } from '../types/identity.js';
import { CURRENT_SCHEMA_VERSION } from '../migration/versions.js';

export interface FromGridConfigMeta {
  name: string;
  description?: string;
  createdBy?: string;
}

function columnToSpec(col: ColumnDefinition): DefinitionColumnSpec {
  return {
    field: col.field,
    header: col.header,
    type: col.type,
    width: col.width,
    minWidth: col.minWidth,
    maxWidth: col.maxWidth,
    sortable: col.sortable,
    filterable: col.filterable,
    editable: col.editable,
    resizable: col.resizable,
    frozen: col.frozen,
    priority: col.priority,
  };
}

export function gridConfigToDefinition(
  config: GridConfig,
  meta: FromGridConfigMeta,
): GridDefinition {
  const now = new Date().toISOString();

  return {
    id: createDefinitionId(),
    name: meta.name,
    description: meta.description,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    createdBy: meta.createdBy,
    dataSource: { type: 'local', data: config.data },
    columns: (config.columns ?? []).map(columnToSpec),
    defaults: config.initialState?.sort?.columns?.[0]
      ? { sort: { field: config.initialState.sort.columns[0].field, direction: config.initialState.sort.columns[0].direction ?? 'asc' } }
      : undefined,
    behavior: {
      selectionMode: config.enableSelection ? 'multi' : 'none',
      editMode: config.enableEditing ? 'dblclick' : 'none',
      enableVirtualization: config.enableVirtualization,
    },
  };
}
