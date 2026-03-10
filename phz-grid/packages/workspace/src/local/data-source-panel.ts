/**
 * W.6 — Data Source Panel Enhancement
 *
 * Source type icons, refresh status badges, three-option data source picker,
 * and display property formatting.
 */

// ========================================================================
// Source Type Icons
// ========================================================================

import { SOURCE_ICONS, icon, type IconName } from '../styles/icons.js';

/** @deprecated Use getSourceTypeIconSvg() for SVG icons */
export const SOURCE_TYPE_ICONS: Record<string, string> = {
  csv: '\u2630',
  excel: '\u2637',
  parquet: '\u25A6',
  json: '\u007B\u007D',
  database: '\u2699',
  api: '\u2194',
};

/**
 * Get SVG icon markup for a data source type.
 * Returns a complete inline <svg> element string.
 */
export function getSourceTypeIconSvg(
  sourceType: string,
  size: number = 20,
  color: string = 'currentColor',
): string {
  const iconName = SOURCE_ICONS[sourceType] as IconName | undefined;
  return iconName ? icon(iconName, size, color) : icon('sourceDatabase', size, color);
}

// ========================================================================
// Refresh Badge
// ========================================================================

export type FreshnessStatus = 'fresh' | 'stale' | 'unknown';

export interface RefreshBadge {
  label: string;
  variant: FreshnessStatus;
  bgColor: string;
  textColor: string;
}

const REFRESH_BADGES: Record<FreshnessStatus, RefreshBadge> = {
  fresh: { label: 'Fresh', variant: 'fresh', bgColor: '#D1FAE5', textColor: '#065F46' },
  stale: { label: 'Stale', variant: 'stale', bgColor: '#FEF3C7', textColor: '#92400E' },
  unknown: { label: 'Unknown', variant: 'unknown', bgColor: '#F5F5F4', textColor: '#57534E' },
};

export function getRefreshBadge(status: FreshnessStatus): RefreshBadge {
  return REFRESH_BADGES[status];
}

// ========================================================================
// Data Source Picker Options
// ========================================================================

export interface DataSourcePickerOption {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export const DATA_SOURCE_PICKER_OPTIONS: DataSourcePickerOption[] = [
  {
    id: 'upload',
    label: 'Upload File',
    description: 'Import CSV, Excel, Parquet, or JSON files',
    icon: '\u21E7',
  },
  {
    id: 'connect',
    label: 'Connect to Data',
    description: 'Connect to a database or API endpoint',
    icon: '\u2194',
  },
  {
    id: 'sample',
    label: 'Sample Data',
    description: 'Start with a built-in sample dataset',
    icon: '\u2605',
  },
];

// ========================================================================
// Source Display Props
// ========================================================================

export interface SourceInfo {
  id: string;
  name: string;
  sourceType: string;
  rowCount?: number;
  freshnessStatus?: FreshnessStatus;
}

export interface SourceDisplayProps {
  icon: string;
  displayName: string;
  formattedRowCount: string;
  badge?: RefreshBadge;
}

export function getSourceDisplayProps(source: SourceInfo): SourceDisplayProps {
  const icon = SOURCE_TYPE_ICONS[source.sourceType] ?? '\u25A0';
  const formattedRowCount = source.rowCount !== undefined
    ? `${source.rowCount.toLocaleString()} rows`
    : 'Unknown rows';
  const badge = source.freshnessStatus
    ? getRefreshBadge(source.freshnessStatus)
    : undefined;

  return {
    icon,
    displayName: source.name,
    formattedRowCount,
    badge,
  };
}
