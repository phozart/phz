/**
 * @phozart/workspace — DuckDB DataAdapter Utilities
 *
 * SQL generation helpers that map DataQuery/DataAdapter types to DuckDB SQL.
 * Uses parameterized queries throughout — never interpolates values.
 *
 * The actual DuckDB connection is injected at runtime via @phozart/duckdb
 * (optional peer dependency).
 */
import type { DataQuery, FieldMetadata, SemanticHint, WindowSpec } from '../data-adapter.js';
export declare function mapDuckDBTypeToDataType(duckType: string): FieldMetadata['dataType'];
export declare function inferSemanticHint(fieldName: string, dataType: FieldMetadata['dataType']): SemanticHint | undefined;
export declare function mapColumnSchemaToFieldMetadata(col: {
    name: string;
    type: string;
    nullable: boolean;
}): FieldMetadata;
export declare function buildAggregationSelectSQL(field: string, fn: string, alias?: string): string;
export declare function buildWindowFunctionSQL(spec: WindowSpec): string;
export interface SqlResult {
    sql: string;
    params: unknown[];
}
export declare function buildDataAdapterQuery(query: DataQuery): SqlResult;
//# sourceMappingURL=duckdb-data-adapter.d.ts.map