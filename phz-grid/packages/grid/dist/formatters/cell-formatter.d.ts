import type { ColumnDefinition } from '@phozart/core';
export interface CellFormatOptions {
    numberFormats: Record<string, {
        decimals?: number;
        display?: 'number' | 'percent' | 'currency';
        prefix?: string;
        suffix?: string;
    }>;
    dateFormats: Record<string, string>;
    compactNumbers: boolean;
    locale: string;
}
export declare function formatCellValue(value: unknown, col: ColumnDefinition, opts: CellFormatOptions): string;
//# sourceMappingURL=cell-formatter.d.ts.map