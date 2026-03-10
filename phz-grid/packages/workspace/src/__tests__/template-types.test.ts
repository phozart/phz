import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryWorkspaceAdapter } from '../adapters/memory-adapter.js';
import type { TemplateDefinition, TemplateWidgetSlot, TemplateMatchRule } from '../types.js';
import { templateId } from '../types.js';
import type { LayoutNode } from '../schema/config-layers.js';

function makeTemplate(id: string, overrides?: Partial<TemplateDefinition>): TemplateDefinition {
  const layout: LayoutNode = {
    kind: 'auto-grid',
    minItemWidth: 200,
    gap: 16,
    children: [
      { kind: 'widget', widgetId: 'w1' },
      { kind: 'widget', widgetId: 'w2' },
    ],
  };

  return {
    id: templateId(id),
    name: `Template ${id}`,
    description: `Description for ${id}`,
    category: 'general',
    layout,
    widgetSlots: [
      {
        slotId: 'slot-1',
        widgetType: 'bar-chart',
        defaultConfig: { stacked: false },
        fieldBindings: { x: 'category', y: 'value' },
      },
    ],
    matchRules: [
      {
        requiredFieldTypes: [
          { type: 'string', minCount: 1 },
          { type: 'number', minCount: 1 },
        ],
        weight: 1.0,
        rationale: 'Requires at least one string and one number field',
      },
    ],
    tags: ['starter'],
    builtIn: true,
    ...overrides,
  };
}

describe('TemplateDefinition types', () => {
  it('creates a TemplateId branded type', () => {
    const id = templateId('tpl-001');
    // At runtime it's just a string, but TypeScript enforces the brand
    expect(typeof id).toBe('string');
    expect(id).toBe('tpl-001');
  });

  it('TemplateDefinition has required shape', () => {
    const tpl = makeTemplate('tpl-001');

    expect(tpl.id).toBe('tpl-001');
    expect(tpl.name).toBe('Template tpl-001');
    expect(tpl.description).toBe('Description for tpl-001');
    expect(tpl.category).toBe('general');
    expect(tpl.layout.kind).toBe('auto-grid');
    expect(tpl.widgetSlots).toHaveLength(1);
    expect(tpl.matchRules).toHaveLength(1);
    expect(tpl.tags).toContain('starter');
    expect(tpl.builtIn).toBe(true);
  });

  it('TemplateWidgetSlot includes optional variantId', () => {
    const slot: TemplateWidgetSlot = {
      slotId: 'slot-1',
      widgetType: 'pie-chart',
      variantId: 'donut',
      defaultConfig: { showLegend: true },
      fieldBindings: { value: 'amount' },
    };
    expect(slot.variantId).toBe('donut');
  });

  it('TemplateWidgetSlot works without variantId', () => {
    const slot: TemplateWidgetSlot = {
      slotId: 'slot-2',
      widgetType: 'kpi-card',
      defaultConfig: {},
      fieldBindings: { metric: 'revenue' },
    };
    expect(slot.variantId).toBeUndefined();
  });

  it('TemplateMatchRule has correct shape', () => {
    const rule: TemplateMatchRule = {
      requiredFieldTypes: [
        { type: 'date', semanticHint: 'timestamp', minCount: 1 },
        { type: 'number', minCount: 2 },
      ],
      weight: 0.8,
      rationale: 'Time-series template needs a date and two measures',
    };
    expect(rule.requiredFieldTypes).toHaveLength(2);
    expect(rule.requiredFieldTypes[0].semanticHint).toBe('timestamp');
    expect(rule.weight).toBe(0.8);
  });

  it('TemplateDefinition optional thumbnail', () => {
    const withThumb = makeTemplate('t1', { thumbnail: 'thumb.png' });
    const noThumb = makeTemplate('t2');

    expect(withThumb.thumbnail).toBe('thumb.png');
    expect(noThumb.thumbnail).toBeUndefined();
  });

  it('layout field accepts all LayoutNode types', () => {
    const tabsTemplate = makeTemplate('tabs', {
      layout: {
        kind: 'tabs',
        tabs: [
          { label: 'Overview', children: [{ kind: 'widget', widgetId: 'w1' }] },
          { label: 'Detail', children: [{ kind: 'widget', widgetId: 'w2' }] },
        ],
      },
    });
    expect(tabsTemplate.layout.kind).toBe('tabs');

    const sectionsTemplate = makeTemplate('sections', {
      layout: {
        kind: 'sections',
        sections: [
          { title: 'KPIs', children: [{ kind: 'widget', widgetId: 'w1' }] },
        ],
      },
    });
    expect(sectionsTemplate.layout.kind).toBe('sections');
  });
});

describe('MemoryWorkspaceAdapter template methods', () => {
  let adapter: MemoryWorkspaceAdapter;

  beforeEach(async () => {
    adapter = new MemoryWorkspaceAdapter();
    await adapter.initialize();
  });

  it('saveTemplate and loadTemplates round-trip', async () => {
    const tpl = makeTemplate('tpl-001');
    await adapter.saveTemplate(tpl);

    const loaded = await adapter.loadTemplates();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe('tpl-001');
    expect(loaded[0].name).toBe('Template tpl-001');
  });

  it('saveTemplate overwrites existing template', async () => {
    await adapter.saveTemplate(makeTemplate('tpl-001', { name: 'V1' }));
    await adapter.saveTemplate(makeTemplate('tpl-001', { name: 'V2' }));

    const loaded = await adapter.loadTemplates();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].name).toBe('V2');
  });

  it('deleteTemplate removes a template', async () => {
    const tpl = makeTemplate('tpl-001');
    await adapter.saveTemplate(tpl);
    await adapter.deleteTemplate(templateId('tpl-001'));

    const loaded = await adapter.loadTemplates();
    expect(loaded).toHaveLength(0);
  });

  it('deleteTemplate is a no-op for non-existent template', async () => {
    // Should not throw
    await adapter.deleteTemplate(templateId('nonexistent'));
    const loaded = await adapter.loadTemplates();
    expect(loaded).toHaveLength(0);
  });

  it('loadTemplates returns empty array when none exist', async () => {
    const loaded = await adapter.loadTemplates();
    expect(loaded).toEqual([]);
  });

  it('clear removes templates', async () => {
    await adapter.saveTemplate(makeTemplate('tpl-001'));
    await adapter.clear();

    const loaded = await adapter.loadTemplates();
    expect(loaded).toHaveLength(0);
  });

  it('handles multiple templates', async () => {
    await adapter.saveTemplate(makeTemplate('tpl-001'));
    await adapter.saveTemplate(makeTemplate('tpl-002'));
    await adapter.saveTemplate(makeTemplate('tpl-003'));

    const loaded = await adapter.loadTemplates();
    expect(loaded).toHaveLength(3);
  });
});
