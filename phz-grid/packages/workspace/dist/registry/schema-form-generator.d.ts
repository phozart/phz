/**
 * @phozart/phz-workspace — Schema Form Generator
 *
 * Generates UI field descriptors from a simple JSON Schema-like object,
 * enabling dynamic form rendering for widget configuration panels.
 */
export interface FormFieldDescriptor {
    name: string;
    type: 'text' | 'number' | 'checkbox' | 'select' | 'color' | 'array';
    label: string;
    required: boolean;
    defaultValue?: unknown;
    options?: string[];
    min?: number;
    max?: number;
}
export interface PropertyDef {
    type: string;
    label: string;
    default?: unknown;
    enum?: string[];
    format?: string;
    min?: number;
    max?: number;
    items?: {
        type: string;
    };
}
export interface SimpleSchema {
    properties: Record<string, PropertyDef>;
    required?: string[];
}
export declare function generateFormFields(schema: SimpleSchema): FormFieldDescriptor[];
//# sourceMappingURL=schema-form-generator.d.ts.map