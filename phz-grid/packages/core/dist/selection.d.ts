/**
 * @phozart/core — Selection Context Serialization
 *
 * URL-safe serialization, merge, and validation for SelectionContext.
 */
import type { SelectionContext, SelectionFieldDef, SelectionValidationResult } from './types/selection-context.js';
/**
 * Serialize a SelectionContext to URLSearchParams.
 * Arrays are joined with commas.
 */
export declare function serializeSelection(ctx: SelectionContext): URLSearchParams;
/**
 * Deserialize URLSearchParams back to a SelectionContext.
 * Multi-select fields are split on commas.
 */
export declare function deserializeSelection(params: URLSearchParams, fields: SelectionFieldDef[]): SelectionContext;
/**
 * Merge a base SelectionContext with overrides.
 * Null values in overrides remove keys.
 */
export declare function mergeSelection(base: SelectionContext, overrides: SelectionContext): SelectionContext;
/**
 * Validate a SelectionContext against field definitions.
 */
export declare function validateSelection(ctx: SelectionContext, fields: SelectionFieldDef[]): SelectionValidationResult;
//# sourceMappingURL=selection.d.ts.map