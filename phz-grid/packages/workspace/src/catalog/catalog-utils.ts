/**
 * Pure utility functions for CatalogBrowser — grouping and filtering.
 */

import type { ArtifactMeta, ArtifactType, TemplateDefinition } from '../types.js';

export function groupArtifactsByType(artifacts: ArtifactMeta[]): Map<ArtifactType, ArtifactMeta[]> {
  const grouped = new Map<ArtifactType, ArtifactMeta[]>();
  for (const a of artifacts) {
    const list = grouped.get(a.type);
    if (list) {
      list.push(a);
    } else {
      grouped.set(a.type, [a]);
    }
  }
  return grouped;
}

export function filterArtifactsBySearch(artifacts: ArtifactMeta[], query: string): ArtifactMeta[] {
  const q = query.trim().toLowerCase();
  if (!q) return artifacts;
  return artifacts.filter(a => a.name.toLowerCase().includes(q));
}

// --- Template search (L.2) ---

export function filterTemplatesBySearch(templates: TemplateDefinition[], query: string): TemplateDefinition[] {
  const q = query.trim().toLowerCase();
  if (!q) return templates;
  return templates.filter(t =>
    t.name.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    t.tags.some(tag => tag.toLowerCase().includes(q)),
  );
}

// --- Unified search (L.2) ---

export interface UnifiedSearchResult {
  artifacts: ArtifactMeta[];
  templates: TemplateDefinition[];
  totalCount: number;
}

export function unifiedSearch(
  artifacts: ArtifactMeta[],
  templates: TemplateDefinition[],
  query: string,
): UnifiedSearchResult {
  const filteredArtifacts = filterArtifactsBySearch(artifacts, query);
  const filteredTemplates = filterTemplatesBySearch(templates, query);
  return {
    artifacts: filteredArtifacts,
    templates: filteredTemplates,
    totalCount: filteredArtifacts.length + filteredTemplates.length,
  };
}
