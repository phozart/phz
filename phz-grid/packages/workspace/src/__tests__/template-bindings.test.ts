import { describe, it, expect } from 'vitest';
import { resolveBindings, autoBindFields } from '../templates/template-bindings.js';
import type { TemplateBinding } from '../templates/template-bindings.js';
import type { TemplateWidgetSlot } from '../types.js';
import type { FieldProfile } from '../templates/schema-analyzer.js';

describe('TemplateBindings', () => {
  const slots: TemplateWidgetSlot[] = [
    { slotId: 'kpi-1', widgetType: 'kpi-card', defaultConfig: {}, fieldBindings: { value: 'measure_field' } },
    { slotId: 'chart-1', widgetType: 'bar-chart', defaultConfig: {}, fieldBindings: { value: 'measure_field', category: 'dimension_field' } },
  ];

  describe('resolveBindings', () => {
    it('resolves explicit bindings', () => {
      const bindings: TemplateBinding[] = [
        { slotId: 'kpi-1', bindingKey: 'value', fieldName: 'revenue' },
        { slotId: 'chart-1', bindingKey: 'value', fieldName: 'revenue' },
        { slotId: 'chart-1', bindingKey: 'category', fieldName: 'region' },
      ];
      const resolved = resolveBindings(slots, bindings);
      expect(resolved.get('kpi-1')!.value).toBe('revenue');
      expect(resolved.get('chart-1')!.value).toBe('revenue');
      expect(resolved.get('chart-1')!.category).toBe('region');
    });

    it('uses default bindings when no explicit binding given', () => {
      const bindings: TemplateBinding[] = [
        { slotId: 'kpi-1', bindingKey: 'value', fieldName: 'revenue' },
      ];
      const resolved = resolveBindings(slots, bindings);
      // chart-1 has no explicit bindings, so defaults used
      expect(resolved.get('chart-1')!.value).toBe('measure_field');
      expect(resolved.get('chart-1')!.category).toBe('dimension_field');
    });

    it('returns empty map for empty slots', () => {
      expect(resolveBindings([], []).size).toBe(0);
    });
  });

  describe('autoBindFields', () => {
    const profile: FieldProfile = {
      numericFields: ['revenue', 'cost'],
      categoricalFields: ['region', 'product'],
      dateFields: ['order_date'],
      identifierFields: ['id'],
      suggestedMeasures: ['revenue', 'cost'],
      suggestedDimensions: ['region', 'product'],
      hasTimeSeries: true,
      hasCategorical: true,
      hasMultipleMeasures: true,
    };

    it('auto-binds measure fields to measure slots', () => {
      const bindings = autoBindFields(slots, profile);
      const kpiBinding = bindings.find(b => b.slotId === 'kpi-1' && b.bindingKey === 'value');
      expect(kpiBinding).toBeDefined();
      expect(profile.suggestedMeasures).toContain(kpiBinding!.fieldName);
    });

    it('auto-binds dimension fields to dimension slots', () => {
      const bindings = autoBindFields(slots, profile);
      const catBinding = bindings.find(b => b.slotId === 'chart-1' && b.bindingKey === 'category');
      expect(catBinding).toBeDefined();
      expect(profile.suggestedDimensions).toContain(catBinding!.fieldName);
    });

    it('handles empty profile gracefully', () => {
      const emptyProfile: FieldProfile = {
        numericFields: [], categoricalFields: [], dateFields: [],
        identifierFields: [], suggestedMeasures: [], suggestedDimensions: [],
        hasTimeSeries: false, hasCategorical: false, hasMultipleMeasures: false,
      };
      const bindings = autoBindFields(slots, emptyProfile);
      expect(bindings).toEqual([]);
    });
  });
});
