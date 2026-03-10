/**
 * @phozart/phz-engine — KPI Definitions & Registry
 *
 * KPIs are first-class entities with targets, thresholds, status classification,
 * breakdowns, delta comparison, and visualization defaults.
 */

import type { KPIId, DataProductId, DashboardId, ReportId, MetricId, ValidationResult } from './types.js';
import type { DataProductRegistry } from './data-product.js';
import type { ThresholdBand } from './expression-types.js';

export type KPIUnit = 'percent' | 'count' | 'duration' | 'currency' | 'custom';
export type KPIDirection = 'higher_is_better' | 'lower_is_better';
export type KPIDeltaComparison = 'previous_period' | 'same_period_last_year' | 'target' | 'none';
export type KPICardStyle = 'compact' | 'expanded' | 'minimal';
export type KPIColorScheme = 'traffic' | 'sequential' | 'diverging';

export interface KPIThresholds {
  ok: number;
  warn: number;
}

export interface KPIBreakdown {
  id: string;
  label: string;
  shortLabel?: string;
  description?: string;
  targetOverride?: number;
  thresholdOverrides?: {
    ok?: number;
    warn?: number;
  };
}

export interface KPIDataSource {
  scoreEndpoint: string;
  trendEndpoint?: string;
  breakdownEndpoint?: string;
  detailEndpoint?: string;
}

export interface KPIAlertConfig {
  field: string;
  criticalThreshold?: number;
}

export interface KPIDefinition {
  id: KPIId;
  name: string;
  description?: string;
  category?: string;
  target: number;
  unit: KPIUnit;
  unitLabel?: string;
  direction: KPIDirection;
  thresholds: KPIThresholds;
  format?: string;
  colorScheme?: KPIColorScheme;
  deltaComparison: KPIDeltaComparison;
  deltaUnit?: string;
  dimensions: string[];
  breakdowns?: KPIBreakdown[];
  dashboardId?: DashboardId;
  drillDownReportId?: ReportId;
  dataSource: KPIDataSource;
  alerts?: KPIAlertConfig;
  sparkline?: { enabled: boolean; periods: number };
  trend?: { enabled: boolean; periods: number };
  breakdownDimensions?: string[];
  defaultCardStyle?: KPICardStyle;
  sortOrder?: number;
  permissions?: string[];
  /** Link KPI to a metric for data model integration */
  metricId?: MetricId;
  /** Custom threshold bands (overrides simple ok/warn when present) */
  bands?: ThresholdBand[];
}

/** Score response from API — per-breakdown values with optional trend */
export interface KPIScoreResponse {
  kpiId: KPIId;
  value: number;
  previousValue?: number;
  breakdowns?: KPIBreakdownScore[];
  trend?: number[];
}

export interface KPIBreakdownScore {
  breakdownId: string;
  value: number;
  previousValue?: number;
}

export interface KPIRegistry {
  register(kpi: KPIDefinition): void;
  get(id: KPIId): KPIDefinition | undefined;
  list(): KPIDefinition[];
  listByCategory(category: string): KPIDefinition[];
  remove(id: KPIId): void;
  validate(kpi: Partial<KPIDefinition>): ValidationResult;
  reorder(ids: KPIId[]): void;
}

export function createKPIRegistry(dataProducts?: DataProductRegistry): KPIRegistry {
  const kpis = new Map<KPIId, KPIDefinition>();
  let orderedIds: KPIId[] = [];

  return {
    register(kpi: KPIDefinition): void {
      kpis.set(kpi.id, kpi);
      if (!orderedIds.includes(kpi.id)) {
        orderedIds.push(kpi.id);
      }
    },

    get(id: KPIId): KPIDefinition | undefined {
      return kpis.get(id);
    },

    list(): KPIDefinition[] {
      return orderedIds
        .map(id => kpis.get(id))
        .filter((k): k is KPIDefinition => k !== undefined);
    },

    listByCategory(category: string): KPIDefinition[] {
      return this.list().filter(k => k.category === category);
    },

    remove(id: KPIId): void {
      kpis.delete(id);
      orderedIds = orderedIds.filter(i => i !== id);
    },

    validate(kpi: Partial<KPIDefinition>): ValidationResult {
      const errors: { path: string; message: string }[] = [];

      if (!kpi.id) errors.push({ path: 'id', message: 'ID is required' });
      if (!kpi.name) errors.push({ path: 'name', message: 'Name is required' });
      if (kpi.target === undefined) errors.push({ path: 'target', message: 'Target is required' });
      if (!kpi.unit) errors.push({ path: 'unit', message: 'Unit is required' });
      if (!kpi.direction) errors.push({ path: 'direction', message: 'Direction is required' });
      if (!kpi.thresholds) {
        errors.push({ path: 'thresholds', message: 'Thresholds are required' });
      } else {
        if (kpi.thresholds.ok === undefined) errors.push({ path: 'thresholds.ok', message: 'OK threshold is required' });
        if (kpi.thresholds.warn === undefined) errors.push({ path: 'thresholds.warn', message: 'Warn threshold is required' });
      }
      if (!kpi.dataSource) errors.push({ path: 'dataSource', message: 'Data source is required' });

      return { valid: errors.length === 0, errors };
    },

    reorder(ids: KPIId[]): void {
      orderedIds = ids.filter(id => kpis.has(id));
      // Append any registered KPIs not in the provided order
      for (const id of kpis.keys()) {
        if (!orderedIds.includes(id)) {
          orderedIds.push(id);
        }
      }
    },
  };
}
