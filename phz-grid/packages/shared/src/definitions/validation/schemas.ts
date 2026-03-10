/**
 * Zod schemas for all definition types.
 */

import { z } from 'zod';

export const DefinitionIdentitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  schemaVersion: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string().optional(),
});

export const LocalDataSourceSchema = z.object({
  type: z.literal('local'),
  data: z.array(z.unknown()),
});

export const UrlDataSourceSchema = z.object({
  type: z.literal('url'),
  url: z.string().min(1),
  method: z.enum(['GET', 'POST']).optional(),
  headers: z.record(z.string()).optional(),
  dataPath: z.string().optional(),
});

export const DataProductDataSourceSchema = z.object({
  type: z.literal('data-product'),
  dataProductId: z.string().min(1),
  queryOverride: z.string().optional(),
});

export const DuckDBQueryDataSourceSchema = z.object({
  type: z.literal('duckdb-query'),
  sql: z.string().min(1),
  parameterized: z.boolean().optional(),
  connectionKey: z.string().optional(),
});

export const DefinitionDataSourceSchema = z.discriminatedUnion('type', [
  LocalDataSourceSchema,
  UrlDataSourceSchema,
  DataProductDataSourceSchema,
  DuckDBQueryDataSourceSchema,
]);

export const DefinitionColumnSpecSchema = z.object({
  field: z.string().min(1),
  header: z.string().optional(),
  type: z.enum(['string', 'number', 'boolean', 'date', 'custom']).optional(),
  width: z.number().positive().optional(),
  minWidth: z.number().positive().optional(),
  maxWidth: z.number().positive().optional(),
  sortable: z.boolean().optional(),
  filterable: z.boolean().optional(),
  editable: z.boolean().optional(),
  resizable: z.boolean().optional(),
  frozen: z.enum(['left', 'right']).nullable().optional(),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  visible: z.boolean().optional(),
});

export const DefinitionDefaultsSchema = z.object({
  sort: z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc']),
  }).optional(),
  filters: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.unknown(),
  })).optional(),
  groupBy: z.array(z.string()).optional(),
  columnOrder: z.array(z.string()).optional(),
  columnVisibility: z.record(z.boolean()).optional(),
  columnWidths: z.record(z.number()).optional(),
}).optional();

export const DefinitionBehaviorSchema = z.object({
  density: z.enum(['compact', 'comfortable', 'spacious']).optional(),
  editMode: z.enum(['none', 'click', 'dblclick', 'manual']).optional(),
  selectionMode: z.enum(['none', 'single', 'multi', 'range']).optional(),
  enableVirtualization: z.boolean().optional(),
  enableGrouping: z.boolean().optional(),
  enableColumnResize: z.boolean().optional(),
  enableColumnReorder: z.boolean().optional(),
  showToolbar: z.boolean().optional(),
  showPagination: z.boolean().optional(),
  pageSize: z.number().positive().optional(),
}).optional();

export const DefinitionAccessSchema = z.object({
  visibility: z.enum(['public', 'private', 'role-restricted']).optional(),
  allowedRoles: z.array(z.string()).optional(),
  owner: z.string().optional(),
}).optional();

export const GridDefinitionSchema = DefinitionIdentitySchema.extend({
  dataSource: DefinitionDataSourceSchema,
  columns: z.array(DefinitionColumnSpecSchema),
  defaults: DefinitionDefaultsSchema,
  formatting: z.object({
    conditionalRules: z.array(z.object({
      field: z.string(),
      condition: z.string(),
      value: z.unknown(),
      style: z.record(z.string()),
    })).optional(),
    tableSettings: z.record(z.unknown()).optional(),
  }).optional(),
  behavior: DefinitionBehaviorSchema,
  views: z.object({
    views: z.array(z.object({
      id: z.string(),
      name: z.string(),
      isDefault: z.boolean().optional(),
      state: z.record(z.unknown()),
      createdAt: z.string(),
      updatedAt: z.string(),
    })),
    defaultViewId: z.string().optional(),
  }).optional(),
  access: DefinitionAccessSchema,
  metadata: z.record(z.unknown()).optional(),
});
