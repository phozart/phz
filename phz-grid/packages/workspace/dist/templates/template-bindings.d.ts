/**
 * @phozart/phz-workspace — Template Bindings
 *
 * Resolves field bindings for template widget slots and provides
 * auto-binding heuristics based on FieldProfile.
 */
import type { TemplateWidgetSlot } from '../types.js';
import type { FieldProfile } from './schema-analyzer.js';
export interface TemplateBinding {
    slotId: string;
    bindingKey: string;
    fieldName: string;
}
export declare function resolveBindings(slots: TemplateWidgetSlot[], bindings: TemplateBinding[]): Map<string, Record<string, string>>;
export declare function autoBindFields(slots: TemplateWidgetSlot[], profile: FieldProfile): TemplateBinding[];
//# sourceMappingURL=template-bindings.d.ts.map