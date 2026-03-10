/**
 * @phozart/phz-engine — Status Engine
 *
 * Core classification: given a value and a KPI definition, compute status and delta.
 */

import type { StatusLevel } from './types.js';
import type { KPIDefinition, KPIScoreResponse, KPIBreakdownScore } from './kpi.js';
import type { ThresholdBand } from './expression-types.js';

export interface StatusResult {
  level: StatusLevel;
  color: string;
  label: string;
  icon: 'circle' | 'diamond' | 'triangle';
}

export interface Delta {
  value: number;
  direction: 'improving' | 'declining';
  unit: string;
}

export interface ClassifiedBreakdown {
  breakdownId: string;
  value: number;
  previousValue?: number;
  status: StatusResult;
  delta?: Delta;
}

export interface ClassifiedScore {
  kpiId: string;
  value: number;
  status: StatusResult;
  delta?: Delta;
  breakdowns?: ClassifiedBreakdown[];
}

export const STATUS_COLORS: Record<StatusLevel, string> = {
  ok: '#16A34A',
  warn: '#D97706',
  crit: '#DC2626',
  unknown: '#A8A29E',
};

export const STATUS_ICONS: Record<StatusLevel, 'circle' | 'diamond' | 'triangle'> = {
  ok: 'circle',
  warn: 'diamond',
  crit: 'triangle',
  unknown: 'circle',
};

const STATUS_LABELS: Record<StatusLevel, string> = {
  ok: 'On Track',
  warn: 'At Risk',
  crit: 'Critical',
  unknown: 'Unknown',
};

/**
 * Compute the status level for a value given a KPI definition.
 *
 * higher_is_better: value >= ok → ok, value >= warn → warn, else → crit
 * lower_is_better: value <= ok → ok, value <= warn → warn, else → crit
 */
/**
 * Resolve a threshold band's upTo value given parameter and metric values.
 */
export function resolveThresholdValue(
  source: ThresholdBand['upTo'],
  paramValues?: Record<string, unknown>,
  metricValues?: Record<string, number | null>,
): number | null {
  switch (source.type) {
    case 'static':
      return source.value ?? null;
    case 'parameter':
      if (source.parameterId && paramValues) {
        const v = paramValues[source.parameterId];
        return typeof v === 'number' ? v : null;
      }
      return null;
    case 'metric':
      if (source.metricId && metricValues) {
        return metricValues[source.metricId] ?? null;
      }
      return null;
    default:
      return null;
  }
}

/**
 * Compute status using custom threshold bands.
 * Bands must be ordered from lowest upTo to highest.
 * The value falls into the first band where value <= resolvedUpTo.
 */
export function computeStatusFromBands(
  value: number,
  bands: ThresholdBand[],
  paramValues?: Record<string, unknown>,
  metricValues?: Record<string, number | null>,
): StatusResult {
  for (const band of bands) {
    const upTo = resolveThresholdValue(band.upTo, paramValues, metricValues);
    if (upTo !== null && value <= upTo) {
      return {
        level: 'ok', // Bands provide their own label/color, level is informational
        color: band.color,
        label: band.label,
        icon: 'circle',
      };
    }
  }
  // Value exceeds all bands — use last band's label/color
  if (bands.length > 0) {
    const last = bands[bands.length - 1];
    return { level: 'ok', color: last.color, label: last.label, icon: 'circle' };
  }
  return { level: 'unknown', color: STATUS_COLORS.unknown, label: STATUS_LABELS.unknown, icon: 'circle' };
}

export function computeStatus(
  value: number | null | undefined,
  kpi: KPIDefinition,
  paramValues?: Record<string, unknown>,
  metricValues?: Record<string, number | null>,
): StatusResult {
  if (value === null || value === undefined || isNaN(value)) {
    return { level: 'unknown', color: STATUS_COLORS.unknown, label: STATUS_LABELS.unknown, icon: 'circle' };
  }

  // Use custom bands when present
  if (kpi.bands && kpi.bands.length > 0) {
    return computeStatusFromBands(value, kpi.bands, paramValues, metricValues);
  }

  let level: StatusLevel;

  if (kpi.direction === 'higher_is_better') {
    if (value >= kpi.thresholds.ok) level = 'ok';
    else if (value >= kpi.thresholds.warn) level = 'warn';
    else level = 'crit';
  } else {
    // lower_is_better: lower values are better
    if (value <= kpi.thresholds.ok) level = 'ok';
    else if (value <= kpi.thresholds.warn) level = 'warn';
    else level = 'crit';
  }

  return {
    level,
    color: STATUS_COLORS[level],
    label: STATUS_LABELS[level],
    icon: STATUS_ICONS[level],
  };
}

/**
 * Compute delta between current and previous values.
 */
export function computeDelta(
  current: number,
  previous: number,
  kpi: KPIDefinition,
): Delta {
  const diff = current - previous;
  const unit = kpi.deltaUnit ?? (kpi.unit === 'percent' ? 'pp' : 'abs');

  // Determine if the change is improving based on direction
  let improving: boolean;
  if (kpi.direction === 'higher_is_better') {
    improving = diff >= 0;
  } else {
    improving = diff <= 0;
  }

  return {
    value: diff,
    direction: improving ? 'improving' : 'declining',
    unit,
  };
}

/**
 * Classify a full KPI score response: applies status + delta to overall and each breakdown.
 */
export function classifyKPIScore(score: KPIScoreResponse, kpi: KPIDefinition): ClassifiedScore {
  const status = computeStatus(score.value, kpi);

  let delta: Delta | undefined;
  if (score.previousValue !== undefined) {
    delta = computeDelta(score.value, score.previousValue, kpi);
  }

  let breakdowns: ClassifiedBreakdown[] | undefined;
  if (score.breakdowns && kpi.breakdowns) {
    breakdowns = score.breakdowns.map(bs => {
      const kpiBreakdown = kpi.breakdowns?.find(b => b.id === bs.breakdownId);

      // Use per-breakdown threshold overrides if defined
      const effectiveKpi = kpiBreakdown?.thresholdOverrides
        ? {
            ...kpi,
            thresholds: {
              ok: kpiBreakdown.thresholdOverrides.ok ?? kpi.thresholds.ok,
              warn: kpiBreakdown.thresholdOverrides.warn ?? kpi.thresholds.warn,
            },
            target: kpiBreakdown.targetOverride ?? kpi.target,
          }
        : kpi;

      const bStatus = computeStatus(bs.value, effectiveKpi);
      let bDelta: Delta | undefined;
      if (bs.previousValue !== undefined) {
        bDelta = computeDelta(bs.value, bs.previousValue, effectiveKpi);
      }

      return {
        breakdownId: bs.breakdownId,
        value: bs.value,
        previousValue: bs.previousValue,
        status: bStatus,
        delta: bDelta,
      };
    });
  }

  return {
    kpiId: score.kpiId,
    value: score.value,
    status,
    delta,
    breakdowns,
  };
}
