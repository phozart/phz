import { describe, it, expect } from 'vitest';
import type { WidgetVariant } from '../types.js';
import { filterVariants, sortVariantsByName } from '../registry/phz-variant-picker.js';

describe('VariantPicker utilities', () => {
  const variants: WidgetVariant[] = [
    { id: 'stacked', name: 'Stacked Bar', description: 'Stacked variant', presetConfig: { stacked: true } },
    { id: 'grouped', name: 'Grouped Bar', description: 'Grouped side by side', presetConfig: { grouped: true } },
    { id: 'horizontal', name: 'Horizontal Bar', description: 'Horizontal orientation', presetConfig: { horizontal: true } },
  ];

  describe('filterVariants', () => {
    it('returns all when query is empty', () => {
      expect(filterVariants(variants, '')).toHaveLength(3);
    });

    it('filters by name case-insensitively', () => {
      const result = filterVariants(variants, 'stacked');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('stacked');
    });

    it('filters by description', () => {
      const result = filterVariants(variants, 'side by side');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('grouped');
    });

    it('returns empty for no match', () => {
      expect(filterVariants(variants, 'nonexistent')).toEqual([]);
    });
  });

  describe('sortVariantsByName', () => {
    it('sorts alphabetically by name', () => {
      const sorted = sortVariantsByName(variants);
      expect(sorted.map(v => v.id)).toEqual(['grouped', 'horizontal', 'stacked']);
    });

    it('does not mutate the original array', () => {
      const original = [...variants];
      sortVariantsByName(variants);
      expect(variants).toEqual(original);
    });
  });
});
