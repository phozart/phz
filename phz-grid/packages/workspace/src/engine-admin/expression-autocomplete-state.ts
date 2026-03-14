/**
 * @phozart/workspace — Expression Autocomplete State (UX-014)
 *
 * Pure, headless state machine for formula editor autocomplete.
 * All functions are immutable reducers — they accept state and return a
 * new state object without mutating the input.
 *
 * Trigger characters:
 * - `[` → field references (insertText: `field_name]`)
 * - `$` → parameters (insertText: `param_name`)
 * - `@` → metric references (metric level only)
 * - `~` → calculated field references (row level only)
 * - operator / paren / comma / whitespace / start → all suggestions
 */

// ── Types ──

/** Kind of autocomplete suggestion. */
export type SuggestionKind = 'field' | 'parameter' | 'metric' | 'calc-field' | 'function' | 'keyword';

/** A single autocomplete suggestion entry. */
export interface AutocompleteSuggestion {
  kind: SuggestionKind;
  label: string;
  insertText: string;
  detail?: string;
}

/** Context provided by the host component for generating suggestions. */
export interface AutocompleteContext {
  fields: string[];
  parameters: string[];
  metrics: string[];
  calculatedFields: string[];
  level: 'row' | 'metric';
}

/** Root state for the expression autocomplete popup. */
export interface ExpressionAutocompleteState {
  /** Whether the autocomplete popup is visible. */
  open: boolean;
  /** Current list of suggestions. */
  suggestions: AutocompleteSuggestion[];
  /** Index of the highlighted suggestion. */
  selectedIndex: number;
  /** The partial text the user has typed after the trigger character. */
  query: string;
  /** Character position in the formula where the insertion should start. */
  anchorPosition: number;
}

// ── Built-in functions ──

interface BuiltinFunction {
  name: string;
  detail: string;
}

const BUILTIN_FUNCTIONS: BuiltinFunction[] = [
  { name: 'ABS', detail: 'ABS(value)' },
  { name: 'ROUND', detail: 'ROUND(value, decimals)' },
  { name: 'IF', detail: 'IF(condition, then, else)' },
  { name: 'COALESCE', detail: 'COALESCE(value1, value2, ...)' },
  { name: 'UPPER', detail: 'UPPER(text)' },
  { name: 'LOWER', detail: 'LOWER(text)' },
  { name: 'CONCAT', detail: 'CONCAT(text1, text2, ...)' },
  { name: 'YEAR', detail: 'YEAR(date)' },
  { name: 'MONTH', detail: 'MONTH(date)' },
  { name: 'SUM', detail: 'SUM(values)' },
];

// ── Factory ──

/**
 * Create a fresh autocomplete state — closed, empty.
 */
export function createExpressionAutocompleteState(): ExpressionAutocompleteState {
  return {
    open: false,
    suggestions: [],
    selectedIndex: 0,
    query: '',
    anchorPosition: 0,
  };
}

// ── Core suggestion engine ──

/** Characters that end a token and trigger "all" mode suggestions. */
const ALL_TRIGGERS = new Set(['+', '-', '*', '/', '>', '<', '=', '!', '(', ')', ',', ' ']);

/**
 * Scan backwards from cursorPos to identify the trigger character and partial token.
 * Returns { trigger, partial, anchorPosition }.
 */
function scanBackward(
  formulaText: string,
  cursorPos: number,
): { trigger: string | null; partial: string; anchorPosition: number } {
  // Walk backwards from cursorPos to find the trigger
  let i = cursorPos - 1;

  // Collect characters that form the partial token
  const partialChars: string[] = [];

  while (i >= 0) {
    const ch = formulaText[i];

    // If we hit a trigger character, we found our context
    if (ch === '[' || ch === '$' || ch === '@' || ch === '~') {
      return {
        trigger: ch,
        partial: partialChars.reverse().join(''),
        anchorPosition: i + 1,
      };
    }

    // If we hit an "all" trigger (operator, paren, comma, whitespace)
    if (ALL_TRIGGERS.has(ch)) {
      return {
        trigger: 'all',
        partial: partialChars.reverse().join(''),
        anchorPosition: i + 1,
      };
    }

    partialChars.push(ch);
    i--;
  }

  // Reached start of string — "all" mode with everything as partial
  return {
    trigger: 'all',
    partial: partialChars.reverse().join(''),
    anchorPosition: 0,
  };
}

/**
 * Sort suggestions: exact query match first, then alphabetical by label.
 */
function sortSuggestions(
  suggestions: AutocompleteSuggestion[],
  query: string,
): AutocompleteSuggestion[] {
  const lowerQuery = query.toLowerCase();
  return [...suggestions].sort((a, b) => {
    const aExact = a.label.toLowerCase() === lowerQuery;
    const bExact = b.label.toLowerCase() === lowerQuery;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return a.label.localeCompare(b.label);
  });
}

/**
 * Filter items by case-insensitive prefix match.
 */
function filterByPrefix(items: string[], prefix: string): string[] {
  if (prefix === '') return [...items];
  const lowerPrefix = prefix.toLowerCase();
  return items.filter((item) => item.toLowerCase().startsWith(lowerPrefix));
}

/**
 * Compute suggestions based on the formula text, cursor position, and context.
 * Returns a new state with suggestions populated (or closed if no matches).
 */
