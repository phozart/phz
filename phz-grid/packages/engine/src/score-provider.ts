/**
 * @phozart/engine — Default Score Provider
 *
 * Built-in KPIScoreProvider that computes KPI values from raw data.
 * Supports real historical data for previousValue, trend, and breakdowns.
 * Falls back to synthetic estimates when real data is unavailable.
 */

import type { KPIId } from './types.js';
import type { KPIDefinition, KPIBreakdownScore } from './kpi.js';
import type { KPIScoreProvider } from './widget-resolver.js';
import { computeAggregation } from './aggregation.js';

export interface ScoreProviderConfig {
  /** Previous period raw data — used to compute real previousValue */
  previousPeriodData?: Record<string, unknown>[];
  /** Array of period snapshots — each entry is a set of rows for that period, used for real trend */
  trendPeriods?: Record<string, unknown>[][];
}

/**
 * Create a default score provider that computes KPI scores from raw data.
 *
 * When config provides previousPeriodData or trendPeriods, real values are used.
 * Otherwise, synthetic estimates are generated and flagged with estimated: true.
 */
export function createDefaultScoreProvider(config?: ScoreProviderConfig): KPIScoreProvider {
  const hasPreviousData = !!config?.previousPeriodData && config.previousPeriodData.length > 0;
  const hasTrendData = !!config?.trendPeriods && config.trendPeriods.length > 0;

  return (kpiId: KPIId, data: Record<string, unknown>[], kpiDef: KPIDefinition) => {
    const field = kpiId as string;
    const value = (computeAggregation(data, field, 'avg') as number) ?? 0;

    // Previous value: real or synthetic
    let previousValue: number;
    if (hasPreviousData) {
      previousValue = (computeAggregation(config!.previousPeriodData!, field, 'avg') as number) ?? 0;
    } else {
      previousValue = value * 0.95;
    }

    // Trend data: real or synthetic
    let trendData: number[];
    if (hasTrendData) {
      trendData = config!.trendPeriods!.map(periodRows =>
        (computeAggregation(periodRows, field, 'avg') as number) ?? 0,
      );
    } else {
      trendData = [];
      const base = value * 0.88;
      const step = (value - base) / 11;
      for (let i = 0; i < 12; i++) {
        const noise = (i % 3 === 0 ? -1 : i % 3 === 1 ? 0.5 : 0) * step * 0.3;
        trendData.push(Math.round((base + step * i + noise) * 100) / 100);
      }
    }

    // Breakdowns
    let breakdowns: KPIBreakdownScore[] | undefined;
    const dimField = kpiDef.breakdownDimensions?.[0] ?? (kpiDef.breakdowns ? kpiDef.dimensions?.[0] : undefined);

    if (dimField && kpiDef.breakdowns) {
      const groups = new Map<string, Record<string, unknown>[]>();
      for (const row of data) {
        const key = String(row[dimField] ?? '').toLowerCase();
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(row);
      }

      // Group previous period data for real breakdown previousValues
      let prevGroups: Map<string, Record<string, unknown>[]> | undefined;
      if (hasPreviousData) {
        prevGroups = new Map<string, Record<string, unknown>[]>();
        for (const row of config!.previousPeriodData!) {
          const key = String(row[dimField] ?? '').toLowerCase();
          if (!prevGroups.has(key)) prevGroups.set(key, []);
          prevGroups.get(key)!.push(row);
        }
      }

      breakdowns = kpiDef.breakdowns.map(bd => {
        const groupRows = groups.get(bd.id.toLowerCase()) ?? [];
        const bdValue = groupRows.length > 0
          ? (computeAggregation(groupRows, field, 'avg') as number) ?? 0
          : 0;

        let bdPreviousValue: number;
        if (prevGroups) {
          const prevRows = prevGroups.get(bd.id.toLowerCase()) ?? [];
          bdPreviousValue = prevRows.length > 0
            ? (computeAggregation(prevRows, field, 'avg') as number) ?? 0
            : 0;
        } else {
          bdPreviousValue = bdValue * 0.95;
        }

        return {
          breakdownId: bd.id,
          value: bdValue,
          previousValue: bdPreviousValue,
        };
      });
    }

    const estimated = !hasPreviousData && !hasTrendData;
    return { value, previousValue, trendData, breakdowns, estimated };
  };
}
