/**
 * @phozart/engine/explorer — Field Palette Logic
 *
 * Headless logic for field palette: type icons, cardinality badges,
 * search/filter, group by type, and auto-placement.
 *
 * Moved from @phozart/workspace in v15 (A-2.01).
 */
import type { FieldMetadata } from '@phozart/shared/adapters';
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
export type DropZoneType = 'rows' | 'columns' | 'values' | 'filters';
export declare function createFieldPalette(fields: FieldMetadata[]): FieldPalette;
export declare function groupFieldsByType(fields: FieldMetadata[]): Map<string, FieldMetadata[]>;
export declare function searchFields(fields: FieldMetadata[], query: string): FieldMetadata[];
export declare function autoPlaceField(field: FieldMetadata): DropZoneType;
//# sourceMappingURL=phz-field-palette.d.ts.map