export function computeSuggestions(
  state: ExpressionAutocompleteState,
  formulaText: string,
  cursorPos: number,
  context: AutocompleteContext,
): ExpressionAutocompleteState {
  const { trigger, partial, anchorPosition } = scanBackward(formulaText, cursorPos);

  let suggestions: AutocompleteSuggestion[] = [];

  if (trigger === '[') {
    // Field references only
    const matched = filterByPrefix(context.fields, partial);
    suggestions = matched.map((f) => ({
      kind: 'field' as const,
      label: f,
      insertText: `${f}]`,
    }));
  } else if (trigger === '$') {
    // Parameter references only
    const matched = filterByPrefix(context.parameters, partial);
    suggestions = matched.map((p) => ({
      kind: 'parameter' as const,
      label: p,
      insertText: p,
    }));
  } else if (trigger === '@') {
    // Metric references — only at metric level
    if (context.level === 'metric') {
      const matched = filterByPrefix(context.metrics, partial);
      suggestions = matched.map((m) => ({
        kind: 'metric' as const,
        label: m,
        insertText: m,
      }));
    }
  } else if (trigger === '~') {
    // Calculated field references — only at row level
    if (context.level === 'row') {
      const matched = filterByPrefix(context.calculatedFields, partial);
      suggestions = matched.map((c) => ({
        kind: 'calc-field' as const,
        label: c,
        insertText: c,
      }));
    }
  } else if (trigger === 'all') {
    // All mode: functions + fields + params + context-appropriate refs
    // Functions
    const matchedFunctions = BUILTIN_FUNCTIONS.filter((fn) =>
      fn.name.toLowerCase().startsWith(partial.toLowerCase()),
    );
    const fnSuggestions: AutocompleteSuggestion[] = matchedFunctions.map((fn) => ({
      kind: 'function' as const,
      label: fn.name,
      insertText: `${fn.name}(`,
      detail: fn.detail,
    }));

    // Fields (with [ prepended and ] appended)
    const matchedFields = filterByPrefix(context.fields, partial);
    const fieldSuggestions: AutocompleteSuggestion[] = matchedFields.map((f) => ({
      kind: 'field' as const,
      label: f,
      insertText: `[${f}]`,
    }));

    // Parameters (with $ prepended)
    const matchedParams = filterByPrefix(context.parameters, partial);
    const paramSuggestions: AutocompleteSuggestion[] = matchedParams.map((p) => ({
      kind: 'parameter' as const,
      label: p,
      insertText: `$${p}`,
    }));

    // Context-appropriate refs
    let refSuggestions: AutocompleteSuggestion[] = [];
    if (context.level === 'metric') {
      const matchedMetrics = filterByPrefix(context.metrics, partial);
      refSuggestions = matchedMetrics.map((m) => ({
        kind: 'metric' as const,
        label: m,
        insertText: `@${m}`,
      }));
    } else {
      const matchedCalcFields = filterByPrefix(context.calculatedFields, partial);
      refSuggestions = matchedCalcFields.map((c) => ({
        kind: 'calc-field' as const,
        label: c,
        insertText: `~${c}`,
      }));
    }

    suggestions = [...fnSuggestions, ...fieldSuggestions, ...paramSuggestions, ...refSuggestions];
  }

  // Sort and return
  suggestions = sortSuggestions(suggestions, partial);

  if (suggestions.length === 0) {
    return {
      open: false,
      suggestions: [],
      selectedIndex: 0,
      query: partial,
      anchorPosition,
    };
  }

  return {
    open: true,
    suggestions,
    selectedIndex: 0,
    query: partial,
    anchorPosition,
  };
}

// ── Navigation ──

/**
 * Move selection to the next suggestion. Wraps around to 0 at the end.
 * No-op if autocomplete is not open.
 */
export function selectNext(
  state: ExpressionAutocompleteState,
): ExpressionAutocompleteState {
  if (!state.open || state.suggestions.length === 0) return state;
  const nextIndex = (state.selectedIndex + 1) % state.suggestions.length;
  return { ...state, selectedIndex: nextIndex };
}

/**
 * Move selection to the previous suggestion. Wraps around to the end at 0.
 * No-op if autocomplete is not open.
 */
export function selectPrevious(
  state: ExpressionAutocompleteState,
): ExpressionAutocompleteState {
  if (!state.open || state.suggestions.length === 0) return state;
  const prevIndex = (state.selectedIndex - 1 + state.suggestions.length) % state.suggestions.length;
  return { ...state, selectedIndex: prevIndex };
}

// ── Accept / Dismiss ──

/** Result of accepting a suggestion. */
export interface AcceptResult {
  state: ExpressionAutocompleteState;
  insertText: string;
  anchorPosition: number;
}

/**
 * Accept the currently selected suggestion.
 * Returns the closed state, the text to insert, and the anchor position.
 * Returns null if autocomplete is not open or has no suggestions.
 */
export function acceptSuggestion(
  state: ExpressionAutocompleteState,
): AcceptResult | null {
  if (!state.open || state.suggestions.length === 0) return null;

  const suggestion = state.suggestions[state.selectedIndex];
  if (!suggestion) return null;

  return {
    state: {
      open: false,
      suggestions: [],
      selectedIndex: 0,
      query: '',
      anchorPosition: 0,
    },
    insertText: suggestion.insertText,
    anchorPosition: state.anchorPosition,
  };
}

/**
 * Dismiss the autocomplete popup. Clears suggestions and resets state.
 */
export function dismissAutocomplete(
  state: ExpressionAutocompleteState,
): ExpressionAutocompleteState {
  return {
    open: false,
    suggestions: [],
    selectedIndex: 0,
    query: '',
    anchorPosition: 0,
  };
}

// ── Query ──

/**
 * Get the currently selected suggestion, or null if not open / empty.
 */
export function getSelectedSuggestion(
  state: ExpressionAutocompleteState,
): AutocompleteSuggestion | null {
  if (!state.open || state.suggestions.length === 0) return null;
  return state.suggestions[state.selectedIndex] ?? null;
}
