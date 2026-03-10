import { describe, it, expect } from 'vitest';
import { matchTemplates } from '../templates/template-matcher.js';
import type { ScoredTemplate } from '../templates/template-matcher.js';
import type { FieldProfile } from '../templates/schema-analyzer.js';
import type { TemplateDefinition } from '../types.js';
import { templateId } from '../types.js';

function makeTemplate(overrides: Partial<TemplateDefinition> & { id?: string }): TemplateDefinition {
  return {
    id: templateId(overrides.id ?? 'tpl-1'),
    name: 'Test Template',
    description: 'A test template',
    category: 'general',
    layout: { kind: 'auto-grid', minItemWidth: 200, gap: 16, children: [] },
    widgetSlots: [],
    matchRules: [],
    tags: [],
    builtIn: true,
    ...overrides,
  } as TemplateDefinition;
}

const profile: FieldProfile = {
  numericFields: ['revenue', 'cost'],
  categoricalFields: ['region', 'product'],
  dateFields: ['order_date'],
  identifierFields: ['customer_id'],
  suggestedMeasures: ['revenue', 'cost'],
  suggestedDimensions: ['region', 'product'],
  hasTimeSeries: true,
  hasCategorical: true,
  hasMultipleMeasures: true,
};

describe('TemplateMatcher', () => {
  it('scores templates based on matched rules', () => {
    const template = makeTemplate({
      matchRules: [
        { requiredFieldTypes: [{ type: 'number', minCount: 1 }], weight: 10, rationale: 'Needs numbers' },
        { requiredFieldTypes: [{ type: 'date', minCount: 1 }], weight: 5, rationale: 'Needs dates' },
      ],
    });
    const results = matchTemplates(profile, [template]);
    expect(results).toHaveLength(1);
    // Both rules match: (10 + 5) / (10 + 5) = 1.0
    expect(results[0].score).toBe(1.0);
  });

  it('returns partial scores for partially matched rules', () => {
    const template = makeTemplate({
      matchRules: [
        { requiredFieldTypes: [{ type: 'number', minCount: 1 }], weight: 10, rationale: 'Has numbers' },
        { requiredFieldTypes: [{ type: 'boolean', minCount: 5 }], weight: 10, rationale: 'Needs 5 booleans' },
      ],
    });
    const results = matchTemplates(profile, [template]);
    // Only first rule matches: 10 / 20 = 0.5
    expect(results[0].score).toBe(0.5);
  });

  it('sorts results by score descending', () => {
    const t1 = makeTemplate({
      id: 'good',
      name: 'Good Match',
      matchRules: [
        { requiredFieldTypes: [{ type: 'number', minCount: 1 }], weight: 10, rationale: '' },
        { requiredFieldTypes: [{ type: 'date', minCount: 1 }], weight: 10, rationale: '' },
      ],
    });
    const t2 = makeTemplate({
      id: 'weak',
      name: 'Weak Match',
      matchRules: [
        { requiredFieldTypes: [{ type: 'number', minCount: 1 }], weight: 5, rationale: '' },
        { requiredFieldTypes: [{ type: 'boolean', minCount: 10 }], weight: 15, rationale: '' },
      ],
    });
    const results = matchTemplates(profile, [t2, t1]);
    expect(results[0].template.name).toBe('Good Match');
    expect(results[1].template.name).toBe('Weak Match');
  });

  it('returns score 0 when no rules match', () => {
    const template = makeTemplate({
      matchRules: [
        { requiredFieldTypes: [{ type: 'boolean', minCount: 10 }], weight: 10, rationale: '' },
      ],
    });
    const results = matchTemplates(profile, [template]);
    expect(results[0].score).toBe(0);
  });

  it('returns score 0 for templates with no rules', () => {
    const template = makeTemplate({ matchRules: [] });
    const results = matchTemplates(profile, [template]);
    expect(results[0].score).toBe(0);
  });

  it('handles empty templates array', () => {
    expect(matchTemplates(profile, [])).toEqual([]);
  });

  it('matches semantic hint requirements', () => {
    const template = makeTemplate({
      matchRules: [
        { requiredFieldTypes: [{ type: 'number', semanticHint: 'measure', minCount: 1 }], weight: 10, rationale: '' },
      ],
    });
    const results = matchTemplates(profile, [template]);
    expect(results[0].score).toBe(1.0);
  });

  it('includes matched rationales', () => {
    const template = makeTemplate({
      matchRules: [
        { requiredFieldTypes: [{ type: 'number', minCount: 1 }], weight: 10, rationale: 'Has numeric data' },
      ],
    });
    const results = matchTemplates(profile, [template]);
    expect(results[0].matchedRationales).toContain('Has numeric data');
  });
});
