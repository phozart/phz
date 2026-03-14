/**
 * @phozart/shared — MeasureRegistryAdapter SPI
 *
 * Editor-only adapter for managing measure and KPI definitions.
 * Used by the BI authoring environment to discover, create,
 * and validate calculated measures.
 */
export interface MeasureDefinition {
    id: string;
    name: string;
    description?: string;
    expression: string;
    dataType: 'number' | 'currency' | 'percentage';
    formatPattern?: string;
    tags?: string[];
    dataSourceId: string;
    createdAt: number;
    updatedAt: number;
}
export interface KPIDefinition {
    id: string;
    name: string;
    description?: string;
    measureId: string;
    targetValue?: number;
    targetDirection: 'higher-is-better' | 'lower-is-better' | 'on-target';
    thresholds?: {
        good: number;
        warning: number;
        critical: number;
    };
    unit?: string;
    tags?: string[];
    createdAt: number;
    updatedAt: number;
}
/**
 * Editor-only measure registry SPI. Provides access to the organization's
 * catalog of reusable measures and KPIs. This adapter is NOT required
 * for view-only shells.
 */
export interface MeasureRegistryAdapter {
    /**
     * List all measures, optionally filtered by data source.
     */
    listMeasures(dataSourceId?: string): Promise<MeasureDefinition[]>;
    /**
     * Get a single measure by ID.
     */
    getMeasure(measureId: string): Promise<MeasureDefinition | null>;
    /**
     * Save (create or update) a measure definition.
     */
    saveMeasure(measure: MeasureDefinition): Promise<{
        id: string;
        success: boolean;
    }>;
    /**
     * Delete a measure by ID.
     */
    deleteMeasure(measureId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Validate a measure expression against a data source schema.
     */
    validateExpression?(expression: string, dataSourceId: string): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    /**
     * List all KPI definitions, optionally filtered by tags.
     */
    listKPIs(tags?: string[]): Promise<KPIDefinition[]>;
    /**
     * Get a single KPI by ID.
     */
    getKPI(kpiId: string): Promise<KPIDefinition | null>;
    /**
     * Save (create or update) a KPI definition.
     */
    saveKPI(kpi: KPIDefinition): Promise<{
        id: string;
        success: boolean;
    }>;
    /**
     * Delete a KPI by ID.
     */
    deleteKPI(kpiId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
}
//# sourceMappingURL=measure-registry-adapter.d.ts.map