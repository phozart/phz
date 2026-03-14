/**
 * @phozart/workspace — Field Mapping Admin Logic (L.15)
 *
 * Builds a mapping table from DataSourceSchema[] for the field-mapping admin UI.
 */

import type { DataSourceSchema } from '../data-adapter.js';
import type { FieldMapping } from '../types.js';
import { autoSuggestMappings } from '../types.js';

export interface MappingTableRow {
  canonicalField: string;
  dataType: string;
  sources: Map<string, string>;
}

export function buildMappingTable(
  schemas: DataSourceSchema[],
  existingMappings?: FieldMapping[],
): MappingTableRow[] {
  const rows = new Map<string, MappingTableRow>();

  // Apply existing mappings first
  if (existingMappings) {
    for (const mapping of existingMappings) {
      const sourcesMap = new Map<string, string>();
      for (const s of mapping.sources) {
        sourcesMap.set(s.dataSourceId, s.field);
      }
      // Determine data type from any schema
      let dataType = 'string';
      for (const schema of schemas) {
        for (const s of mapping.sources) {
          if (schema.id === s.dataSourceId) {
            const f = schema.fields.find(field => field.name === s.field);
            if (f) dataType = f.dataType;
          }
        }
      }
      rows.set(mapping.canonicalField, {
        canonicalField: mapping.canonicalField,
        dataType,
        sources: sourcesMap,
      });
    }
  }

  // Auto-suggest mappings for fields that appear in multiple schemas
  const suggested = autoSuggestMappings(
    schemas.map(s => ({
      dataSourceId: s.id,
      fields: s.fields.map(f => ({ name: f.name, dataType: f.dataType })),
    })),
  );

  for (const mapping of suggested) {
    if (!rows.has(mapping.canonicalField)) {
      const sourcesMap = new Map<string, string>();
      for (const s of mapping.sources) {
        sourcesMap.set(s.dataSourceId, s.field);
      }
      const dataType = schemas
        .flatMap(s => s.fields)
        .find(f => f.name === mapping.canonicalField)?.dataType ?? 'string';
      rows.set(mapping.canonicalField, {
        canonicalField: mapping.canonicalField,
        dataType,
        sources: sourcesMap,
      });
    }
  }

  // Add remaining unmapped fields from each schema
  for (const schema of schemas) {
    for (const field of schema.fields) {
      if (!rows.has(field.name)) {
        const sourcesMap = new Map<string, string>();
        sourcesMap.set(schema.id, field.name);
        rows.set(field.name, {
          canonicalField: field.name,
          dataType: field.dataType,
          sources: sourcesMap,
        });
      } else {
        // Ensure this source is tracked
        const row = rows.get(field.name)!;
        if (!row.sources.has(schema.id)) {
          row.sources.set(schema.id, field.name);
        }
      }
    }
  }

  return Array.from(rows.values());
}
