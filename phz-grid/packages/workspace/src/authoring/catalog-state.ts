/**
 * @phozart/phz-workspace — Catalog State
 *
 * Pure functions for filtering, searching, sorting, and tagging artifacts
 * in the home/catalog view.
 */

import type { ArtifactMeta } from '../types.js';

export interface CatalogState {
  artifacts: ArtifactMeta[];
  search: string;
  selectedTags: string[];
  typeFilter?: 'report' | 'dashboard';
  sortBy: 'name' | 'updatedAt' | 'createdAt';
  sortDir: 'asc' | 'desc';
}

export function initialCatalogState(artifacts: ArtifactMeta[] = []): CatalogState {
  return { artifacts, search: '', selectedTags: [], sortBy: 'updatedAt', sortDir: 'desc' };
}

export function filterArtifacts(state: CatalogState): ArtifactMeta[] {
  let result = state.artifacts;

  // Type filter
  if (state.typeFilter) {
    result = result.filter(a => a.type === state.typeFilter);
  }

  // Search (case-insensitive on name and description)
  if (state.search) {
    const q = state.search.toLowerCase();
    result = result.filter(a =>
      a.name.toLowerCase().includes(q) ||
      (a.description?.toLowerCase().includes(q) ?? false)
    );
  }

  // Tag filter (artifact must have ALL selected tags — since ArtifactMeta doesn't have tags,
  // we skip this if no tags are selected; tags are derived from type/published status)
  // For now, selectedTags filters by type name as a tag-like mechanism
  if (state.selectedTags.length > 0) {
    result = result.filter(a => state.selectedTags.includes(a.type));
  }

  return sortArtifacts(result, state.sortBy, state.sortDir);
}

export function extractTags(artifacts: ArtifactMeta[]): string[] {
  const tags = new Set<string>();
  for (const a of artifacts) {
    tags.add(a.type);
  }
  return [...tags].sort();
}

export function sortArtifacts(
  artifacts: ArtifactMeta[],
  sortBy: CatalogState['sortBy'],
  sortDir: CatalogState['sortDir'],
): ArtifactMeta[] {
  const sorted = [...artifacts];
  sorted.sort((a, b) => {
    let cmp: number;
    if (sortBy === 'name') {
      cmp = a.name.localeCompare(b.name);
    } else {
      cmp = (a[sortBy] ?? 0) - (b[sortBy] ?? 0);
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });
  return sorted;
}

export function getArtifactsByStatus(
  artifacts: ArtifactMeta[],
  status: 'draft' | 'published',
): ArtifactMeta[] {
  if (status === 'published') {
    return artifacts.filter(a => a.published === true);
  }
  return artifacts.filter(a => !a.published);
}
