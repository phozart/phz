import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { RowData, RowId, ConditionalFormattingRule } from '@phozart/core';
import { type ConditionalFormattingEngine, type ComputedCellStyle } from '../features/conditional-formatting.js';
import { type AnomalyResult } from '../features/anomaly-detector.js';
export interface ConditionalFormattingHost extends ReactiveControllerHost {
    visibleRows: RowData[];
}
export declare class ConditionalFormattingController implements ReactiveController {
    private host;
    readonly cfEngine: ConditionalFormattingEngine;
    anomalies: Map<string, AnomalyResult[]>;
    private anomalyLookup;
    constructor(host: ConditionalFormattingHost);
    hostConnected(): void;
    hostDisconnected(): void;
    addFormattingRule(rule: ConditionalFormattingRule): void;
    setRules(rules: ConditionalFormattingRule[]): void;
    getCellConditionalStyle(value: unknown, field: string, row: RowData): ComputedCellStyle | null;
    runAnomalyDetection(field: string): void;
    isAnomalous(rowId: RowId, field: string): boolean;
    getAnomalyResult(rowId: RowId, field: string): AnomalyResult | undefined;
    getAnomalies(): Map<string, AnomalyResult[]>;
    private rebuildAnomalyLookup;
}
//# sourceMappingURL=conditional-formatting.controller.d.ts.map