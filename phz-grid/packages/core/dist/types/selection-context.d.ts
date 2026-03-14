/**
 * @phozart/core — Selection Context Types
 *
 * App-level selection state that scopes all widgets and dashboards.
 */
export type SelectionFieldType = 'single_select' | 'multi_select' | 'period_picker' | 'chip_group' | 'text' | 'date_range' | 'numeric_range' | 'tree_select' | 'search' | 'field_presence';
export type CriteriaSelectionMode = 'single' | 'multiple' | 'none';
export interface SelectionFieldDef {
    id: string;
    label: string;
    type: SelectionFieldType;
    /** Column field name from the dataset that this criterion filters on */
    dataField?: string;
    options?: SelectionFieldOption[];
    allowAll?: boolean;
    locked?: boolean;
    defaultValue?: string | string[] | null;
    required?: boolean;
    placeholder?: string;
    lockedValue?: string | string[] | null;
    dependsOn?: string;
    treeOptions?: TreeNode[];
    dateRangeConfig?: DateRangeFieldConfig;
    numericRangeConfig?: NumericRangeFieldConfig;
    searchConfig?: SearchFieldConfig;
    fieldPresenceConfig?: FieldPresenceConfig;
    barConfig?: FilterBarFieldConfig;
    /** External dataset source for resolving options at runtime */
    optionsSource?: OptionsSource;
    /** How many values can be selected. Default depends on field type. */
    selectionMode?: CriteriaSelectionMode;
    /** Whether null/empty values are allowed for this field */
    allowNullValue?: boolean;
    /** Whether this field is a context parameter or a data filter. Default: 'filter' */
    fieldRole?: 'parameter' | 'filter';
}
export interface SelectionFieldOption {
    value: string;
    label: string;
}
export interface OptionsSource {
    /** Key into the dataSources map passed at runtime */
    dataSetId: string;
    /** Column field name to use as option value */
    valueField: string;
    /** Column field name to use as option label (defaults to valueField) */
    labelField?: string;
    /** Template for composing display labels from multiple fields, e.g. '{code} - {description}' */
    labelTemplate?: string;
    /** Sort order for resolved options. Default: 'label' */
    sortBy?: 'label' | 'value' | 'none';
}
export interface FilterDataSource {
    id: string;
    name: string;
    columns: string[];
    sampleRows?: Record<string, unknown>[];
}
export interface SelectionContext {
    [key: string]: string | string[] | null;
}
export interface SelectionChange {
    field: string;
    oldValue: string | string[] | null;
    newValue: string | string[] | null;
}
export interface SelectionValidationResult {
    valid: boolean;
    errors: SelectionValidationError[];
}
export interface SelectionValidationError {
    field: string;
    message: string;
}
export interface TreeNode {
    value: string;
    label: string;
    children?: TreeNode[];
}
export interface TreeLevelConfig {
    field: string;
    labelTemplate?: string;
}
export interface TreeSourceConfig {
    dataSetId: string;
    levels: TreeLevelConfig[];
}
export type DateGranularity = 'day' | 'week' | 'month' | 'quarter' | 'year';
export type DatePresetGroup = 'relative' | 'rolling' | 'to_date' | 'previous_complete';
/** Built-in preset IDs — resolved by the engine at runtime */
export type BuiltinDatePresetId = 'today' | 'yesterday' | 'last-7d' | 'last-30d' | 'last-90d' | 'last-3m' | 'last-6m' | 'last-12m' | 'wtd' | 'mtd' | 'qtd' | 'ytd' | 'prev-week' | 'prev-month' | 'prev-quarter' | 'prev-year' | 'same-period-last-year';
export interface DatePresetDef {
    id: BuiltinDatePresetId;
    label: string;
    group: DatePresetGroup;
}
export type WeekStartDay = 'monday' | 'sunday';
export type WeekNumbering = 'iso' | 'sequential';
export interface DateRangeFieldConfig {
    minDate?: string;
    maxDate?: string;
    /** Which granularity tabs to show in custom zone. Default: all */
    availableGranularities?: DateGranularity[];
    /** Which preset groups to show. Default: all */
    availablePresetGroups?: DatePresetGroup[];
    /** Individual preset IDs to show (overrides groups if set) */
    availablePresets?: BuiltinDatePresetId[];
    /** Default selection: a builtin preset ID or a fixed range */
    defaultPresetId?: BuiltinDatePresetId;
    /** Enable comparison period selector */
    comparisonEnabled?: boolean;
    /** Fiscal year start month (1-12). Default: 1 (January) */
    fiscalYearStartMonth?: number;
    /** Week start day. Default: monday */
    weekStartDay?: WeekStartDay;
    /** Week numbering system. Default: iso */
    weekNumbering?: WeekNumbering;
    /** Time zone label to display (informational). null = hidden */
    timezoneDisplay?: string | null;
    /** @deprecated Use availablePresets instead */
    presets?: string[];
    /** @deprecated Use defaultPresetId with built-in presets */
    dynamicPresets?: DynamicDatePreset[];
}
/** @deprecated Use BuiltinDatePresetId and engine resolveBuiltinPreset instead */
export interface DynamicDatePreset {
    id: string;
    label: string;
    type: 'relative';
    unit: 'day' | 'week' | 'month' | 'quarter' | 'year';
    count: number;
    anchor: 'today' | 'start_of_month' | 'start_of_year';
}
export type ComparisonType = 'previous_period' | 'same_period_last_year' | 'custom';
export interface DateRangeValue {
    startDate: string;
    endDate: string;
    /** Granularity used for selection */
    granularity?: DateGranularity;
    /** Built-in preset ID if a preset was used */
    presetId?: string;
    /** Human label of preset (for saved display) */
    presetLabel?: string;
    /** Whether this is a dynamic (recalculating) selection */
    isDynamic?: boolean;
    /** Comparison period start date */
    comparisonStartDate?: string;
    /** Comparison period end date */
    comparisonEndDate?: string;
    /** How comparison was derived */
    comparisonType?: ComparisonType;
}
export interface NumericRangeFieldConfig {
    min?: number;
    max?: number;
    step?: number;
    showSlider?: boolean;
    unit?: string;
}
export interface NumericRangeValue {
    min: number;
    max: number;
}
export type SearchMatchMode = 'contains' | 'beginsWith';
export interface SearchFieldConfig {
    minChars?: number;
    debounceMs?: number;
    maxSuggestions?: number;
    /** Match mode: 'contains' (substring) or 'beginsWith' (prefix). Default: 'contains' */
    matchMode?: SearchMatchMode;
    /** When true, input is split by spaces — each token matched independently (OR). Default: false */
    multiValue?: boolean;
}
export interface CriterionDependency {
    parentFieldId: string;
    childFieldId: string;
}
export type PresetScope = 'personal' | 'shared';
export interface SelectionPreset {
    id: string;
    name: string;
    scope: PresetScope;
    owner: string;
    values: SelectionContext;
    isDefault?: boolean;
    created: number;
    updated: number;
}
export interface FilterDefinitionPreset {
    id: string;
    filterDefinitionId: FilterDefinitionId;
    name: string;
    scope: PresetScope;
    owner: string;
    value: string | string[] | null;
    isDefault?: boolean;
    created: number;
    updated: number;
}
export interface CriteriaConfig {
    fields: SelectionFieldDef[];
    dependencies?: CriterionDependency[];
    presets?: SelectionPreset[];
    behavior?: CriteriaBehavior;
}
export interface CriteriaBehavior {
    autoApply?: boolean;
    panelStyle?: 'expanded' | 'collapsed' | 'floating';
    showSummaryStrip?: boolean;
    showPresetManager?: boolean;
    showResetButton?: boolean;
    /** Criteria bar layout configuration */
    layout?: FilterBarLayout;
}
export type BarMode = 'button' | 'summary';
export type BarDisplayMode = 'full' | 'compact';
export type ButtonContent = 'icon-only' | 'icon-text' | 'text-only';
export interface FilterBarLayout {
    /** Bar mode: 'button' (default) shows Filters button, 'summary' shows clickable summary text */
    barMode?: BarMode;
    /** Display mode: full shows filter tags, compact shows only the button */
    barDisplayMode?: BarDisplayMode;
    /** What to show on the button: icon only, icon + text, or text only */
    buttonContent?: ButtonContent;
    /** Button label text. Default: 'Filters' */
    buttonLabel?: string;
    /** Button background color. Default: '#1C1917' */
    buttonBgColor?: string;
    /** Button text/icon color. Default: '#FFFFFF' */
    buttonTextColor?: string;
    /** Container background color. Default: '#FFFFFF' */
    containerBgColor?: string;
    /** Container border color. Empty string hides border. Default: '#E7E5E4' */
    containerBorderColor?: string;
    /** Container border radius in px. Default: 10 */
    containerBorderRadius?: number;
    /** Container box-shadow preset: 'none' | 'sm' | 'md' | 'lg'. Default: 'none' */
    containerShadow?: 'none' | 'sm' | 'md' | 'lg';
    /** Show only the button without the surrounding container */
    buttonOnly?: boolean;
    /** Show summary strip when criteria is collapsed */
    showSummaryStrip?: boolean;
    /** Summary strip styling */
    summaryStrip?: SummaryStripLayout;
    /** Placeholder text when no filters are active in summary mode. Default: 'No filters applied' */
    summaryPlaceholder?: string;
}
export interface SummaryStripLayout {
    /** Background color in default (no filters) state. Default: '#FAFAF9' */
    bgColor?: string;
    /** Text color in default state. Default: '#78716C' */
    textColor?: string;
    /** Border color in default state. Default: '#E7E5E4' */
    borderColor?: string;
    /** Border radius in px. Default: 8 */
    borderRadius?: number;
    /** Background color when filters are active. Default: '#EFF6FF' */
    activeBgColor?: string;
    /** Text color when filters are active. Default: '#1D4ED8' */
    activeTextColor?: string;
    /** Border color when filters are active. Default: '#2563EB' */
    activeBorderColor?: string;
}
export interface FilterBarFieldConfig {
    /** Show this field as a pinned tag in the criteria bar */
    pinnedToBar?: boolean;
    /** Whether this section starts expanded in the drawer */
    defaultOpen?: boolean;
    /** Whether the section can be collapsed (default true) */
    expandable?: boolean;
    /** Max visible items before truncation (0 = no limit) */
    maxVisibleItems?: number;
    /** Enable match filter pill for tree selects */
    enableMatchFilter?: boolean;
    /** Show this field's value on the summary bar when barMode is 'summary' */
    showOnSummary?: boolean;
}
export interface FilterBarBehavior extends CriteriaBehavior {
    /** Drawer width in px. Default 520 */
    drawerWidth?: number;
    /** Show dark backdrop behind drawer. Default true */
    showBackdrop?: boolean;
    /** Animate drawer open/close. Default true */
    animated?: boolean;
    /** Allow user to pin the drawer open as an inline sidebar. Default false */
    pinnable?: boolean;
    /** Start with the drawer pinned open. Default false */
    defaultPinned?: boolean;
}
export interface MatchFilterConfig {
    label: string;
    evaluate: (item: TreeNode) => boolean;
}
export type MatchFilterState = 'all' | 'matching' | 'non-matching';
export type PresenceState = 'any' | 'has_value' | 'empty';
export interface FieldPresenceConfig {
    fields: string[];
    compact?: boolean;
    showLegend?: boolean;
    showClear?: boolean;
}
export interface CriteriaExportMetadata {
    label: string;
    entries: CriteriaExportEntry[];
    generatedAt: number;
}
export interface CriteriaExportEntry {
    fieldLabel: string;
    displayValue: string;
}
export type FilterDefinitionId = string & {
    readonly __brand: 'FilterDefinitionId';
};
export type ArtefactId = string & {
    readonly __brand: 'ArtefactId';
};
export declare function filterDefinitionId(id: string): FilterDefinitionId;
export declare function artefactId(id: string): ArtefactId;
export type ValueSourceType = 'static' | 'dataset' | 'async';
export interface ValueSourceConfig {
    type: ValueSourceType;
    optionsSource?: OptionsSource;
    resolverKey?: string;
    cacheTtlMs?: number;
}
export type SessionBehavior = 'reset' | 'persist';
export interface FilterDefinition {
    id: FilterDefinitionId;
    label: string;
    type: SelectionFieldType;
    sessionBehavior: SessionBehavior;
    defaultValue?: string | string[] | null;
    allowNullValue?: boolean;
    valueSource?: ValueSourceConfig;
    options?: SelectionFieldOption[];
    treeOptions?: TreeNode[];
    treeSource?: TreeSourceConfig;
    dateRangeConfig?: DateRangeFieldConfig;
    numericRangeConfig?: NumericRangeFieldConfig;
    searchConfig?: SearchFieldConfig;
    fieldPresenceConfig?: FieldPresenceConfig;
    dataField?: string;
    dependsOn?: FilterDefinitionId[];
    selectionMode?: CriteriaSelectionMode;
    required?: boolean;
    metadata?: Record<string, unknown>;
    deprecated?: boolean;
    createdAt: number;
    updatedAt: number;
    createdBy?: string;
}
export interface FilterBinding {
    filterDefinitionId: FilterDefinitionId;
    artefactId: ArtefactId;
    visible: boolean;
    order: number;
    labelOverride?: string;
    defaultValueOverride?: string | string[] | null;
    barConfigOverride?: FilterBarFieldConfig;
    requiredOverride?: boolean;
    /** Override the definition's selectionMode for this specific artefact binding */
    selectionModeOverride?: CriteriaSelectionMode;
    /** Override the definition's allowNullValue for this specific artefact binding */
    allowNullValueOverride?: boolean;
    /** Override the definition's dataField for this specific artefact binding */
    dataFieldOverride?: string;
    /** Dashboard widget-scoped targeting. Empty/undefined = all widgets. */
    targetScope?: string[];
}
export interface StateStorageAdapter {
    persist(key: string, state: Record<string, string | string[] | null>): void;
    load(key: string): Record<string, string | string[] | null> | null;
    remove(key: string): void;
}
export type StateResolutionLevel = 'rule' | 'preset' | 'persisted' | 'binding_default' | 'definition_default' | 'all_selected';
export interface StateResolutionInputs {
    ruleValues?: Record<string, string | string[] | null>;
    presetValues?: Record<string, string | string[] | null>;
    persistedValues?: Record<string, string | string[] | null>;
    bindingDefaults?: Record<string, string | string[] | null>;
    definitionDefaults?: Record<string, string | string[] | null>;
}
/**
 * Opaque context bag passed into rule evaluation from the host application.
 * Contains external variables (user profile, other filter selections, feature flags, etc.)
 * that custom rule evaluators can reference to constrain filter options.
 *
 * Values can be scalars or arrays — the rule evaluator decides how to interpret them.
 */
