import { describe, it, expect } from 'vitest';
import { validateTemplate } from '../templates/template-validator.js';
import { createManifestRegistry } from '../registry/widget-registry.js';
import { registerDefaultManifests } from '../registry/default-manifests.js';
import { DEFAULT_TEMPLATES } from '../templates/default-templates.js';
import type { TemplateDefinition } from '../types.js';
import { templateId } from '../types.js';

function makeRegistry() {
  const reg = createManifestRegistry();
  registerDefaultManifests(reg);
  return reg;
}

function makeTemplate(overrides: Partial<TemplateDefinition> = {}): TemplateDefinition {
  return {
    id: templateId('tpl-test'),
    name: 'Test Template',
    description: 'A test template',
    category: 'general',
    layout: { kind: 'auto-grid', minItemWidth: 200, gap: 16, children: [{ kind: 'widget', widgetId: 'slot-1' }] },
    widgetSlots: [{ slotId: 'slot-1', widgetType: 'bar-chart', defaultConfig: {}, fieldBindings: {} }],
    matchRules: [{ requiredFieldTypes: [{ type: 'number', minCount: 1 }], weight: 10, rationale: 'test' }],
    tags: ['test'],
    builtIn: true,
    ...overrides,
  } as TemplateDefinition;
}

describe('TemplateValidator', () => {
  it('returns valid for a well-formed template', () => {
    const registry = makeRegistry();
    const result = validateTemplate(makeTemplate(), registry);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('reports error for missing name', () => {
    const registry = makeRegistry();
    const result = validateTemplate(makeTemplate({ name: '' }), registry);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('name'))).toBe(true);
  });

  it('reports error for empty widgetSlots', () => {
    const registry = makeRegistry();
    const result = validateTemplate(makeTemplate({ widgetSlots: [] }), registry);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('widgetSlots'))).toBe(true);
  });

  it('reports error for unknown widget type', () => {
    const registry = makeRegistry();
    const tpl = makeTemplate({
      widgetSlots: [{ slotId: 'slot-1', widgetType: 'nonexistent-widget', defaultConfig: {}, fieldBindings: {} }],
    });
    const result = validateTemplate(tpl, registry);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('nonexistent-widget'))).toBe(true);
  });

  it('reports error for layout referencing missing slot', () => {
    const registry = makeRegistry();
    const tpl = makeTemplate({
      layout: { kind: 'auto-grid', minItemWidth: 200, gap: 16, children: [{ kind: 'widget', widgetId: 'missing-slot' }] },
    });
    const result = validateTemplate(tpl, registry);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('missing-slot'))).toBe(true);
  });

  it('reports error for empty matchRules', () => {
    const registry = makeRegistry();
    const result = validateTemplate(makeTemplate({ matchRules: [] }), registry);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('matchRules'))).toBe(true);
  });

  it('reports error for empty tags', () => {
    const registry = makeRegistry();
    const result = validateTemplate(makeTemplate({ tags: [] }), registry);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('tags'))).toBe(true);
  });

  it('validates all default templates pass validation', () => {
    const registry = makeRegistry();
    for (const tpl of DEFAULT_TEMPLATES) {
      const result = validateTemplate(tpl, registry);
      expect(result.valid, `Template "${tpl.name}" failed: ${result.errors.join(', ')}`).toBe(true);
    }
  });
});
