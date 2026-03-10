/**
 * @phozart/phz-engine — Data Product Registry
 *
 * Data products are the foundational data entities in the BI engine.
 * Each data product has a schema describing its fields.
 */
import type { ColumnType } from '@phozart/phz-core';
import type { DataProductId, ValidationResult } from './types.js';
export interface DataProductField {
    name: string;
    type: ColumnType;
    description?: string;
    nullable?: boolean;
}
export interface DataProductSchema {
    fields: DataProductField[];
}
export interface DataProductDef {
    id: DataProductId;
    name: string;
    description?: string;
    owner?: string;
    schema: DataProductSchema;
    tags?: string[];
}
export interface DataProductRegistry {
    register(product: DataProductDef): void;
    unregister(id: DataProductId): void;
    get(id: DataProductId): DataProductDef | undefined;
    list(): DataProductDef[];
    search(query: string): DataProductDef[];
    getSchema(id: DataProductId): DataProductSchema | undefined;
    validate(product: Partial<DataProductDef>): ValidationResult;
}
export declare function createDataProductRegistry(): DataProductRegistry;
//# sourceMappingURL=data-product.d.ts.map