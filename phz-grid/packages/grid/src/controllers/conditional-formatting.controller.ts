import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { RowData, RowId, ConditionalFormattingRule } from '@phozart/core';
import {
  createConditionalFormattingEngine,
  type ConditionalFormattingEngine,
  type ComputedCellStyle,
} from '../features/conditional-formatting.js';
import { detectAnomalies, type AnomalyResult } from '../features/anomaly-detector.js';

export interface ConditionalFormattingHost extends ReactiveControllerHost {
  visibleRows: RowData[];
}

export class ConditionalFormattingController implements ReactiveController {
  private host: ConditionalFormattingHost;

  readonly cfEngine: ConditionalFormattingEngine = createConditionalFormattingEngine();
  anomalies: Map<string, AnomalyResult[]> = new Map();
  private anomalyLookup = new Map<string, AnomalyResult>();

  constructor(host: ConditionalFormattingHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected(): void {}
  hostDisconnected(): void {}

  addFormattingRule(rule: ConditionalFormattingRule): void {
    this.cfEngine.addRule(rule);
    this.host.requestUpdate();
  }

  setRules(rules: ConditionalFormattingRule[]): void {
    this.cfEngine.clearRules();
    for (const rule of rules) {
      this.cfEngine.addRule(rule);
    }
    this.host.requestUpdate();
  }

  getCellConditionalStyle(value: unknown, field: string, row: RowData): ComputedCellStyle | null {
    return this.cfEngine.evaluate(value, field, row) ?? null;
  }

  runAnomalyDetection(field: string): void {
    const results = detectAnomalies(this.host.visibleRows, field);
    this.anomalies.set(field, results);
    this.rebuildAnomalyLookup();
    this.host.requestUpdate();
  }

  isAnomalous(rowId: RowId, field: string): boolean {
    const a = this.anomalyLookup.get(`${rowId}:${field}`);
    return a?.type === 'outlier';
  }

  getAnomalyResult(rowId: RowId, field: string): AnomalyResult | undefined {
    return this.anomalyLookup.get(`${rowId}:${field}`);
  }

  getAnomalies(): Map<string, AnomalyResult[]> {
    return this.anomalies;
  }

  private rebuildAnomalyLookup(): void {
    this.anomalyLookup.clear();
    for (const [field, results] of this.anomalies) {
      for (const a of results) {
        this.anomalyLookup.set(`${a.rowId}:${field}`, a);
      }
    }
  }
}
