/**
 * Definition Formatting — conditional formatting, table settings references.
 */
export interface DefinitionFormatting {
    conditionalRules?: ConditionalFormattingDef[];
    tableSettings?: Record<string, unknown>;
}
export interface ConditionalFormattingDef {
    field: string;
    condition: string;
    value: unknown;
    style: Record<string, string>;
}
//# sourceMappingURL=formatting.d.ts.map