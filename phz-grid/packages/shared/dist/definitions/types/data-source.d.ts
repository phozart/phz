/**
 * Definition Data Source — discriminated union of data source types.
 */
export type DefinitionDataSource = LocalDataSource | UrlDataSource | DataProductDataSource | DuckDBQueryDataSource;
export interface LocalDataSource {
    type: 'local';
    data: unknown[];
}
export interface UrlDataSource {
    type: 'url';
    url: string;
    method?: 'GET' | 'POST';
    headers?: Record<string, string>;
    dataPath?: string;
}
export interface DataProductDataSource {
    type: 'data-product';
    dataProductId: string;
    queryOverride?: string;
}
export interface DuckDBQueryDataSource {
    type: 'duckdb-query';
    sql: string;
    parameterized?: boolean;
    connectionKey?: string;
}
//# sourceMappingURL=data-source.d.ts.map