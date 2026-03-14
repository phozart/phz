/**
 * @phozart/workspace — Field Mapping Admin Logic (L.15)
 *
 * Builds a mapping table from DataSourceSchema[] for the field-mapping admin UI.
 */
import type { DataSourceSchema } from '../data-adapter.js';
import type { FieldMapping } from '../types.js';
export interface MappingTableRow {
    canonicalField: string;
    dataType: string;
    sources: Map<string, string>;
}
export declare function buildMappingTable(schemas: DataSourceSchema[], existingMappings?: FieldMapping[]): MappingTableRow[];
//# sourceMappingURL=field-mapping-admin.d.ts.map