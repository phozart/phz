/**
 * @phozart/workspace — Core Types
 */

import type { LayoutNode } from './schema/config-layers.js';
import type { DataQuery } from './data-adapter.js';
import type { ArtifactEndorsement } from './govern/certification-state.js';
import type {
  FieldMappingEntry as _FieldMappingEntry,
  DetailTrigger as _DetailTrigger,
  FieldMapping as _FieldMapping,
} from '@phozart/shared/coordination';
import type {
  FilterDefault as _FilterDefault,
  FilterValueTransform as _FilterValueTransform,
} from '@phozart/shared/types';

// Re-export branded IDs from engine
export type {
  KPIId, MetricId, ReportId, DashboardId, WidgetId, DataProductId,
} from '@phozart/engine';
export {
  kpiId, metricId, reportId, dashboardId, widgetId, dataProductId,
} from '@phozart/engine';

// Re-export definition identity
export type { DefinitionId } from '@phozart/shared/definitions';

// --- Workspace-specific branded types ---
export type PlacementId = string & { readonly __brand: 'PlacementId' };
export function placementId(id: string): PlacementId { return id as PlacementId; }

// --- Artifact types ---
export type ArtifactType = 'report' | 'dashboard' | 'kpi' | 'metric' | 'grid-definition' | 'filter-preset' | 'alert-rule' | 'subscription' | 'filter-definition' | 'filter-rule';

export interface ArtifactMeta {
  id: string;
  type: ArtifactType;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  published?: boolean;
  endorsement?: ArtifactEndorsement;
}

export interface ArtifactFilter {
  type?: ArtifactType;
  search?: string;
  published?: boolean;
}

export interface PlacementFilter {
  artifactId?: string;
  artifactType?: ArtifactType;
  target?: string;
}

// --- Widget Manifest types ---

export type InteractionType = 'drill-through' | 'cross-filter' | 'export-csv' | 'export-png' | 'click-detail';

export interface WidgetSizeBounds {
  cols: number;
  rows: number;
}

export interface FieldRequirement {
  name: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  role: 'measure' | 'dimension' | 'category' | 'time';
  required: boolean;
}

export interface WidgetVariant {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  presetConfig: Record<string, unknown>;
}

export interface WidgetResponsiveBehavior {
  compactBelow: number;
  compactBehavior: {
    hideLegend?: boolean;
    hideAxisLabels?: boolean;
    hideDataLabels?: boolean;
    simplifyToSingleValue?: boolean;
    collapseToSummary?: boolean;
  };
  minimalBelow?: number;
  minAspectRatio?: number;
  maxAspectRatio?: number;
}

export interface WidgetManifest {
  type: string;
  category: string;
  name: string;
  description: string;
  thumbnail?: string;
  requiredFields: FieldRequirement[];
  supportedAggregations: string[];
  minSize: WidgetSizeBounds;
  preferredSize: WidgetSizeBounds;
  maxSize: WidgetSizeBounds;
  supportedInteractions: InteractionType[];
  configSchema?: unknown;
  variants: WidgetVariant[];
  load?: () => Promise<{ render(config: unknown, container: HTMLElement, context: unknown): void; update?(config: unknown, context: unknown): void; destroy?(): void }>;
  responsiveBehavior?: WidgetResponsiveBehavior;
}

export function isWidgetManifest(obj: unknown): obj is WidgetManifest {
  if (obj == null || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.type === 'string' &&
    typeof o.category === 'string' &&
    typeof o.name === 'string' &&
    typeof o.description === 'string' &&
    Array.isArray(o.requiredFields) &&
    Array.isArray(o.supportedAggregations) &&
    o.minSize != null && typeof o.minSize === 'object' &&
    o.preferredSize != null && typeof o.preferredSize === 'object' &&
    o.maxSize != null && typeof o.maxSize === 'object' &&
    Array.isArray(o.supportedInteractions) &&
    Array.isArray(o.variants)
  );
}

export function validateWidgetSizeBounds(
  min: WidgetSizeBounds,
  preferred: WidgetSizeBounds,
  max: WidgetSizeBounds,
): boolean {
  return (
    min.cols <= preferred.cols &&
    min.rows <= preferred.rows &&
    preferred.cols <= max.cols &&
    preferred.rows <= max.rows
  );
}

export function validateWidgetVariants(variants: WidgetVariant[]): boolean {
  const ids = new Set<string>();
  for (const v of variants) {
    if (ids.has(v.id)) return false;
    ids.add(v.id);
  }
  return true;
}

// --- Widget Common Config ---

export interface WidgetCommonConfig {
  title: string;
  subtitle?: string;
  description?: string;
  colorOverride?: string;
  hideHeader?: boolean;
  padding: 'none' | 'compact' | 'default';
  emptyStateMessage?: string;
  loadingBehavior: 'skeleton' | 'spinner' | 'previous';
  enableDrillThrough?: boolean;
  enableCrossFilter?: boolean;
  enableExport?: boolean;
  clickAction: 'drill' | 'filter' | 'navigate' | 'none';
  minHeight?: number;
  aspectRatio?: number;
  ariaLabel?: string;
  highContrastMode: 'auto' | 'force' | 'off';
}

