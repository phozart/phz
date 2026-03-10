/**
 * @phozart/phz-ai — Dashboard Generator
 *
 * Generates dashboard configurations from data schema + natural language prompt.
 * Uses heuristic-based schema analysis (no LLM calls).
 */
import type { WidgetType } from '@phozart/phz-engine';
import type { FieldInput } from './schema-analyzer.js';
export interface DashboardGeneratorOptions {
    name?: string;
    maxWidgets?: number;
    columns?: number;
}
export interface DashboardGeneratorInput {
    fields: FieldInput[];
    prompt: string;
    options?: DashboardGeneratorOptions;
}
export interface GeneratedWidget {
    id: string;
    type: WidgetType;
    name: string;
    fields: string[];
}
export interface GeneratedPlacement {
    widgetId: string;
    column: number;
    order: number;
    colSpan: number;
}
export interface GeneratedDashboard {
    name: string;
    layout: {
        columns: number;
        gap: number;
    };
    widgets: GeneratedWidget[];
    placements: GeneratedPlacement[];
}
export declare function generateDashboardConfig(input: DashboardGeneratorInput): GeneratedDashboard;
//# sourceMappingURL=dashboard-generator.d.ts.map