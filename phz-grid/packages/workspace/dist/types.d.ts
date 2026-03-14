/**
 * @phozart/workspace — Core Types
 */
import type { LayoutNode } from './schema/config-layers.js';
import type { DataQuery } from './data-adapter.js';
import type { ArtifactEndorsement } from './govern/certification-state.js';
import type { FieldMappingEntry as _FieldMappingEntry, DetailTrigger as _DetailTrigger, FieldMapping as _FieldMapping } from '@phozart/shared/coordination';
import type { FilterDefault as _FilterDefault, FilterValueTransform as _FilterValueTransform } from '@phozart/shared/types';
export type { KPIId, MetricId, ReportId, DashboardId, WidgetId, DataProductId, } from '@phozart/engine';
export { kpiId, metricId, reportId, dashboardId, widgetId, dataProductId, } from '@phozart/engine';
export type { DefinitionId } from '@phozart/shared/definitions';
export type PlacementId = string & {
    readonly __brand: 'PlacementId';
};
export declare function placementId(id: string): PlacementId;
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
    load?: () => Promise<{
        render(config: unknown, container: HTMLElement, context: unknown): void;
        update?(config: unknown, context: unknown): void;
        destroy?(): void;
    }>;
    responsiveBehavior?: WidgetResponsiveBehavior;
}
export declare function isWidgetManifest(obj: unknown): obj is WidgetManifest;
export declare function validateWidgetSizeBounds(min: WidgetSizeBounds, preferred: WidgetSizeBounds, max: WidgetSizeBounds): boolean;
export declare function validateWidgetVariants(variants: WidgetVariant[]): boolean;
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
export declare function defaultWidgetCommonConfig(overrides?: Partial<WidgetCommonConfig>): WidgetCommonConfig;
export declare function isWidgetCommonConfig(obj: unknown): obj is WidgetCommonConfig;
export interface FieldMappingSchema {
    dataSourceId: string;
    fields: Array<{
        name: string;
        dataType: string;
    }>;
}
/**
 * @deprecated Import FieldMapping from '@phozart/shared/coordination' instead.
 * This re-export will be removed in v16.
 */
export { type FieldMapping, resolveFieldForSource } from '@phozart/shared/coordination';
export declare function autoSuggestMappings(schemas: FieldMappingSchema[]): _FieldMapping[];
export type AlertRuleId = string & {
    readonly __brand: 'AlertRuleId';
};
export declare function alertRuleId(id: string): AlertRuleId;
export type BreachId = string & {
    readonly __brand: 'BreachId';
};
export declare function breachId(id: string): BreachId;
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
export interface AlertSubscription {
    id: string;
    ruleId: AlertRuleId;
    channelId: string;
    recipientRef: string;
    format: 'inline' | 'digest' | 'webhook';
    active: boolean;
}
export interface AlertChannelAdapter {
    send(breach: BreachRecord, subscription: AlertSubscription): Promise<void>;
    test(): Promise<boolean>;
    configSchema?: unknown;
}
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
export interface ActiveBreach {
    breach: BreachRecord;
    rule: AlertRule;
}
/**
 * @deprecated Import FilterOperator from '@phozart/shared/coordination' instead.
 * These re-exports will be removed in v16.
 */
export { type FilterOperator, type FilterValue, type CrossFilterEntry, type FilterContextState, type FilterUIType, type DashboardFilterDef, } from '@phozart/shared/coordination';
import type { DashboardFilterDef as _DashboardFilterDef } from '@phozart/shared/coordination';
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
export type TemplateId = string & {
    readonly __brand: 'TemplateId';
};
export declare function templateId(id: string): TemplateId;
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
export declare function isDashboardDataConfig(obj: unknown): obj is DashboardDataConfig;
export declare function isDetailSourceConfig(obj: unknown): obj is DetailSourceConfig;
export declare function validateDashboardDataConfig(config: DashboardDataConfig): boolean;
/**
 * @deprecated Import ViewerContext from '@phozart/shared/adapters' instead.
 * This re-export will be removed in v16.
 */
export type { ViewerContext } from '@phozart/shared/adapters';
/**
 * @deprecated Import from '@phozart/shared/types' instead.
 * These re-exports will be removed in v16.
 */
export { type FilterValueSource, type FilterValueTransform, type FilterDefault, } from '@phozart/shared/types';
export interface DashboardFilterRef {
    filterDefinitionId: string;
    overrides?: {
        label?: string;
        required?: boolean;
        defaultValue?: _FilterDefault;
    };
    queryLayer?: 'server' | 'client' | 'auto';
}
export interface ArtifactFilterContract {
    acceptedFilters: DashboardFilterRef[];
    validation?: {
        onInvalid: 'prune' | 'clamp' | 'invalidate' | 'ignore';
    };
    transforms?: Record<string, _FilterValueTransform>;
    defaults?: Record<string, _FilterDefault>;
}
/**
 * @deprecated Import from '@phozart/shared/types' instead.
 * These re-exports will be removed in v16.
 */
export { type JoinType, type SourceJoinKey, type SourceRelationship, } from '@phozart/shared/types';
//# sourceMappingURL=types.d.ts.map