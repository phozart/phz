/**
 * @phozart/engine/explorer — Field Palette Logic
 *
 * Headless logic for field palette: type icons, cardinality badges,
 * search/filter, group by type, and auto-placement.
 *
 * Moved from @phozart/workspace in v15 (A-2.01).
 */

import type { FieldMetadata } from '@phozart/shared/adapters';

// ========================================================================
// PaletteField — enriched view of FieldMetadata for UI
// ========================================================================

export interface PaletteField {
  name: string;
  dataType: FieldMetadata['dataType'];
  typeIcon: string;
  cardinalityBadge?: 'low' | 'medium' | 'high';
  semanticHint?: string;
  draggable: boolean;
}

export interface FieldPalette {
  fields: PaletteField[];
}

// ========================================================================
// Drop zone type
// ========================================================================

export type DropZoneType = 'rows' | 'columns' | 'values' | 'filters';

// ========================================================================
// createFieldPalette
// ========================================================================

export function createFieldPalette(fields: FieldMetadata[]): FieldPalette {
  return {
    fields: fields.map(f => ({
      name: f.name,
      dataType: f.dataType,
      typeIcon: f.dataType,
      cardinalityBadge: f.cardinality,
      semanticHint: f.semanticHint,
      draggable: true,
    })),
  };
}

// ========================================================================
// groupFieldsByType
// ========================================================================

export function groupFieldsByType(fields: FieldMetadata[]): Map<string, FieldMetadata[]> {
  const groups = new Map<string, FieldMetadata[]>();
  for (const field of fields) {
    let group = groups.get(field.dataType);
    if (!group) {
      group = [];
      groups.set(field.dataType, group);
    }
    group.push(field);
  }
  return groups;
}

// ========================================================================
// searchFields
// ========================================================================

export function searchFields(fields: FieldMetadata[], query: string): FieldMetadata[] {
  if (!query) return fields;
  const lower = query.toLowerCase();
  return fields.filter(f => f.name.toLowerCase().includes(lower));
}

// ========================================================================
// autoPlaceField — double-click auto-placement
// ========================================================================

export function autoPlaceField(field: FieldMetadata): DropZoneType {
  switch (field.dataType) {
    case 'number':
      return 'values';
    case 'date':
      return 'columns';
    case 'boolean':
      return 'filters';
    case 'string':
    default:
      return 'rows';
  }
}
