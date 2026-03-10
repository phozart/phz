import { describe, it, expect } from 'vitest';
import { previewRule } from '../criteria/filter-rules.js';
import type { FilterRule, SelectionFieldOption } from '@phozart/phz-core';
import { filterDefinitionId } from '@phozart/phz-core';

const REGION_ID = filterDefinitionId('region');

const OPTIONS: SelectionFieldOption[] = [
  { value: 'US', label: 'United States' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'JP', label: 'Japan' },
];

function makeRule(id: string, overrides: Partial<FilterRule>): FilterRule {
  return {
    id,
    filterDefinitionId: REGION_ID,
    type: 'value_set',
    priority: 0,
    enabled: true,
    config: { type: 'value_set', mode: 'include', values: [] },
    createdAt: Date.now(),
    ...overrides,
  } as FilterRule;
}

describe('previewRule — admin preview', () => {
  it('returns before with all options', () => {
    const rule = makeRule('r1', {
      config: { type: 'value_set', mode: 'include', values: ['US'] },
    });
    const { before } = previewRule(rule, OPTIONS);
    expect(before).toHaveLength(5);
  });

  it('returns after with filtered options', () => {
    const rule = makeRule('r1', {
      config: { type: 'value_set', mode: 'include', values: ['US', 'DE'] },
    });
    const { after } = previewRule(rule, OPTIONS);
    expect(after).toHaveLength(2);
    expect(after.map(o => o.value)).toEqual(['US', 'DE']);
  });

  it('exclude_pattern preview', () => {
    const rule = makeRule('r1', {
      type: 'exclude_pattern',
      config: { type: 'exclude_pattern', pattern: 'Japan', flags: 'i' },
    });
    const { before, after } = previewRule(rule, OPTIONS);
    expect(before).toHaveLength(5);
    expect(after).toHaveLength(4);
    expect(after.every(o => o.value !== 'JP')).toBe(true);
  });

  it('include_pattern preview', () => {
    const rule = makeRule('r1', {
      type: 'include_pattern',
      config: { type: 'include_pattern', pattern: '^U' },
    });
    const { after } = previewRule(rule, OPTIONS);
    expect(after).toHaveLength(2);
  });

  it('value_set exclude preview', () => {
    const rule = makeRule('r1', {
      config: { type: 'value_set', mode: 'exclude', values: ['FR', 'JP'] },
    });
    const { after } = previewRule(rule, OPTIONS);
    expect(after).toHaveLength(3);
  });

  it('empty value set returns nothing', () => {
    const rule = makeRule('r1', {
      config: { type: 'value_set', mode: 'include', values: [] },
    });
    const { after } = previewRule(rule, OPTIONS);
    expect(after).toHaveLength(0);
  });

  it('before and after are different objects', () => {
    const rule = makeRule('r1', {
      config: { type: 'value_set', mode: 'include', values: ['US'] },
    });
    const { before, after } = previewRule(rule, OPTIONS);
    expect(before).not.toBe(after);
  });

  it('preserves option labels in after', () => {
    const rule = makeRule('r1', {
      config: { type: 'value_set', mode: 'include', values: ['US'] },
    });
    const { after } = previewRule(rule, OPTIONS);
    expect(after[0].label).toBe('United States');
  });

  it('exclude all results in empty after', () => {
    const rule = makeRule('r1', {
      config: { type: 'value_set', mode: 'exclude', values: ['US', 'UK', 'DE', 'FR', 'JP'] },
    });
    const { after } = previewRule(rule, OPTIONS);
    expect(after).toHaveLength(0);
  });

  it('unknown custom evaluator passes through in preview', () => {
    const rule = makeRule('r1', {
      type: 'custom',
      config: { type: 'custom', evaluatorKey: 'nonexistent' },
    });
    const { before, after } = previewRule(rule, OPTIONS);
    expect(before).toHaveLength(5);
    expect(after).toHaveLength(5);
  });

  it('handles case-sensitive pattern correctly', () => {
    const rule = makeRule('r1', {
      type: 'include_pattern',
      config: { type: 'include_pattern', pattern: 'united' },
    });
    const { after } = previewRule(rule, OPTIONS);
    // Case-sensitive: 'united' won't match 'United States' or 'United Kingdom'
    expect(after).toHaveLength(0);
  });

  it('handles case-insensitive pattern', () => {
    const rule = makeRule('r1', {
      type: 'include_pattern',
      config: { type: 'include_pattern', pattern: 'united', flags: 'i' },
    });
    const { after } = previewRule(rule, OPTIONS);
    expect(after).toHaveLength(2);
  });

  it('preserves before array when no matching pattern', () => {
    const rule = makeRule('r1', {
      type: 'include_pattern',
      config: { type: 'include_pattern', pattern: 'zzzzz' },
    });
    const { before, after } = previewRule(rule, OPTIONS);
    expect(before).toHaveLength(5);
    expect(after).toHaveLength(0);
  });
});
