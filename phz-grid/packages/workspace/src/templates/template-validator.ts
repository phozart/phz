/**
 * @phozart/phz-workspace — Template Validator
 *
 * Validates a TemplateDefinition against a ManifestRegistry
 * to ensure all referenced widget types exist and the layout is consistent.
 */

import type { TemplateDefinition } from '../types.js';
import type { ManifestRegistry } from '../registry/widget-registry.js';
import { flattenLayoutWidgets } from '../schema/config-layers.js';
import type { ValidationResult } from '../registry/config-schemas.js';

export type { ValidationResult };

export function validateTemplate(
  template: TemplateDefinition,
  registry: ManifestRegistry,
): ValidationResult {
  const errors: string[] = [];

  if (!template.name) {
    errors.push('Template name is required');
  }

  if (!template.widgetSlots || template.widgetSlots.length === 0) {
    errors.push('Template must have at least one entry in widgetSlots');
  }

  if (!template.matchRules || template.matchRules.length === 0) {
    errors.push('Template must have at least one entry in matchRules');
  }

  if (!template.tags || template.tags.length === 0) {
    errors.push('Template must have at least one entry in tags');
  }

  // Validate widget types exist in registry
  for (const slot of template.widgetSlots ?? []) {
    if (!registry.getManifest(slot.widgetType)) {
      errors.push(`Widget type "${slot.widgetType}" in slot "${slot.slotId}" is not registered in the manifest registry`);
    }
  }

  // Validate layout references match slot IDs
  const slotIds = new Set((template.widgetSlots ?? []).map(s => s.slotId));
  const layoutWidgetIds = flattenLayoutWidgets(template.layout);
  for (const wid of layoutWidgetIds) {
    if (!slotIds.has(wid)) {
      errors.push(`Layout references widget "${wid}" which is not defined in widgetSlots`);
    }
  }

  return { valid: errors.length === 0, errors };
}
