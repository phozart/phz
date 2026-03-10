/**
 * @phozart/phz-engine — Window Functions
 *
 * Running totals, moving averages, rank, lag/lead, and row numbering.
 * All functions accept optional partitionBy for grouped windows.
 */
type Row = Record<string, unknown>;
export declare function runningSum<T extends Row>(data: T[], valueField: string, orderField?: string, partitionBy?: string): (T & {
    _runningSum: number;
})[];
export declare function runningAvg<T extends Row>(data: T[], valueField: string, orderField?: string, partitionBy?: string): (T & {
    _runningAvg: number;
})[];
export declare function movingAverage<T extends Row>(data: T[], valueField: string, windowSize: number, orderField?: string, partitionBy?: string): (T & {
    _movingAvg: number;
})[];
export declare function movingSum<T extends Row>(data: T[], valueField: string, windowSize: number, orderField?: string, partitionBy?: string): (T & {
    _movingSum: number;
})[];
export declare function rank<T extends Row>(data: T[], valueField: string, order?: 'asc' | 'desc', partitionBy?: string): (T & {
    _rank: number;
})[];
export declare function percentRank<T extends Row>(data: T[], valueField: string, partitionBy?: string): (T & {
    _percentRank: number;
})[];
export declare function lag<T extends Row>(data: T[], valueField: string, offset?: number, defaultValue?: unknown, partitionBy?: string): (T & {
    _lag: unknown;
})[];
export declare function lead<T extends Row>(data: T[], valueField: string, offset?: number, defaultValue?: unknown, partitionBy?: string): (T & {
    _lead: unknown;
})[];
export declare function rowNumber<T extends Row>(data: T[], orderField?: string, partitionBy?: string): (T & {
    _rowNumber: number;
})[];
export {};
//# sourceMappingURL=window-functions.d.ts.map