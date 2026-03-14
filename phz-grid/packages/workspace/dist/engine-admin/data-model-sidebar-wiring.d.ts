/**
 * data-model-sidebar-wiring — Pure functions that bridge DataAdapter schema
 * output to <phz-data-model-sidebar> input properties.
 *
 * The sidebar is presentation-only: it takes 5 typed arrays. This module
 * converts DataAdapter.getSchema() FieldMetadata[] into DataModelField[]
 * and assembles the full SidebarProps object.
 *
 * Task: 1.3 (WB-005)
 */
import type { DataModelField, ParameterDef, CalculatedFieldDef, MetricDef, KPIDefinition } from '@phozart/engine';
/** The full set of properties the sidebar component accepts. */
export interface SidebarProps {
    fields: DataModelField[];
    parameters: ParameterDef[];
    calculatedFields: CalculatedFieldDef[];
    metrics: MetricDef[];
    kpis: KPIDefinition[];
}
/** Minimal field metadata needed for conversion. */
interface SchemaField {
    name: string;
    dataType: 'string' | 'number' | 'date' | 'boolean';
    label?: string;
}
/**
 * Convert DataAdapter schema fields into DataModelField[] for the sidebar.
 * Maps `dataType` → `type` and uses `label ?? name` as display name.
 */
export declare function fieldsFromSchema(fields: readonly SchemaField[]): DataModelField[];
/** Input for buildSidebarProps — schemaFields are required, rest are optional. */
export interface SidebarPropsInput {
    schemaFields: readonly SchemaField[];
    parameters?: ParameterDef[];
    calculatedFields?: CalculatedFieldDef[];
    metrics?: MetricDef[];
    kpis?: KPIDefinition[];
}
/**
 * Build the full sidebar props object from DataAdapter schema + engine artifacts.
 * Fields come from the DataAdapter; parameters, calculatedFields, metrics, kpis
 * come from the engine's data model (stored in the artifact).
 */
export declare function buildSidebarProps(input: SidebarPropsInput): SidebarProps;
export {};
//# sourceMappingURL=data-model-sidebar-wiring.d.ts.map