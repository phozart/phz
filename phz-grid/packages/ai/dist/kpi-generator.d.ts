/**
 * @phozart/ai — KPI Generator
 *
 * Generates KPI configurations from natural language descriptions + data schema.
 * Uses the NL parser for extraction and fuzzy field matching.
 */
import type { KPIDirection } from './nl-parser.js';
export interface KPIGeneratorField {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date';
}
export type KPIGeneratorSchema = KPIGeneratorField[];
export interface GeneratedKPIConfig {
    id: string;
    name: string;
    field: string;
    aggregation: string;
    target: number;
    direction: KPIDirection;
    unit: string;
    thresholds: {
        ok: number;
        warn: number;
    };
    deltaComparison: string;
    dataSource: {
        scoreEndpoint: string;
        trendEndpoint?: string;
    };
    dimensions: string[];
}
export declare function generateKPIConfig(description: string, schema: KPIGeneratorSchema): GeneratedKPIConfig;
//# sourceMappingURL=kpi-generator.d.ts.map