export interface RuleEvaluationContext {
    [key: string]: string | string[] | number | boolean | null | undefined;
}
export type FilterRuleType = 'exclude_pattern' | 'include_pattern' | 'tree_group_compare' | 'value_set' | 'custom' | 'cross_filter';
export interface FilterRule {
    id: string;
    filterDefinitionId: FilterDefinitionId;
    type: FilterRuleType;
    priority: number;
    enabled: boolean;
    config: FilterRuleConfig;
    description?: string;
    createdAt: number;
    createdBy?: string;
}
export type FilterRuleConfig = ExcludePatternConfig | IncludePatternConfig | TreeGroupCompareConfig | ValueSetConfig | CustomRuleConfig | CrossFilterConfig;
export interface ExcludePatternConfig {
    type: 'exclude_pattern';
    pattern: string;
    flags?: string;
}
export interface IncludePatternConfig {
    type: 'include_pattern';
    pattern: string;
    flags?: string;
}
export interface TreeGroupCompareConfig {
    type: 'tree_group_compare';
    groupField: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'in' | 'not_in';
    value: string;
    /** Values for in/not_in operators */
    values?: string[];
}
export interface ValueSetConfig {
    type: 'value_set';
    mode: 'include' | 'exclude';
    values: string[];
}
export interface CustomRuleConfig {
    type: 'custom';
    evaluatorKey: string;
    params?: Record<string, unknown>;
}
export type CrossFilterConditionOperator = 'equals' | 'not_equals' | 'in' | 'not_in' | 'is_set' | 'is_not_set';
export interface CrossFilterCondition {
    source: 'filter' | 'context';
    key: string;
    operator: CrossFilterConditionOperator;
    values?: string[];
}
export type CrossFilterActionType = 'include_values' | 'exclude_values' | 'include_from_context' | 'exclude_from_context';
export interface CrossFilterAction {
    type: CrossFilterActionType;
    values?: string[];
    contextKey?: string;
}
export type CrossFilterElseActionType = 'pass_through' | 'block';
export interface CrossFilterConfig {
    type: 'cross_filter';
    conditions: CrossFilterCondition[];
    logic: 'all' | 'any';
    action: CrossFilterAction;
    elseAction?: CrossFilterElseActionType;
}
export interface FilterRuleResult {
    constrainedOptions: SelectionFieldOption[];
    appliedRuleIds: string[];
    excludedValues: string[];
}
export type CriteriaOperator = 'in' | 'not_in' | 'between' | 'equals' | 'not_equals' | 'like' | 'not_like' | 'starts_with' | 'is_null' | 'is_not_null' | 'greater_than' | 'less_than';
export interface FilterCriterion {
    filterDefinitionId: FilterDefinitionId;
    operator: CriteriaOperator;
    value: string | string[] | null;
    dataField?: string;
    isRuleApplied: boolean;
    activeRuleIds: string[];
    resolvedFrom: StateResolutionLevel;
}
export type TreeOutputMode = 'leaf_only' | 'selected_level' | 'full_path';
export interface ArtefactCriteria {
    artefactId: ArtefactId;
    filters: FilterCriterion[];
    timestamp: number;
    isComplete: boolean;
}
export interface AdminPermissions {
    canCreateDefinitions: boolean;
    canEditDefinitions: boolean;
    canDeprecateDefinitions: boolean;
    canManageBindings: boolean;
    canManagePresets: boolean;
    canManageRules: boolean;
    canViewAuditLog: boolean;
    canViewUserPresets: boolean;
}
export type AuditAction = 'create' | 'update' | 'delete' | 'deprecate' | 'bind' | 'unbind' | 'reorder' | 'toggle_rule';
export interface AuditLogEntry {
    id: string;
    timestamp: number;
    userId: string;
    action: AuditAction;
    entityType: 'definition' | 'binding' | 'rule' | 'preset';
    entityId: string;
    details?: Record<string, unknown>;
}
//# sourceMappingURL=selection-context.d.ts.map