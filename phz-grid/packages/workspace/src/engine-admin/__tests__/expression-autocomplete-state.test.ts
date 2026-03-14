import { describe, it, expect } from 'vitest';
import {
  type SuggestionKind,
  type AutocompleteSuggestion,
  type AutocompleteContext,
  type ExpressionAutocompleteState,
  createExpressionAutocompleteState,
  computeSuggestions,
  selectNext,
  selectPrevious,
  acceptSuggestion,
  dismissAutocomplete,
  getSelectedSuggestion,
} from '../expression-autocomplete-state.js';

function makeContext(overrides: Partial<AutocompleteContext> = {}): AutocompleteContext {
  return {
    fields: ['revenue', 'region', 'product_name'],
    parameters: ['start_date', 'end_date'],
    metrics: ['total_revenue', 'avg_order_value'],
    calculatedFields: ['profit_margin', 'discount_rate'],
    level: 'row',
    ...overrides,
  };
}

describe('expression-autocomplete-state', () => {
  // ── createExpressionAutocompleteState ──

  describe('createExpressionAutocompleteState', () => {
    it('creates a closed, empty state', () => {
      const s = createExpressionAutocompleteState();
      expect(s.open).toBe(false);
      expect(s.suggestions).toEqual([]);
      expect(s.selectedIndex).toBe(0);
      expect(s.query).toBe('');
      expect(s.anchorPosition).toBe(0);
    });
  });

  // ── computeSuggestions ──

  describe('computeSuggestions', () => {
    it('after "[" shows field suggestions only', () => {
      const s = createExpressionAutocompleteState();
      const ctx = makeContext();
      const next = computeSuggestions(s, '[', 1, ctx);

      expect(next.open).toBe(true);
      expect(next.suggestions.length).toBe(3);
      expect(next.suggestions.every((sg) => sg.kind === 'field')).toBe(true);
      // insertText format: field_name]
      expect(next.suggestions.map((sg) => sg.insertText)).toEqual(
        expect.arrayContaining(['product_name]', 'region]', 'revenue]']),
      );
    });

    it('after "$" shows parameter suggestions only', () => {
      const s = createExpressionAutocompleteState();
      const ctx = makeContext();
      const next = computeSuggestions(s, '$', 1, ctx);

      expect(next.open).toBe(true);
      expect(next.suggestions.length).toBe(2);
      expect(next.suggestions.every((sg) => sg.kind === 'parameter')).toBe(true);
      expect(next.suggestions.map((sg) => sg.insertText)).toEqual(
        expect.arrayContaining(['end_date', 'start_date']),
      );
    });

    it('after "@" shows metric suggestions at metric level', () => {
      const s = createExpressionAutocompleteState();
      const ctx = makeContext({ level: 'metric' });
      const next = computeSuggestions(s, '@', 1, ctx);

      expect(next.open).toBe(true);
      expect(next.suggestions.length).toBe(2);
      expect(next.suggestions.every((sg) => sg.kind === 'metric')).toBe(true);
      expect(next.suggestions.map((sg) => sg.insertText)).toEqual(
        expect.arrayContaining(['avg_order_value', 'total_revenue']),
      );
    });

    it('after "@" shows nothing at row level', () => {
      const s = createExpressionAutocompleteState();
      const ctx = makeContext({ level: 'row' });
      const next = computeSuggestions(s, '@', 1, ctx);

      expect(next.open).toBe(false);
      expect(next.suggestions).toEqual([]);
    });

    it('after "~" shows calc field suggestions at row level', () => {
      const s = createExpressionAutocompleteState();
      const ctx = makeContext({ level: 'row' });
      const next = computeSuggestions(s, '~', 1, ctx);

      expect(next.open).toBe(true);
      expect(next.suggestions.length).toBe(2);
      expect(next.suggestions.every((sg) => sg.kind === 'calc-field')).toBe(true);
      expect(next.suggestions.map((sg) => sg.insertText)).toEqual(
        expect.arrayContaining(['discount_rate', 'profit_margin']),
      );
    });

    it('after "~" shows nothing at metric level', () => {
      const s = createExpressionAutocompleteState();
      const ctx = makeContext({ level: 'metric' });
      const next = computeSuggestions(s, '~', 1, ctx);

      expect(next.open).toBe(false);
      expect(next.suggestions).toEqual([]);
    });

    it('with partial token filters by prefix', () => {
      const s = createExpressionAutocompleteState();
      const ctx = makeContext();
      // After "[re" → should match "region" and "revenue" only
      const next = computeSuggestions(s, '[re', 3, ctx);

      expect(next.open).toBe(true);
      expect(next.suggestions.length).toBe(2);
      expect(next.suggestions.map((sg) => sg.label)).toEqual(
        expect.arrayContaining(['region', 'revenue']),
      );
    });

    it('filters case-insensitively', () => {
      const s = createExpressionAutocompleteState();
      const ctx = makeContext();
      // After "[RE" → should still match region and revenue
      const next = computeSuggestions(s, '[RE', 3, ctx);

      expect(next.open).toBe(true);
      expect(next.suggestions.length).toBe(2);
    });

    it('at start of string shows all (functions + references)', () => {
      const s = createExpressionAutocompleteState();
      const ctx = makeContext();
      const next = computeSuggestions(s, '', 0, ctx);

      expect(next.open).toBe(true);
      // Should include functions (10), fields (3), parameters (2), calc-fields (2)
      // No metrics at row level
      const kinds = new Set(next.suggestions.map((sg) => sg.kind));
      expect(kinds.has('function')).toBe(true);
      expect(kinds.has('field')).toBe(true);
      expect(kinds.has('parameter')).toBe(true);
      expect(kinds.has('calc-field')).toBe(true);
      expect(kinds.has('metric')).toBe(false); // row level
    });

    it('after operator shows all (functions + references)', () => {
      const s = createExpressionAutocompleteState();
      const ctx = makeContext({ level: 'metric' });
      const next = computeSuggestions(s, '[revenue] + ', 12, ctx);

      expect(next.open).toBe(true);
      const kinds = new Set(next.suggestions.map((sg) => sg.kind));
      expect(kinds.has('function')).toBe(true);
      expect(kinds.has('field')).toBe(true);
      expect(kinds.has('metric')).toBe(true); // metric level
    });

    it('after paren shows all suggestions', () => {
      const s = createExpressionAutocompleteState();
      const ctx = makeContext();
      const next = computeSuggestions(s, 'IF(', 3, ctx);

      expect(next.open).toBe(true);
      const kinds = new Set(next.suggestions.map((sg) => sg.kind));
      expect(kinds.has('function')).toBe(true);
      expect(kinds.has('field')).toBe(true);
    });

    it('after comma shows all suggestions', () => {
      const s = createExpressionAutocompleteState();
      const ctx = makeContext();
      const next = computeSuggestions(s, 'IF([revenue] > 100, ', 20, ctx);

      expect(next.open).toBe(true);
      const kinds = new Set(next.suggestions.map((sg) => sg.kind));
      expect(kinds.has('function')).toBe(true);
    });

    it('sets open=true, query, and anchorPosition correctly', () => {
      const s = createExpressionAutocompleteState();
      const ctx = makeContext();
      // "[rev" → trigger is '[', partial is 'rev', anchor at position 1
      const next = computeSuggestions(s, '[rev', 4, ctx);

      expect(next.open).toBe(true);
      expect(next.query).toBe('rev');
      expect(next.anchorPosition).toBe(1);
      expect(next.selectedIndex).toBe(0);
    });

    it('with no matches returns open=false', () => {
      const s = createExpressionAutocompleteState();
      const ctx = makeContext();
      const next = computeSuggestions(s, '[zzz_no_match', 13, ctx);

      expect(next.open).toBe(false);
      expect(next.suggestions).toEqual([]);
    });

    it('sorts exact prefix first, then alphabetical', () => {
      const s = createExpressionAutocompleteState();
      const ctx = makeContext({ fields: ['abc', 'ab', 'abcd', 'abd'] });
      const next = computeSuggestions(s, '[ab', 3, ctx);

      expect(next.open).toBe(true);
      // "ab" is exact prefix match for all, but "ab" matches exactly the query
      // Sort: exact prefix first, then alphabetical
      const labels = next.suggestions.map((sg) => sg.label);
      expect(labels).toEqual(['ab', 'abc', 'abcd', 'abd']);
    });

    it('field insertText includes closing bracket', () => {
      const s = createExpressionAutocompleteState();
      const ctx = makeContext({ fields: ['revenue'] });
      const next = computeSuggestions(s, '[', 1, ctx);

      expect(next.suggestions[0].insertText).toBe('revenue]');
    });

    it('function suggestions have ( appended and detail string', () => {
      const s = createExpressionAutocompleteState();
      const ctx = makeContext({ fields: [], parameters: [], calculatedFields: [] });
      const next = computeSuggestions(s, '', 0, ctx);

      const absFn = next.suggestions.find((sg) => sg.label === 'ABS');
      expect(absFn).toBeDefined();
      expect(absFn!.insertText).toBe('ABS(');
      expect(absFn!.detail).toBeTruthy();
      expect(absFn!.kind).toBe('function');
    });

    it('in "all" mode fields have [ prepended and ] appended in insertText', () => {
      const s = createExpressionAutocompleteState();
      const ctx = makeContext({ fields: ['revenue'], parameters: [], calculatedFields: [] });
      const next = computeSuggestions(s, '', 0, ctx);

      const fieldSuggestion = next.suggestions.find((sg) => sg.kind === 'field');
      expect(fieldSuggestion).toBeDefined();
      expect(fieldSuggestion!.insertText).toBe('[revenue]');
    });

    it('in "all" mode parameters have $ prepended in insertText', () => {
      const s = createExpressionAutocompleteState();
      const ctx = makeContext({ fields: [], parameters: ['start_date'], calculatedFields: [] });
      const next = computeSuggestions(s, '', 0, ctx);

      const paramSuggestion = next.suggestions.find((sg) => sg.kind === 'parameter');
      expect(paramSuggestion).toBeDefined();
      expect(paramSuggestion!.insertText).toBe('$start_date');
    });

    it('in "all" mode at metric level includes metrics with @ prefix', () => {
      const s = createExpressionAutocompleteState();
      const ctx = makeContext({
        fields: [],
        parameters: [],
        calculatedFields: [],
        metrics: ['total_revenue'],
        level: 'metric',
      });
      const next = computeSuggestions(s, '', 0, ctx);

      const metricSuggestion = next.suggestions.find((sg) => sg.kind === 'metric');
      expect(metricSuggestion).toBeDefined();
      expect(metricSuggestion!.insertText).toBe('@total_revenue');
    });

    it('in "all" mode at row level includes calc-fields with ~ prefix', () => {
      const s = createExpressionAutocompleteState();
      const ctx = makeContext({
        fields: [],
        parameters: [],
        calculatedFields: ['profit_margin'],
        metrics: [],
        level: 'row',
      });
      const next = computeSuggestions(s, '', 0, ctx);

      const calcSuggestion = next.suggestions.find((sg) => sg.kind === 'calc-field');
      expect(calcSuggestion).toBeDefined();
      expect(calcSuggestion!.insertText).toBe('~profit_margin');
    });

    it('after whitespace shows all suggestions', () => {
      const s = createExpressionAutocompleteState();
      const ctx = makeContext();
      const next = computeSuggestions(s, 'ABS( ', 5, ctx);

      expect(next.open).toBe(true);
      const kinds = new Set(next.suggestions.map((sg) => sg.kind));
      expect(kinds.has('function')).toBe(true);
    });

    it('filters "all" mode suggestions by partial token', () => {
      const s = createExpressionAutocompleteState();
      const ctx = makeContext();
      // After "AB" at start → should match ABS function and nothing else (no field/param starts with AB)
      const next = computeSuggestions(s, 'AB', 2, ctx);

      expect(next.open).toBe(true);
      expect(next.suggestions.length).toBe(1);
      expect(next.suggestions[0].label).toBe('ABS');
    });
  });

  // ── selectNext ──

  describe('selectNext', () => {
    it('increments selectedIndex', () => {
      let s = createExpressionAutocompleteState();
      const ctx = makeContext();
      s = computeSuggestions(s, '[', 1, ctx);
      expect(s.selectedIndex).toBe(0);

      const next = selectNext(s);
      expect(next.selectedIndex).toBe(1);
    });

    it('wraps around to 0 at end', () => {
      let s = createExpressionAutocompleteState();
      const ctx = makeContext(); // 3 fields
      s = computeSuggestions(s, '[', 1, ctx);
      // Move to last item (index 2)
      s = selectNext(s);
      s = selectNext(s);
      expect(s.selectedIndex).toBe(2);

      // Wrap to 0
      const next = selectNext(s);
      expect(next.selectedIndex).toBe(0);
    });

    it('returns same state if not open', () => {
      const s = createExpressionAutocompleteState();
      const next = selectNext(s);
      expect(next).toBe(s);
    });
  });

  // ── selectPrevious ──

  describe('selectPrevious', () => {
    it('decrements selectedIndex', () => {
      let s = createExpressionAutocompleteState();
      const ctx = makeContext();
      s = computeSuggestions(s, '[', 1, ctx);
      s = selectNext(s); // index 1
      const next = selectPrevious(s);
      expect(next.selectedIndex).toBe(0);
    });

    it('wraps around to end when at 0', () => {
      let s = createExpressionAutocompleteState();
      const ctx = makeContext(); // 3 fields
      s = computeSuggestions(s, '[', 1, ctx);
      expect(s.selectedIndex).toBe(0);

      const next = selectPrevious(s);
      expect(next.selectedIndex).toBe(2); // wraps to last
    });

    it('returns same state if not open', () => {
      const s = createExpressionAutocompleteState();
      const next = selectPrevious(s);
      expect(next).toBe(s);
    });
  });

  // ── acceptSuggestion ──

  describe('acceptSuggestion', () => {
    it('returns insertText and closes state', () => {
      let s = createExpressionAutocompleteState();
      const ctx = makeContext();
      s = computeSuggestions(s, '[rev', 4, ctx);

      const result = acceptSuggestion(s);
      expect(result).not.toBeNull();
      expect(result!.insertText).toBeTruthy();
      expect(result!.anchorPosition).toBe(1); // anchor after '['
      expect(result!.state.open).toBe(false);
      expect(result!.state.suggestions).toEqual([]);
    });

    it('returns the insertText of the selected suggestion', () => {
      let s = createExpressionAutocompleteState();
      const ctx = makeContext();
      s = computeSuggestions(s, '[', 1, ctx);
      // Select second item
      s = selectNext(s);
      const selectedLabel = s.suggestions[s.selectedIndex].insertText;

      const result = acceptSuggestion(s);
      expect(result).not.toBeNull();
      expect(result!.insertText).toBe(selectedLabel);
    });

    it('returns null on closed state', () => {
      const s = createExpressionAutocompleteState();
      const result = acceptSuggestion(s);
      expect(result).toBeNull();
    });

    it('returns null when open but no suggestions', () => {
      // Edge case: state is open but suggestions were cleared
      const s: ExpressionAutocompleteState = {
        open: true,
        suggestions: [],
        selectedIndex: 0,
        query: '',
        anchorPosition: 0,
      };
      const result = acceptSuggestion(s);
      expect(result).toBeNull();
    });
  });

  // ── dismissAutocomplete ──

  describe('dismissAutocomplete', () => {
    it('closes and clears suggestions', () => {
      let s = createExpressionAutocompleteState();
      const ctx = makeContext();
      s = computeSuggestions(s, '[', 1, ctx);
      expect(s.open).toBe(true);

      const next = dismissAutocomplete(s);
      expect(next.open).toBe(false);
      expect(next.suggestions).toEqual([]);
      expect(next.selectedIndex).toBe(0);
      expect(next.query).toBe('');
    });

    it('is safe to call on already closed state', () => {
      const s = createExpressionAutocompleteState();
      const next = dismissAutocomplete(s);
      expect(next.open).toBe(false);
    });
  });

  // ── getSelectedSuggestion ──

  describe('getSelectedSuggestion', () => {
    it('returns the suggestion at selectedIndex', () => {
      let s = createExpressionAutocompleteState();
      const ctx = makeContext();
      s = computeSuggestions(s, '[', 1, ctx);

      const suggestion = getSelectedSuggestion(s);
      expect(suggestion).not.toBeNull();
      expect(suggestion!.kind).toBe('field');
      expect(suggestion).toBe(s.suggestions[0]);
    });

    it('returns correct suggestion after navigation', () => {
      let s = createExpressionAutocompleteState();
      const ctx = makeContext();
      s = computeSuggestions(s, '[', 1, ctx);
      s = selectNext(s);

      const suggestion = getSelectedSuggestion(s);
      expect(suggestion).toBe(s.suggestions[1]);
    });

    it('returns null when not open', () => {
      const s = createExpressionAutocompleteState();
      const suggestion = getSelectedSuggestion(s);
      expect(suggestion).toBeNull();
    });

    it('returns null when suggestions are empty', () => {
      const s: ExpressionAutocompleteState = {
        open: true,
        suggestions: [],
        selectedIndex: 0,
        query: '',
        anchorPosition: 0,
      };
      const suggestion = getSelectedSuggestion(s);
      expect(suggestion).toBeNull();
    });
  });

  // ── Immutability ──

  describe('immutability', () => {
    it('all functions return new state objects', () => {
      const s = createExpressionAutocompleteState();
      const ctx = makeContext();

      // computeSuggestions returns new state
      const s1 = computeSuggestions(s, '[', 1, ctx);
      expect(s1).not.toBe(s);

      // selectNext returns new state
      const s2 = selectNext(s1);
      expect(s2).not.toBe(s1);

      // selectPrevious returns new state
      const s3 = selectPrevious(s2);
      expect(s3).not.toBe(s2);

      // dismissAutocomplete returns new state
      const s4 = dismissAutocomplete(s1);
      expect(s4).not.toBe(s1);

      // acceptSuggestion returns new state
      const result = acceptSuggestion(s1);
      expect(result).not.toBeNull();
      expect(result!.state).not.toBe(s1);

      // Original state unchanged
      expect(s.open).toBe(false);
      expect(s.suggestions).toEqual([]);
      expect(s.selectedIndex).toBe(0);
    });
  });
});
