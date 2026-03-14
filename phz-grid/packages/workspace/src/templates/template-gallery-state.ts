/**
 * Template Gallery State Machine
 *
 * Headless state management for the template gallery: search, category
 * filtering, template selection, and favorites.
 *
 * Pure functions — no DOM, no side effects — testable in Node.
 */

import type { TemplateDefinition } from '../types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Immutable state for the template gallery UI. */
export interface TemplateGalleryState {
  /** All available templates. */
  readonly templates: TemplateDefinition[];
  /** Current search query text. */
  readonly searchQuery: string;
  /** Active category filter, or null for "show all". */
  readonly selectedCategory: string | null;
  /** Unique categories extracted from templates, in insertion order. */
  readonly categories: string[];
  /** Currently selected template ID, or null. */
  readonly selectedTemplateId: string | null;
  /** Set of favorited template IDs. */
  readonly favoriteIds: Set<string>;
}

// ---------------------------------------------------------------------------
// State Constructors
// ---------------------------------------------------------------------------

/**
 * Create the initial gallery state from an array of template definitions.
 * Extracts unique categories in the order they appear.
 */
export function createTemplateGalleryState(
  templates: TemplateDefinition[],
): TemplateGalleryState {
  const seen = new Set<string>();
  const categories: string[] = [];
  for (const t of templates) {
    if (!seen.has(t.category)) {
      seen.add(t.category);
      categories.push(t.category);
    }
  }

  return {
    templates,
    searchQuery: '',
    selectedCategory: null,
    categories,
    selectedTemplateId: null,
    favoriteIds: new Set(),
  };
}

// ---------------------------------------------------------------------------
// Reducers (pure, immutable)
// ---------------------------------------------------------------------------

/** Update the search query text. */
export function setSearchQuery(
  state: TemplateGalleryState,
  query: string,
): TemplateGalleryState {
  return { ...state, searchQuery: query };
}

/** Set the active category filter, or null to show all categories. */
export function selectCategory(
  state: TemplateGalleryState,
  category: string | null,
): TemplateGalleryState {
  return { ...state, selectedCategory: category };
}

/** Select a template by ID, or null to clear the selection. */
export function selectTemplate(
  state: TemplateGalleryState,
  templateId: string | null,
): TemplateGalleryState {
  return { ...state, selectedTemplateId: templateId };
}

/** Toggle a template's favorite status. */
export function toggleFavorite(
  state: TemplateGalleryState,
  templateId: string,
): TemplateGalleryState {
  const next = new Set(state.favoriteIds);
  if (next.has(templateId)) {
    next.delete(templateId);
  } else {
    next.add(templateId);
  }
  return { ...state, favoriteIds: next };
}

// ---------------------------------------------------------------------------
// Selectors (derived data)
// ---------------------------------------------------------------------------

/**
 * Return templates matching the current search query and category filter.
 *
 * Search is case-insensitive and matches against template `name` and `tags`.
 * Category filter is an exact match on `category`.
 * Both filters are combined (AND).
 */
export function getFilteredTemplates(
  state: TemplateGalleryState,
): TemplateDefinition[] {
  let result = state.templates;

  // Category filter
  if (state.selectedCategory !== null) {
    result = result.filter(t => t.category === state.selectedCategory);
  }

  // Search filter
  const query = state.searchQuery.trim().toLowerCase();
  if (query) {
    result = result.filter(t =>
      t.name.toLowerCase().includes(query) ||
      t.tags.some(tag => tag.toLowerCase().includes(query)),
    );
  }

  return result;
}

/**
 * Group filtered templates by category.
 * Only categories with at least one matching template are included.
 */
export function getGroupedTemplates(
  state: TemplateGalleryState,
): Map<string, TemplateDefinition[]> {
  const filtered = getFilteredTemplates(state);
  const groups = new Map<string, TemplateDefinition[]>();

  for (const t of filtered) {
    let group = groups.get(t.category);
    if (!group) {
      group = [];
      groups.set(t.category, group);
    }
    group.push(t);
  }

  return groups;
}
