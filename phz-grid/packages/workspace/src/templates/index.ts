export { analyzeSchema } from './schema-analyzer.js';
export type { FieldProfile } from './schema-analyzer.js';
export { matchTemplates } from './template-matcher.js';
export type { ScoredTemplate } from './template-matcher.js';
export { DEFAULT_TEMPLATES, registerDefaultTemplates } from './default-templates.js';
export { filterTemplates, groupTemplatesByCategory } from './phz-template-gallery.js';
export { buildSuggestionPipeline } from './phz-suggestion-flow.js';
export type { SuggestionResult } from './phz-suggestion-flow.js';
export { resolveBindings, autoBindFields } from './template-bindings.js';
export type { TemplateBinding } from './template-bindings.js';
export { validateTemplate } from './template-validator.js';
// ValidationResult re-exported from registry/config-schemas (same shape, single source of truth)
