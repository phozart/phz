/**
 * @phozart/phz-workspace — Drop Zones Logic (P.2 + P.2a)
 *
 * 4 drop zones: Rows, Columns, Values, Filters
 * Aggregation defaults, cardinality warnings, validation.
 * Immutable state transitions.
 */
import type { FieldMetadata } from '../data-adapter.js';
import { type AggregationWarning } from '../format/format-value.js';
export interface DimensionEntry {
    field: string;
    dataType: FieldMetadata['dataType'];
}
export interface ValueEntry {
    field: string;
    dataType: FieldMetadata['dataType'];
    aggregation: string;
}
export interface FilterEntry {
    field: string;
    dataType: FieldMetadata['dataType'];
    operator: string;
    value: unknown;
}
export interface DropZoneState {
    rows: DimensionEntry[];
    columns: DimensionEntry[];
    values: ValueEntry[];
    filters: FilterEntry[];
}
export type ZoneName = 'rows' | 'columns' | 'values' | 'filters';
export declare function createDropZoneState(): DropZoneState;
export declare function getDefaultAggregation(dataType: FieldMetadata['dataType']): string;
export declare function addFieldToZone(state: DropZoneState, zone: ZoneName, field: FieldMetadata): DropZoneState;
export declare function removeFieldFromZone(state: DropZoneState, zone: ZoneName, fieldName: string): DropZoneState;
export declare function moveFieldBetweenZones(state: DropZoneState, fromZone: ZoneName, toZone: ZoneName, fieldName: string): DropZoneState;
export declare function getCardinalityWarning(fieldName: string, distinctCount: number, threshold?: number): string | null;
export declare function validateDropZoneAggregation(field: FieldMetadata, aggregation: string): AggregationWarning | null;
//# sourceMappingURL=phz-drop-zones.d.ts.map