/**
 * W.6 — Data Source Panel Enhancement
 *
 * Source type icons, refresh status badges, three-option data source picker,
 * and display property formatting.
 */
/** @deprecated Use getSourceTypeIconSvg() for SVG icons */
export declare const SOURCE_TYPE_ICONS: Record<string, string>;
/**
 * Get SVG icon markup for a data source type.
 * Returns a complete inline <svg> element string.
 */
export declare function getSourceTypeIconSvg(sourceType: string, size?: number, color?: string): string;
export type FreshnessStatus = 'fresh' | 'stale' | 'unknown';
export interface RefreshBadge {
    label: string;
    variant: FreshnessStatus;
    bgColor: string;
    textColor: string;
}
export declare function getRefreshBadge(status: FreshnessStatus): RefreshBadge;
export interface DataSourcePickerOption {
    id: string;
    label: string;
    description: string;
    icon: string;
}
export declare const DATA_SOURCE_PICKER_OPTIONS: DataSourcePickerOption[];
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
export declare function getSourceDisplayProps(source: SourceInfo): SourceDisplayProps;
//# sourceMappingURL=data-source-panel.d.ts.map