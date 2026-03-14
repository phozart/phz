/**
 * @phozart/shared — Grid Definitions as First-Class Artifacts (A-1.04)
 *
 * Enables grids to be saved, cataloged, and navigated to just like
 * reports and dashboards. A GridArtifact wraps the grid configuration
 * with artifact metadata.
 *
 * Extracted from workspace/navigation/grid-artifact.ts.
 */

import type { ArtifactType } from './artifact-visibility.js';

// ========================================================================
// ArtifactMeta — minimal catalog entry
// ========================================================================

export interface ArtifactMeta {
  id: string;
  type: ArtifactType;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  published?: boolean;
}

// ========================================================================
// GridColumnConfig
// ========================================================================

export interface GridColumnConfig {
  field: string;
  header?: string;
  width?: number;
  visible?: boolean;
  sortable?: boolean;
  filterable?: boolean;
}

// ========================================================================
// GridArtifact
// ========================================================================

export interface GridArtifact {
  id: string;
  type: 'grid-definition';
  name: string;
  description?: string;
  dataSourceId: string;
  columns: GridColumnConfig[];
  defaultSort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  defaultFilters?: Record<string, unknown>;
  density?: 'compact' | 'dense' | 'comfortable';
  enableGrouping?: boolean;
  enableExport?: boolean;
  createdAt: number;
  updatedAt: number;
}

// ========================================================================
// Type guard
// ========================================================================

export function isGridArtifact(obj: unknown): obj is GridArtifact {
  if (obj == null || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    o.type === 'grid-definition' &&
    typeof o.name === 'string' &&
    typeof o.dataSourceId === 'string' &&
    Array.isArray(o.columns)
  );
}

// ========================================================================
// Factory
// ========================================================================

let counter = 0;
function generateId(): string {
  return `grid_${Date.now()}_${++counter}`;
}

export function createGridArtifact(
  input: Omit<GridArtifact, 'id' | 'type' | 'createdAt' | 'updatedAt'> & { id?: string },
): GridArtifact {
  const now = Date.now();
  return {
    id: input.id ?? generateId(),
    type: 'grid-definition',
    name: input.name,
    description: input.description,
    dataSourceId: input.dataSourceId,
    columns: [...input.columns],
    defaultSort: input.defaultSort ? [...input.defaultSort] : undefined,
    defaultFilters: input.defaultFilters ? { ...input.defaultFilters } : undefined,
    density: input.density,
    enableGrouping: input.enableGrouping,
    enableExport: input.enableExport,
    createdAt: now,
    updatedAt: now,
  };
}

// ========================================================================
// Convert to ArtifactMeta (for catalog)
// ========================================================================

export function gridArtifactToMeta(artifact: GridArtifact): ArtifactMeta {
  return {
    id: artifact.id,
    type: 'grid-definition' satisfies ArtifactType,
    name: artifact.name,
    description: artifact.description,
    createdAt: artifact.createdAt,
    updatedAt: artifact.updatedAt,
  };
}
