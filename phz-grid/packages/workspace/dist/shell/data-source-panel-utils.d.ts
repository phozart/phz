/**
 * @phozart/phz-workspace — Data Source Panel Utils (L.16)
 *
 * Types and utility functions for the data source panel UI.
 */
export interface DataSourceEntry {
    id: string;
    name: string;
    type: 'file' | 'url' | 'api' | 'server';
    rowCount?: number;
    lastUpdated?: number;
    status: 'connected' | 'error' | 'refreshing';
}
export declare function groupDataSourcesByType(entries: DataSourceEntry[]): Map<DataSourceEntry['type'], DataSourceEntry[]>;
export declare function getStatusIcon(status: DataSourceEntry['status']): string;
export declare function getTypeIcon(type: DataSourceEntry['type']): string;
//# sourceMappingURL=data-source-panel-utils.d.ts.map