export function defaultWidgetCommonConfig(overrides?: Partial<WidgetCommonConfig>): WidgetCommonConfig {
  return {
    title: '',
    padding: 'default',
    loadingBehavior: 'skeleton',
    clickAction: 'none',
    highContrastMode: 'auto',
    ...overrides,
  };
}

export function isWidgetCommonConfig(obj: unknown): obj is WidgetCommonConfig {
  if (obj == null || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.title === 'string' &&
    typeof o.padding === 'string' &&
    typeof o.loadingBehavior === 'string' &&
    typeof o.clickAction === 'string' &&
    typeof o.highContrastMode === 'string'
  );
}

// --- Field Mapping ---

export interface FieldMappingSchema {
  dataSourceId: string;
  fields: Array<{ name: string; dataType: string }>;
}

/**
 * @deprecated Import FieldMapping from '@phozart/shared/coordination' instead.
 * This re-export will be removed in v16.
 */
export { type FieldMapping, resolveFieldForSource } from '@phozart/shared/coordination';

export function autoSuggestMappings(schemas: FieldMappingSchema[]): _FieldMapping[] {
  if (schemas.length < 2) return [];

  // Group fields by name+dataType across sources
  const fieldMap = new Map<string, Array<{ dataSourceId: string; field: string }>>();

  for (const schema of schemas) {
    for (const field of schema.fields) {
      const key = `${field.name}:${field.dataType}`;
      let entries = fieldMap.get(key);
      if (!entries) {
        entries = [];
        fieldMap.set(key, entries);
      }
      entries.push({ dataSourceId: schema.dataSourceId, field: field.name });
    }
  }

  const result: _FieldMapping[] = [];
  for (const [key, sources] of fieldMap) {
    if (sources.length >= 2) {
      const canonicalField = key.split(':')[0];
      result.push({ canonicalField, sources });
    }
  }

  return result;
}

// --- Alert & Breach branded types ---
export type AlertRuleId = string & { readonly __brand: 'AlertRuleId' };
export function alertRuleId(id: string): AlertRuleId { return id as AlertRuleId; }

export type BreachId = string & { readonly __brand: 'BreachId' };
export function breachId(id: string): BreachId { return id as BreachId; }

// --- Alert Conditions (discriminated union) ---
export interface SimpleThreshold {
  kind: 'threshold';
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value: number;
  durationMs?: number;
}

export interface CompoundCondition {
  kind: 'compound';
  op: 'AND' | 'OR' | 'NOT';
  children: AlertCondition[];
}

export type AlertCondition = SimpleThreshold | CompoundCondition;

