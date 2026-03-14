/**
 * @phozart/workspace — Template Matcher
 *
 * Scores TemplateDefinition objects against a FieldProfile by evaluating
 * match rules. Returns sorted ScoredTemplate[] (best match first).
 */
import type { FieldProfile } from './schema-analyzer.js';
import type { TemplateDefinition } from '../types.js';
export interface ScoredTemplate {
    template: TemplateDefinition;
    score: number;
    matchedRationales: string[];
    profile: FieldProfile;
}
export declare function matchTemplates(profile: FieldProfile, templates: TemplateDefinition[]): ScoredTemplate[];
//# sourceMappingURL=template-matcher.d.ts.map