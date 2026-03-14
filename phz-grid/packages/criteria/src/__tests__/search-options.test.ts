import { describe, it, expect } from 'vitest';
import { filterSearchOptions } from '../components/fields/phz-searchable-dropdown.js';
import type { SelectionFieldOption, SearchFieldConfig } from '@phozart/core';

const OPTIONS: SelectionFieldOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'apricot', label: 'Apricot' },
  { value: 'blueberry', label: 'Blueberry' },
  { value: 'pineapple', label: 'Pineapple' },
];

describe('filterSearchOptions', () => {
  it('contains match (default) — substring match', () => {
    const result = filterSearchOptions(OPTIONS, 'app', {});
    expect(result.map(o => o.value)).toEqual(['apple', 'pineapple']);
  });

  it('beginsWith match — prefix only', () => {
    const result = filterSearchOptions(OPTIONS, 'app', { matchMode: 'beginsWith' });
    expect(result.map(o => o.value)).toEqual(['apple']);
  });

  it('single value (default) — whole query as one term', () => {
    const result = filterSearchOptions(OPTIONS, 'ban', {});
    expect(result.map(o => o.value)).toEqual(['banana']);
  });

  it('multi-value — space-separated OR logic', () => {
    const result = filterSearchOptions(OPTIONS, 'apple banana', { multiValue: true });
    expect(result.map(o => o.value)).toEqual(['apple', 'banana', 'pineapple']);
  });

  it('multi-value + beginsWith combined', () => {
    const result = filterSearchOptions(OPTIONS, 'app ban', { multiValue: true, matchMode: 'beginsWith' });
    // 'app' prefix-matches Apple; 'ban' prefix-matches Banana; Apricot starts with 'apr' not 'app'
    expect(result.map(o => o.value)).toEqual(['apple', 'banana']);
  });

  it('minChars respected per token in multi-value mode', () => {
    const result = filterSearchOptions(OPTIONS, 'a banana', { multiValue: true, minChars: 3 });
    // 'a' is < 3 chars so only 'banana' token is valid
    expect(result.map(o => o.value)).toEqual(['banana']);
  });

  it('empty query returns empty array', () => {
    expect(filterSearchOptions(OPTIONS, '', {})).toEqual([]);
  });

  it('short query below minChars returns empty array', () => {
    expect(filterSearchOptions(OPTIONS, 'a', { minChars: 3 })).toEqual([]);
  });

  it('respects maxSuggestions limit', () => {
    const result = filterSearchOptions(OPTIONS, 'a', { maxSuggestions: 2 });
    expect(result).toHaveLength(2);
  });

  it('case-insensitive matching', () => {
    const result = filterSearchOptions(OPTIONS, 'APPLE', {});
    expect(result.map(o => o.value)).toEqual(['apple', 'pineapple']);
  });
});
