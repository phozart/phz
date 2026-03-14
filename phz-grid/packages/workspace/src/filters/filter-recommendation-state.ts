/**
 * @phozart/workspace — Filter Recommendation State (UX-018)
 *
 * Smart filter recommendation state machine. Pure functions, immutable state.
 * Analyzes field metadata to recommend appropriate filter types with
 * confidence scores, cascade relationships, and human-readable labels.
 */

// ========================================================================
// Types
// ========================================================================

export type RecommendedFilterType =
  | 'select'
  | 'multi-select'
  | 'range'
  | 'date-range'
  | 'boolean'
  | 'text';

export interface FilterRecommendation {
  id: string;
  field: string;
  filterType: RecommendedFilterType;
  rationale: string;
  confidence: number;
  suggestedLabel: string;
  cascadeParentId?: string;
}

export interface FilterFieldInput {
  name: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  semanticHint?:
    | 'measure'
    | 'dimension'
    | 'identifier'
    | 'timestamp'
    | 'category'
    | 'currency'
    | 'percentage';
  cardinality?: 'low' | 'medium' | 'high';
}

export interface FilterRecommendationState {
  recommendations: FilterRecommendation[];
  appliedIds: ReadonlySet<string>;
  dismissedIds: ReadonlySet<string>;
}

// ========================================================================
// Helpers
// ========================================================================

function toLabel(fieldName: string): string {
  const withSpaces = fieldName.replace(/_/g, ' ');
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

function classifyField(
  field: FilterFieldInput,
): { filterType: RecommendedFilterType; confidence: number; rationale: string } {
  // Boolean fields
  if (field.dataType === 'boolean') {
    return { filterType: 'boolean', confidence: 0.9, rationale: 'Boolean field — toggle filter' };
  }

  // Date fields or timestamp semantic hint
  if (field.dataType === 'date' || field.semanticHint === 'timestamp') {
    return { filterType: 'date-range', confidence: 0.95, rationale: 'Date field — date range picker' };
  }

  // String fields
  if (field.dataType === 'string') {
    if (field.cardinality === 'low') {
      return { filterType: 'select', confidence: 0.9, rationale: 'Few distinct values — dropdown filter' };
    }
    if (field.cardinality === 'medium') {
      return { filterType: 'multi-select', confidence: 0.85, rationale: 'Multiple values — multi-select filter' };
    }
    if (field.cardinality === 'high') {
      return { filterType: 'text', confidence: 0.7, rationale: 'Many distinct values — search filter' };
    }
    // No cardinality info
    return { filterType: 'multi-select', confidence: 0.75, rationale: 'Text field — multi-select filter' };
  }

  // Number fields
  if (field.dataType === 'number') {
    if (field.semanticHint === 'measure') {
      return { filterType: 'range', confidence: 0.8, rationale: 'Numeric measure — range slider' };
    }
    return { filterType: 'range', confidence: 0.65, rationale: 'Numeric field — range filter' };
  }

  // Fallback (should not be reached with the typed union)
  return { filterType: 'text', confidence: 0.5, rationale: 'Unknown field type — text filter' };
}

// ========================================================================
// Factory
// ========================================================================

export function createFilterRecommendationState(): FilterRecommendationState {
  return {
    recommendations: [],
    appliedIds: new Set<string>(),
    dismissedIds: new Set<string>(),
  };
}

// ========================================================================
// Compute recommendations
// ========================================================================

export function computeFilterRecommendations(
  state: FilterRecommendationState,
  fields: FilterFieldInput[],
  existingFilterFields: string[],
): FilterRecommendationState {
  const existingSet = new Set(existingFilterFields);

  // Build recommendations for fields not already filtered
  const recommendations: FilterRecommendation[] = fields
    .filter((f) => !existingSet.has(f.name))
    .map((field): FilterRecommendation => {
      const { filterType, confidence, rationale } = classifyField(field);
      return {
        id: `rec-${field.name}`,
        field: field.name,
        filterType,
        rationale,
        confidence,
        suggestedLabel: toLabel(field.name),
      };
    });

  // Cascade logic: if a date-range rec exists, set cascadeParentId on select/multi-select recs
  const dateRangeRec = recommendations.find((r) => r.filterType === 'date-range');
  if (dateRangeRec) {
    for (const rec of recommendations) {
      if (rec.filterType === 'select' || rec.filterType === 'multi-select') {
        rec.cascadeParentId = dateRangeRec.id;
      }
    }
  }

  // Sort by confidence descending
  recommendations.sort((a, b) => b.confidence - a.confidence);

  return {
    recommendations,
    appliedIds: state.appliedIds,
    dismissedIds: state.dismissedIds,
  };
}

// ========================================================================
// Apply / Dismiss / Undo
// ========================================================================

export function applyRecommendation(
  state: FilterRecommendationState,
  id: string,
): FilterRecommendationState {
  const nextApplied = new Set(state.appliedIds);
  nextApplied.add(id);
  return {
    ...state,
    appliedIds: nextApplied,
  };
}

export function dismissRecommendation(
  state: FilterRecommendationState,
  id: string,
): FilterRecommendationState {
  const nextDismissed = new Set(state.dismissedIds);
  nextDismissed.add(id);
  return {
    ...state,
    dismissedIds: nextDismissed,
  };
}

export function undoDismiss(
  state: FilterRecommendationState,
  id: string,
): FilterRecommendationState {
  const nextDismissed = new Set(state.dismissedIds);
  nextDismissed.delete(id);
  return {
    ...state,
    dismissedIds: nextDismissed,
  };
}

// ========================================================================
// Selectors
// ========================================================================

export function getActiveRecommendations(
  state: FilterRecommendationState,
): FilterRecommendation[] {
  return state.recommendations.filter(
    (r) => !state.appliedIds.has(r.id) && !state.dismissedIds.has(r.id),
  );
}

export function getRecommendationById(
  state: FilterRecommendationState,
  id: string,
): FilterRecommendation | null {
  return state.recommendations.find((r) => r.id === id) ?? null;
}
