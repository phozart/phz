/**
 * @phozart/workspace — Template Selection Logic
 *
 * Orchestrates the existing template pipeline for the creation flow.
 * Connects schema analysis -> template matching -> field auto-binding.
 */
import type { DataSourceSchema } from '../data-adapter.js';
import type { TemplateDefinition } from '../types.js';
import type { DashboardEditorState } from './dashboard-editor-state.js';
export interface TemplateSuggestion {
    template: TemplateDefinition;
    score: number;
    rationale: string;
    previewDescription: string;
}
export declare function suggestTemplatesForSource(schema: DataSourceSchema, templates?: TemplateDefinition[]): TemplateSuggestion[];
export declare function applyTemplate(template: TemplateDefinition, schema: DataSourceSchema, dataSourceId: string): DashboardEditorState;
export declare function saveAsTemplate(dashboardState: DashboardEditorState, meta: {
    name: string;
    description: string;
    category: string;
    tags?: string[];
}): TemplateDefinition;
export declare function _resetTemplateWidgetCounter(): void;
//# sourceMappingURL=template-selection.d.ts.map