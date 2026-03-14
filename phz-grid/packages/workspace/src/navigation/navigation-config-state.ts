/**
 * @phozart/workspace — Navigation Config State (B-3.14)
 *
 * Pure functions for NavigationLink configuration UI.
 * Supports auto-mapping suggestions, circular navigation detection,
 * and link testing/preview.
 */

import type { ArtifactMeta, ArtifactType } from '../types.js';
import type { NavigationLink, NavigationFilterMapping } from './navigation-link.js';
import { detectCircularLinks } from './navigation-link.js';

// ========================================================================
// Types
// ========================================================================

export interface NavigationLinkConfig {
  id: string;
  sourceArtifactId: string;
  targetArtifactId: string;
  targetArtifactType: ArtifactType;
  label: string;
  description?: string;
  filterMappings: NavigationFilterMapping[];
  openBehavior: 'same-panel' | 'new-tab' | 'modal' | 'slide-over';
  triggerType: 'click' | 'double-click' | 'context-menu' | 'button' | 'link' | 'drill';
}

export interface AutoMappingSuggestion {
  sourceField: string;
  targetFilterId: string;
  targetFilterLabel: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

export interface LinkTestResult {
  linkId: string;
  reachable: boolean;
  circularDetected: boolean;
  filterMappingsValid: boolean;
  errors: string[];
}

export interface NavigationConfigState {
  links: NavigationLinkConfig[];
  selectedLinkId?: string;
  editingLink?: NavigationLinkConfig;
  artifacts: ArtifactMeta[];
  autoMappingSuggestions: AutoMappingSuggestion[];
  testResults: Map<string, LinkTestResult>;
  search: string;
}

// ========================================================================
// Factory
// ========================================================================

let linkCounter = 0;

export function initialNavigationConfigState(
  artifacts: ArtifactMeta[] = [],
): NavigationConfigState {
  return {
    links: [],
    artifacts,
    autoMappingSuggestions: [],
    testResults: new Map(),
    search: '',
  };
}

// ========================================================================
// Search
// ========================================================================

export function setNavSearch(
  state: NavigationConfigState,
  search: string,
): NavigationConfigState {
  return { ...state, search };
}

export function getFilteredLinks(
  state: NavigationConfigState,
): NavigationLinkConfig[] {
  if (!state.search) return state.links;
  const q = state.search.toLowerCase();
  return state.links.filter(
    l =>
      l.label.toLowerCase().includes(q) ||
      (l.description?.toLowerCase().includes(q) ?? false) ||
      l.sourceArtifactId.toLowerCase().includes(q) ||
      l.targetArtifactId.toLowerCase().includes(q),
  );
}

// ========================================================================
// Link CRUD
// ========================================================================

export function createLink(
  state: NavigationConfigState,
  sourceArtifactId: string,
  targetArtifactId: string,
  targetArtifactType: ArtifactType,
  label: string,
): NavigationConfigState {
  linkCounter++;
  const link: NavigationLinkConfig = {
    id: `nl_${Date.now()}_${linkCounter}`,
    sourceArtifactId,
    targetArtifactId,
    targetArtifactType,
    label,
    filterMappings: [],
    openBehavior: 'same-panel',
    triggerType: 'click',
  };
  return {
    ...state,
    links: [...state.links, link],
    selectedLinkId: link.id,
    editingLink: { ...link },
  };
}

export function updateLink(
  state: NavigationConfigState,
  link: NavigationLinkConfig,
): NavigationConfigState {
  return {
    ...state,
    links: state.links.map(l => (l.id === link.id ? link : l)),
    editingLink: state.editingLink?.id === link.id ? link : state.editingLink,
  };
}

export function deleteLink(
  state: NavigationConfigState,
  linkId: string,
): NavigationConfigState {
  const testResults = new Map(state.testResults);
  testResults.delete(linkId);
  return {
    ...state,
    links: state.links.filter(l => l.id !== linkId),
    selectedLinkId: state.selectedLinkId === linkId ? undefined : state.selectedLinkId,
    editingLink: state.editingLink?.id === linkId ? undefined : state.editingLink,
    testResults,
  };
}

// ========================================================================
// Selection / editing
// ========================================================================

export function selectLink(
  state: NavigationConfigState,
  linkId: string,
): NavigationConfigState {
  const link = state.links.find(l => l.id === linkId);
  return {
    ...state,
    selectedLinkId: linkId,
    editingLink: link ? { ...link, filterMappings: [...link.filterMappings] } : undefined,
  };
}

export function clearLinkSelection(
  state: NavigationConfigState,
): NavigationConfigState {
  return {
    ...state,
    selectedLinkId: undefined,
    editingLink: undefined,
  };
}

// ========================================================================
// Edit operations on editingLink
// ========================================================================

export function setEditingTarget(
  state: NavigationConfigState,
  targetArtifactId: string,
  targetArtifactType: ArtifactType,
): NavigationConfigState {
  if (!state.editingLink) return state;
  return {
    ...state,
    editingLink: { ...state.editingLink, targetArtifactId, targetArtifactType },
  };
}

export function setEditingLabel(
  state: NavigationConfigState,
  label: string,
): NavigationConfigState {
  if (!state.editingLink) return state;
  return { ...state, editingLink: { ...state.editingLink, label } };
}

export function setEditingOpenBehavior(
  state: NavigationConfigState,
  openBehavior: NavigationLinkConfig['openBehavior'],
): NavigationConfigState {
  if (!state.editingLink) return state;
  return { ...state, editingLink: { ...state.editingLink, openBehavior } };
}

export function setEditingTriggerType(
  state: NavigationConfigState,
  triggerType: NavigationLinkConfig['triggerType'],
): NavigationConfigState {
  if (!state.editingLink) return state;
  return { ...state, editingLink: { ...state.editingLink, triggerType } };
}

export function addEditingFilterMapping(
  state: NavigationConfigState,
  mapping: NavigationFilterMapping,
): NavigationConfigState {
  if (!state.editingLink) return state;
  return {
    ...state,
    editingLink: {
      ...state.editingLink,
      filterMappings: [...state.editingLink.filterMappings, mapping],
    },
  };
}

export function removeEditingFilterMapping(
  state: NavigationConfigState,
  index: number,
): NavigationConfigState {
  if (!state.editingLink) return state;
  if (index < 0 || index >= state.editingLink.filterMappings.length) return state;
  return {
    ...state,
    editingLink: {
      ...state.editingLink,
      filterMappings: state.editingLink.filterMappings.filter((_, i) => i !== index),
    },
  };
}

// ========================================================================
// Auto-mapping
// ========================================================================

export function generateAutoMappingSuggestions(
  sourceFields: string[],
  targetFields: Array<{ id: string; label: string; field: string }>,
): AutoMappingSuggestion[] {
  const suggestions: AutoMappingSuggestion[] = [];

  for (const sourceField of sourceFields) {
    const srcLower = sourceField.toLowerCase();

    for (const target of targetFields) {
      const tgtLower = target.field.toLowerCase();

      // Exact match
      if (srcLower === tgtLower) {
        suggestions.push({
          sourceField,
          targetFilterId: target.id,
          targetFilterLabel: target.label,
          confidence: 'high',
          reason: `Exact field name match: "${sourceField}"`,
        });
        continue;
      }

      // Suffix match (e.g., "order_id" matches "id")
      if (srcLower.endsWith(`_${tgtLower}`) || tgtLower.endsWith(`_${srcLower}`)) {
        suggestions.push({
          sourceField,
          targetFilterId: target.id,
          targetFilterLabel: target.label,
          confidence: 'medium',
          reason: `Partial field name match`,
        });
        continue;
      }

      // Contains match
      if (srcLower.includes(tgtLower) || tgtLower.includes(srcLower)) {
        if (srcLower.length > 2 && tgtLower.length > 2) {
          suggestions.push({
            sourceField,
            targetFilterId: target.id,
            targetFilterLabel: target.label,
            confidence: 'low',
            reason: `Field names share common substring`,
          });
        }
      }
    }
  }

  return suggestions.sort((a, b) => {
    const confidenceOrder = { high: 0, medium: 1, low: 2 };
    return confidenceOrder[a.confidence] - confidenceOrder[b.confidence];
  });
}

export function applySuggestions(
  state: NavigationConfigState,
  suggestions: AutoMappingSuggestion[],
): NavigationConfigState {
  return { ...state, autoMappingSuggestions: suggestions };
}

// ========================================================================
// Circular detection
// ========================================================================

export function checkCircularNavigation(
  links: NavigationLinkConfig[],
): string[][] {
  // Convert to the format expected by detectCircularLinks
  const navLinks: NavigationLink[] = links.map(l => ({
    id: l.id,
    sourceArtifactId: l.sourceArtifactId,
    targetArtifactId: l.targetArtifactId,
    targetArtifactType: l.targetArtifactType,
    label: l.label,
    description: l.description,
    filterMappings: l.filterMappings,
    openBehavior: l.openBehavior,
  }));

  return detectCircularLinks(navLinks);
}

// ========================================================================
// Link testing
// ========================================================================

export function testLink(
  state: NavigationConfigState,
  linkId: string,
): NavigationConfigState {
  const link = state.links.find(l => l.id === linkId);
  if (!link) return state;

  const errors: string[] = [];

  // Check target artifact exists
  const targetExists = state.artifacts.some(a => a.id === link.targetArtifactId);
  if (!targetExists) {
    errors.push('Target artifact not found');
  }

  // Check source artifact exists
  const sourceExists = state.artifacts.some(a => a.id === link.sourceArtifactId);
  if (!sourceExists) {
    errors.push('Source artifact not found');
  }

  // Check circular
  const cycles = checkCircularNavigation(state.links);
  const circularDetected = cycles.some(cycle => cycle.includes(link.sourceArtifactId));

  if (circularDetected) {
    errors.push('Circular navigation detected');
  }

  // Check label
  if (!link.label?.trim()) {
    errors.push('Link label is required');
  }

  const result: LinkTestResult = {
    linkId,
    reachable: targetExists,
    circularDetected,
    filterMappingsValid: link.filterMappings.length === 0 || link.filterMappings.every(m => m.sourceField && m.targetFilterDefinitionId),
    errors,
  };

  const testResults = new Map(state.testResults);
  testResults.set(linkId, result);

  return { ...state, testResults };
}

export function testAllLinks(
  state: NavigationConfigState,
): NavigationConfigState {
  let current = state;
  for (const link of state.links) {
    current = testLink(current, link.id);
  }
  return current;
}

// ========================================================================
// Validation
// ========================================================================

export interface NavigationConfigValidation {
  valid: boolean;
  errors: string[];
}

export function validateNavigationConfig(
  state: NavigationConfigState,
): NavigationConfigValidation {
  const errors: string[] = [];

  for (const link of state.links) {
    if (!link.label?.trim()) {
      errors.push(`Link "${link.id}" has no label`);
    }
    if (!link.targetArtifactId?.trim()) {
      errors.push(`Link "${link.label || link.id}" has no target`);
    }
  }

  const cycles = checkCircularNavigation(state.links);
  if (cycles.length > 0) {
    errors.push(`Circular navigation detected: ${cycles.length} cycle(s)`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Reset the link counter. Exposed only for testing determinism.
 * @internal
 */
export function _resetLinkCounter(): void {
  linkCounter = 0;
}
