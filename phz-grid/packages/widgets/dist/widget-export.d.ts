/**
 * @phozart/phz-widgets — Widget Export Utilities
 *
 * CSV generation, clipboard formatting, and image capture for widget data.
 */
export interface ExportColumn {
    key: string;
    label: string;
}
export declare function escapeCSVField(value: unknown): string;
export declare function exportToCSV(data: Record<string, unknown>[], columns: ExportColumn[], filename?: string): string;
export declare function formatClipboardData(data: Record<string, unknown>[], columns: ExportColumn[]): string;
export declare function exportToClipboard(data: Record<string, unknown>[], columns: ExportColumn[]): Promise<void>;
export declare function exportToImage(element: HTMLElement, filename?: string, format?: 'png' | 'svg'): Promise<void>;
//# sourceMappingURL=widget-export.d.ts.map