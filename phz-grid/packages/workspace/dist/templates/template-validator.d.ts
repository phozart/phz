/**
 * @phozart/phz-workspace — Template Validator
 *
 * Validates a TemplateDefinition against a ManifestRegistry
 * to ensure all referenced widget types exist and the layout is consistent.
 */
import type { TemplateDefinition } from '../types.js';
import type { ManifestRegistry } from '../registry/widget-registry.js';
import type { ValidationResult } from '../registry/config-schemas.js';
export type { ValidationResult };
export declare function validateTemplate(template: TemplateDefinition, registry: ManifestRegistry): ValidationResult;
//# sourceMappingURL=template-validator.d.ts.map