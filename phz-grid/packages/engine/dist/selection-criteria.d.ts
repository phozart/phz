/**
 * @phozart/engine — Selection Criteria Logic
 *
 * Pure headless functions for criteria resolution, validation,
 * dependency management, export metadata, and URL serialization.
 */
import type { SelectionContext, SelectionFieldDef, SelectionFieldType, SelectionValidationResult, CriteriaConfig, CriteriaExportMetadata, DateRangeValue, DynamicDatePreset, TreeNode, SelectionFieldOption, BuiltinDatePresetId, DatePresetDef, DatePresetGroup, DateRangeFieldConfig, ComparisonType, WeekStartDay, ColumnType, PresenceState, OptionsSource, DataSet } from '@phozart/core';
/** Resolve a single dynamic date preset to a concrete DateRangeValue */
export declare function resolveDynamicPreset(preset: DynamicDatePreset, now?: Date): DateRangeValue;
/** All built-in preset definitions grouped by category */
export declare const BUILTIN_DATE_PRESETS: DatePresetDef[];
export declare const DATE_PRESET_GROUP_LABELS: Record<DatePresetGroup, string>;
/** Get the fiscal quarter (1-4) for a date */
export declare function getFiscalQuarter(d: Date, fiscalStartMonth?: number): number;
/** Get the start and end dates of a fiscal quarter */
export declare function getFiscalQuarterBounds(year: number, quarter: number, fiscalStartMonth?: number): {
    start: Date;
    end: Date;
};
/** Get start of the week containing the given date */
export declare function getWeekStart(d: Date, weekStartDay?: WeekStartDay): Date;
/** Get end of the week containing the given date */
export declare function getWeekEnd(d: Date, weekStartDay?: WeekStartDay): Date;
/** Get ISO week number (ISO 8601) */
export declare function getISOWeekNumber(d: Date): number;
/** Get sequential week number (simple count from Jan 1) */
export declare function getSequentialWeekNumber(d: Date): number;
/** Get the bounds of a specific month */
export declare function getMonthBounds(year: number, month: number): {
    start: Date;
    end: Date;
};
/** Get the bounds of a calendar quarter (non-fiscal) */
export declare function getCalendarQuarterBounds(year: number, quarter: number): {
    start: Date;
    end: Date;
};
interface DateResolveOptions {
    fiscalYearStartMonth?: number;
    weekStartDay?: WeekStartDay;
}
/** Resolve a built-in preset ID to a concrete DateRangeValue */
export declare function resolveBuiltinPreset(presetId: BuiltinDatePresetId, now?: Date, options?: DateResolveOptions): DateRangeValue;
/** Resolve a comparison period from a primary date range */
export declare function resolveComparisonPeriod(primary: DateRangeValue, type: ComparisonType): {
    startDate: string;
    endDate: string;
};
/** Get the presets available for a given config, respecting filters */
export declare function getAvailablePresets(config: DateRangeFieldConfig): DatePresetDef[];
/** Format a date range for human-readable summary display.
 *  `locale` defaults to the runtime locale (browser language).
 *  Pass an explicit locale (e.g. 'en-GB') for deterministic output in tests. */
export declare function formatDateRangeDisplay(value: DateRangeValue, locale?: string): string;
/** Resolve dynamic defaults for all fields in a criteria config */
export declare function resolveDynamicDefaults(config: CriteriaConfig, now?: Date): SelectionContext;
/** Filter tree nodes by a parent field's value (cascading filter) */
export declare function filterTreeByParent(nodes: TreeNode[], parentValue: string | string[] | null): TreeNode[];
/** Resolve filtered options for each field based on current selections and dependency chain */
export declare function resolveDependencies(config: CriteriaConfig, currentValues: SelectionContext): Map<string, SelectionFieldOption[]>;
/** Validate criteria values against field definitions */
export declare function validateCriteria(config: CriteriaConfig, values: SelectionContext): SelectionValidationResult;
/** Format a single criterion value for display */
export declare function formatCriteriaValue(field: SelectionFieldDef, value: string | string[] | null, locale?: string): string;
/** Build export metadata for including in CSV/Excel headers */
export declare function buildExportMetadata(config: CriteriaConfig, values: SelectionContext): CriteriaExportMetadata;
/** Serialize criteria values to URL search params */
export declare function serializeCriteria(values: SelectionContext, config: CriteriaConfig): URLSearchParams;
/** Deserialize URL search params back to criteria values */
export declare function deserializeCriteria(params: URLSearchParams, config: CriteriaConfig): SelectionContext;
/** Infer the best criteria field type from a column's data type and cardinality */
export declare function inferCriteriaType(columnType: ColumnType | undefined, distinctCount: number): SelectionFieldType;
/** Extract distinct values from a data array for a given field, returned as options */
export declare function deriveOptionsFromData(data: Record<string, unknown>[], dataField: string): SelectionFieldOption[];
/** Resolve options from an external dataset via OptionsSource config */
export declare function resolveOptionsSource(source: OptionsSource, dataSources: Record<string, DataSet>): SelectionFieldOption[];
/** Unified option resolver with priority: optionsSource > static options > derive from data */
export declare function resolveFieldOptions(field: SelectionFieldDef, dataSources?: Record<string, DataSet>, currentData?: Record<string, unknown>[]): SelectionFieldOption[];
/** Apply criteria filter values to a dataset using dataField bindings */
export declare function applyCriteriaToData(data: Record<string, unknown>[], config: CriteriaConfig, values: SelectionContext): Record<string, unknown>[];
/** Apply presence filters (has_value / empty) to a dataset.
 *  Fields with state 'any' are skipped. */
export declare function applyPresenceFilter(data: Record<string, unknown>[], filters: Record<string, PresenceState>): Record<string, unknown>[];
export {};
//# sourceMappingURL=selection-criteria.d.ts.map