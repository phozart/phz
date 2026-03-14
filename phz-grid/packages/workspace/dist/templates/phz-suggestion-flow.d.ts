/**
 * @phozart/workspace — Suggestion Flow
 *
 * End-to-end pipeline: schema -> profile -> match -> ranked suggestions.
 */
import { LitElement } from 'lit';
import type { DataSourceSchema } from '../data-adapter.js';
import type { TemplateDefinition } from '../types.js';
import { type FieldProfile } from './schema-analyzer.js';
import { type ScoredTemplate } from './template-matcher.js';
export interface SuggestionResult extends ScoredTemplate {
    profile: FieldProfile;
}
export declare function buildSuggestionPipeline(schema: DataSourceSchema, templates: TemplateDefinition[]): SuggestionResult[];
export declare class PhzSuggestionFlow extends LitElement {
    static styles: import("lit").CSSResult;
    schema?: DataSourceSchema;
    templates: TemplateDefinition[];
    render(): import("lit-html").TemplateResult<1>;
    private _select;
}
//# sourceMappingURL=phz-suggestion-flow.d.ts.map