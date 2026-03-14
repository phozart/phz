/**
 * @phozart/workspace — Data Source Panel Utils (L.16)
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

export function groupDataSourcesByType(
  entries: DataSourceEntry[],
): Map<DataSourceEntry['type'], DataSourceEntry[]> {
  const grouped = new Map<DataSourceEntry['type'], DataSourceEntry[]>();
  for (const entry of entries) {
    let list = grouped.get(entry.type);
    if (!list) {
      list = [];
      grouped.set(entry.type, list);
    }
    list.push(entry);
  }
  return grouped;
}

const STATUS_ICONS: Record<DataSourceEntry['status'], string> = {
  connected: 'check-circle',
  error: 'alert-circle',
  refreshing: 'refresh',
};

export function getStatusIcon(status: DataSourceEntry['status']): string {
  return STATUS_ICONS[status];
}

const TYPE_ICONS: Record<DataSourceEntry['type'], string> = {
  file: 'file',
  url: 'link',
  api: 'code',
  server: 'database',
};

export function getTypeIcon(type: DataSourceEntry['type']): string {
  return TYPE_ICONS[type];
}