// --- Alert Rule ---
export interface AlertRule {
  id: AlertRuleId;
  name: string;
  description: string;
  artifactId: string;
  widgetId?: string;
  condition: AlertCondition;
  severity: 'info' | 'warning' | 'critical';
  cooldownMs: number;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

// --- Alert Subscription ---
export interface AlertSubscription {
  id: string;
  ruleId: AlertRuleId;
  channelId: string;
  recipientRef: string;
  format: 'inline' | 'digest' | 'webhook';
  active: boolean;
}

// --- Alert Channel Adapter ---
export interface AlertChannelAdapter {
  send(breach: BreachRecord, subscription: AlertSubscription): Promise<void>;
  test(): Promise<boolean>;
  configSchema?: unknown;
}

// --- Breach Record ---
export interface BreachRecord {
  id: BreachId;
  ruleId: AlertRuleId;
  artifactId: string;
  widgetId?: string;
  status: 'active' | 'acknowledged' | 'resolved';
  detectedAt: number;
  acknowledgedAt?: number;
  resolvedAt?: number;
  currentValue: number;
  thresholdValue: number;
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

// --- Active Breach ---
export interface ActiveBreach {
  breach: BreachRecord;
  rule: AlertRule;
}

// ========================================================================
// Filter Types (H.11)
// ========================================================================

/**
 * @deprecated Import FilterOperator from '@phozart/shared/coordination' instead.
 * These re-exports will be removed in v16.
 */
export {
  type FilterOperator,
  type FilterValue,
  type CrossFilterEntry,
  type FilterContextState,
  type FilterUIType,
  type DashboardFilterDef,
} from '@phozart/shared/coordination';

// Re-import for use by workspace-specific types below
import type { FilterUIType as _FilterUIType, DashboardFilterDef as _DashboardFilterDef } from '@phozart/shared/coordination';

export interface FilterDependency {
  parentFilterId: string;
  childFilterId: string;
  constraintType: 'data-driven' | 'explicit-mapping';
}

export interface DashboardFilterBarConfig {
  filters: _DashboardFilterDef[];
  position: 'top' | 'left';
  collapsible: boolean;
  defaultCollapsed: boolean;
  showActiveFilterCount: boolean;
  showPresetPicker: boolean;
  defaultPresetId?: string;
  dependencies: FilterDependency[];
}

// ========================================================================
// Template Types (H.4)
// ========================================================================

export type TemplateId = string & { readonly __brand: 'TemplateId' };
export function templateId(id: string): TemplateId { return id as TemplateId; }

export interface TemplateWidgetSlot {
  slotId: string;
  widgetType: string;
  variantId?: string;
  defaultConfig: Record<string, unknown>;
  fieldBindings: Record<string, string>;
}

export interface TemplateMatchRule {
  requiredFieldTypes: Array<{
    type: 'string' | 'number' | 'date' | 'boolean';
    semanticHint?: string;
    minCount: number;
  }>;
  weight: number;
  rationale: string;
}

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  layout: LayoutNode;
  widgetSlots: TemplateWidgetSlot[];
  matchRules: TemplateMatchRule[];
  tags: string[];
  builtIn: boolean;
}

// ========================================================================
// Dashboard Data Config (T.1)
// ========================================================================

/**
 * @deprecated Import FieldMappingEntry from '@phozart/shared/coordination' instead.
 * This re-export will be removed in v16.
 */
export type { FieldMappingEntry } from '@phozart/shared/coordination';

export interface PreloadConfig {
  query: DataQuery;
  usePersonalView?: boolean;
}

export interface FullLoadConfig {
  query: DataQuery;
  applyCurrentFilters?: boolean;
  maxRows?: number;
}

/**
 * @deprecated Import DetailTrigger from '@phozart/shared/coordination' instead.
 * This re-export will be removed in v16.
 */
export type { DetailTrigger } from '@phozart/shared/coordination';

export interface DetailSourceConfig {
  id: string;
  name: string;
  description?: string;
  dataSourceId: string;
  filterMapping: _FieldMappingEntry[];
  baseQuery: DataQuery;
  preloadQuery?: DataQuery;
  maxRows?: number;
  trigger: _DetailTrigger;
  renderMode?: 'panel' | 'modal' | 'navigate';
}

export interface DashboardDataConfig {
  preload: PreloadConfig;
  fullLoad: FullLoadConfig;
  detailSources?: DetailSourceConfig[];
  transition?: 'seamless' | 'fade' | 'replace';
}

/**
 * @deprecated Import DashboardLoadingState from '@phozart/shared/coordination' instead.
 * This re-export will be removed in v16.
 */
export type { DashboardLoadingState } from '@phozart/shared/coordination';

export function isDashboardDataConfig(obj: unknown): obj is DashboardDataConfig {
  if (obj == null || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  if (o.preload == null || typeof o.preload !== 'object') return false;
  if (o.fullLoad == null || typeof o.fullLoad !== 'object') return false;
  const preload = o.preload as Record<string, unknown>;
  if (preload.query == null || typeof preload.query !== 'object') return false;
  const fullLoad = o.fullLoad as Record<string, unknown>;
  if (fullLoad.query == null || typeof fullLoad.query !== 'object') return false;
  return true;
}

export function isDetailSourceConfig(obj: unknown): obj is DetailSourceConfig {
  if (obj == null || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.dataSourceId === 'string' &&
    Array.isArray(o.filterMapping) &&
    o.baseQuery != null && typeof o.baseQuery === 'object' &&
    o.trigger !== undefined
  );
}

const VALID_TRANSITIONS = new Set(['seamless', 'fade', 'replace']);

export function validateDashboardDataConfig(config: DashboardDataConfig): boolean {
  if (!isDashboardDataConfig(config)) return false;
  if (config.transition !== undefined && !VALID_TRANSITIONS.has(config.transition)) return false;
  if (config.fullLoad.maxRows !== undefined && config.fullLoad.maxRows < 0) return false;
  if (config.detailSources) {
    for (const ds of config.detailSources) {
      if (!isDetailSourceConfig(ds)) return false;
    }
  }
  return true;
}

// ========================================================================
// Viewer Context (H.20)
// ========================================================================

/**
 * @deprecated Import ViewerContext from '@phozart/shared/adapters' instead.
 * This re-export will be removed in v16.
 */
export type { ViewerContext } from '@phozart/shared/adapters';

// ========================================================================
// Filter Value Source & Transform (U.1)
// ========================================================================

/**
 * @deprecated Import from '@phozart/shared/types' instead.
 * These re-exports will be removed in v16.
 */
export {
  type FilterValueSource,
  type FilterValueTransform,
  type FilterDefault,
} from '@phozart/shared/types';

// ========================================================================
// ArtifactFilterContract (U.3)
// ========================================================================

export interface DashboardFilterRef {
  filterDefinitionId: string;
  overrides?: { label?: string; required?: boolean; defaultValue?: _FilterDefault };
  queryLayer?: 'server' | 'client' | 'auto';
}

export interface ArtifactFilterContract {
  acceptedFilters: DashboardFilterRef[];
  validation?: { onInvalid: 'prune' | 'clamp' | 'invalidate' | 'ignore' };
  transforms?: Record<string, _FilterValueTransform>;
  defaults?: Record<string, _FilterDefault>;
}

// ========================================================================
// Source Relationship types (re-export from shared)
// ========================================================================

/**
 * @deprecated Import from '@phozart/shared/types' instead.
 * These re-exports will be removed in v16.
 */
export {
  type JoinType,
  type SourceJoinKey,
  type SourceRelationship,
} from '@phozart/shared/types';
