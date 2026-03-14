/**
 * @phozart/workspace — NavigationEditor headless state (V.2)
 *
 * Pure state management for authoring navigation links.
 * Supports auto-mapping source fields to target filter definitions.
 */

import type { ArtifactType } from '../types.js';
import type { FilterDefinition } from '../filters/filter-definition.js';
import type {
  NavigationLink,
  NavigationFilterMapping,
  NavigationOpenBehavior,
} from './navigation-link.js';

// ========================================================================
// Editor state
// ========================================================================

export interface NavigationEditorState {
  id?: string;
  sourceArtifactId: string;
  targetArtifactId: string;
  targetArtifactType: ArtifactType;
  label: string;
  description?: string;
  filterMappings: NavigationFilterMapping[];
  openBehavior: NavigationOpenBehavior;
}

// ========================================================================
// Validation
// ========================================================================

export interface NavigationValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateNavigationEditorState(
  state: NavigationEditorState,
): NavigationValidationResult {
  const errors: string[] = [];

  if (!state.targetArtifactId?.trim()) {
    errors.push('target artifact is required');
  }

  if (!state.label?.trim()) {
    errors.push('label is required');
  }

  return { valid: errors.length === 0, errors };
}

// ========================================================================
// Factory
// ========================================================================

export function createNavigationEditorState(
  sourceArtifactId: string,
  existingLink?: NavigationLink,
): NavigationEditorState {
  if (existingLink) {
    return {
      id: existingLink.id,
      sourceArtifactId,
      targetArtifactId: existingLink.targetArtifactId,
      targetArtifactType: existingLink.targetArtifactType,
      label: existingLink.label,
      description: existingLink.description,
      filterMappings: [...existingLink.filterMappings],
      openBehavior: existingLink.openBehavior ?? 'same-panel',
    };
  }

  return {
    sourceArtifactId,
    targetArtifactId: '',
    targetArtifactType: 'report',
    label: '',
    filterMappings: [],
    openBehavior: 'same-panel',
  };
}

// ========================================================================
// State operations (immutable)
// ========================================================================

export function setTarget(
  state: NavigationEditorState,
  targetArtifactId: string,
  targetArtifactType: ArtifactType,
  label: string,
): NavigationEditorState {
  return { ...state, targetArtifactId, targetArtifactType, label };
}

export function addFilterMapping(
  state: NavigationEditorState,
  mapping: NavigationFilterMapping,
): NavigationEditorState {
  return {
    ...state,
    filterMappings: [...state.filterMappings, mapping],
  };
}

export function removeFilterMapping(
  state: NavigationEditorState,
  index: number,
): NavigationEditorState {
  if (index < 0 || index >= state.filterMappings.length) return state;
  return {
    ...state,
    filterMappings: state.filterMappings.filter((_, i) => i !== index),
  };
}

export function setOpenBehavior(
  state: NavigationEditorState,
  behavior: NavigationOpenBehavior,
): NavigationEditorState {
  return { ...state, openBehavior: behavior };
}

// ========================================================================
// Extract NavigationLink from editor state
// ========================================================================

let counter = 0;
function generateId(): string {
  return `nl_${Date.now()}_${++counter}`;
}

export function getNavigationLink(state: NavigationEditorState): NavigationLink {
  return {
    id: state.id ?? generateId(),
    sourceArtifactId: state.sourceArtifactId,
    targetArtifactId: state.targetArtifactId,
    targetArtifactType: state.targetArtifactType,
    label: state.label,
    description: state.description,
    filterMappings: [...state.filterMappings],
    openBehavior: state.openBehavior,
  };
}

// ========================================================================
// Auto-mapping: match source fields to target filter definitions by
// comparing source field names against filter binding targetFields.
// ========================================================================

export function autoMapFilters(
  sourceFields: string[],
  targetFilterDefinitions: FilterDefinition[],
): NavigationFilterMapping[] {
  const mappings: NavigationFilterMapping[] = [];

  for (const field of sourceFields) {
    for (const def of targetFilterDefinitions) {
      const hasMatch = def.bindings.some(b => b.targetField === field);
      if (hasMatch) {
        mappings.push({
          sourceField: field,
          targetFilterDefinitionId: def.id,
          transform: 'passthrough',
        });
        break; // first match wins
      }
    }
  }

  return mappings;
}
