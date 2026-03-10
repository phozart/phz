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
/**
 * Convert DataAdapter schema fields into DataModelField[] for the sidebar.
 * Maps `dataType` → `type` and uses `label ?? name` as display name.
 */
export function fieldsFromSchema(fields) {
    return fields.map(f => ({
        name: f.name,
        type: f.dataType,
        label: f.label ?? f.name,
    }));
}
/**
 * Build the full sidebar props object from DataAdapter schema + engine artifacts.
 * Fields come from the DataAdapter; parameters, calculatedFields, metrics, kpis
 * come from the engine's data model (stored in the artifact).
 */
export function buildSidebarProps(input) {
    return {
        fields: fieldsFromSchema(input.schemaFields),
        parameters: input.parameters ?? [],
        calculatedFields: input.calculatedFields ?? [],
        metrics: input.metrics ?? [],
        kpis: input.kpis ?? [],
    };
}
//# sourceMappingURL=data-model-sidebar-wiring.js.map