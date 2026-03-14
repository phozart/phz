/**
 * @phozart/engine — Widget Data Processor
 *
 * Pipeline: filter → group by category → aggregate measures → sort → limit (with "Others" grouping).
 * Pure functions, no DOM dependency.
 */
import type { WidgetDataConfig } from './widget-config-enhanced.js';
export interface ProcessedRow {
    label: string;
    values: Record<string, number | null>;
    children?: ProcessedRow[];
}
export interface ProcessedWidgetData {
    rows: ProcessedRow[];
    totals?: Record<string, number | null>;
}
export declare function processWidgetData(rows: Record<string, unknown>[], dataConfig: WidgetDataConfig): ProcessedWidgetData;
//# sourceMappingURL=widget-data-processor.d.ts.map