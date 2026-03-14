/**
 * @phozart/workspace — FilterDefinition (U.1)
 *
 * Centrally managed filter definitions as catalog artifacts.
 * Each FilterDefinition describes a reusable filter: its value source,
 * how it binds to data sources, optional security restrictions,
 * dependencies on other filters, and default values.
 */
import type { FilterValueSource, FilterValueTransform, FilterDefault, ViewerContext } from '../types.js';
export interface FilterBinding {
    dataSourceId: string;
    targetField: string;
    transform?: FilterValueTransform;
    lookupConfig?: {
        lookupSourceId: string;
        keyField: string;
        valueField: string;
    };
}
export interface SecurityBinding {
    viewerAttribute: string;
    restrictionType: 'include-only' | 'exclude' | 'max-value';
}
export interface FilterDefinition {
    id: string;
    label: string;
    description?: string;
    filterType: 'select' | 'multi-select' | 'range' | 'date-range' | 'text' | 'boolean';
    valueSource: FilterValueSource;
    bindings: FilterBinding[];
    securityBinding?: SecurityBinding;
    dependsOn?: string[];
    defaultValue?: FilterDefault;
    required?: boolean;
}
export declare function isFilterDefinition(obj: unknown): obj is FilterDefinition;
export declare function createFilterDefinition(input: Omit<FilterDefinition, 'id'> & {
    id?: string;
}): FilterDefinition;
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}
export declare function validateFilterDefinition(fd: FilterDefinition): ValidationResult;
export declare function resolveBindingsForSource(bindings: FilterBinding[], dataSourceId: string): FilterBinding[];
export declare function evaluateSecurityBinding(binding: SecurityBinding, viewer: ViewerContext | undefined, allValues: unknown[]): unknown[];
export declare function resolveFilterDefault(def: FilterDefault, viewer?: ViewerContext): unknown;
//# sourceMappingURL=filter-definition.d.ts.map