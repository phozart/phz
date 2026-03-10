/**
 * Validate a GridDefinition using Zod schemas.
 */
export interface DefinitionValidationError {
    path: string;
    message: string;
}
export interface DefinitionValidationResult {
    valid: boolean;
    errors: DefinitionValidationError[];
}
export declare function validateDefinition(def: unknown): DefinitionValidationResult;
//# sourceMappingURL=validate.d.ts.map