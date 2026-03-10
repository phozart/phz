/**
 * Sprint V.2 — NavigationLink editor headless state
 *
 * Tests: editor state creation, step flow, auto-mapping, link management.
 */

import { describe, it, expect } from 'vitest';
import {
  createNavigationEditorState,
  setTarget,
  addFilterMapping,
  removeFilterMapping,
  setOpenBehavior,
  getNavigationLink,
  validateNavigationEditorState,
  autoMapFilters,
  type NavigationEditorState,
} from '../navigation/navigation-editor.js';
import type { NavigationFilterMapping } from '../navigation/navigation-link.js';
import type { FilterDefinition } from '../filters/filter-definition.js';

function makeDef(id: string, bindingField: string): FilterDefinition {
  return {
    id,
    label: `Filter ${id}`,
    filterType: 'select',
    valueSource: { type: 'static', values: ['A', 'B'] },
    bindings: [{ dataSourceId: 'ds1', targetField: bindingField }],
  };
}

describe('NavigationEditor (V.2)', () => {
  describe('createNavigationEditorState', () => {
    it('creates empty state', () => {
      const state = createNavigationEditorState('dash-1');
      expect(state.sourceArtifactId).toBe('dash-1');
      expect(state.targetArtifactId).toBe('');
      expect(state.label).toBe('');
      expect(state.filterMappings).toEqual([]);
      expect(state.openBehavior).toBe('same-panel');
    });

    it('creates from existing link', () => {
      const state = createNavigationEditorState('dash-1', {
        id: 'nl-1',
        sourceArtifactId: 'dash-1',
        targetArtifactId: 'report-1',
        targetArtifactType: 'report',
        label: 'View Report',
        filterMappings: [{ sourceField: 'region', targetFilterDefinitionId: 'fd-r', transform: 'passthrough' }],
        openBehavior: 'new-tab',
      });
      expect(state.targetArtifactId).toBe('report-1');
      expect(state.label).toBe('View Report');
      expect(state.filterMappings).toHaveLength(1);
      expect(state.openBehavior).toBe('new-tab');
    });
  });

  describe('setTarget', () => {
    it('sets target artifact', () => {
      let state = createNavigationEditorState('dash-1');
      state = setTarget(state, 'report-1', 'report', 'Sales Report');
      expect(state.targetArtifactId).toBe('report-1');
      expect(state.targetArtifactType).toBe('report');
      expect(state.label).toBe('Sales Report');
    });
  });

  describe('filter mapping management', () => {
    it('adds a filter mapping', () => {
      let state = createNavigationEditorState('dash-1');
      const mapping: NavigationFilterMapping = {
        sourceField: 'region',
        targetFilterDefinitionId: 'fd-region',
        transform: 'passthrough',
      };
      state = addFilterMapping(state, mapping);
      expect(state.filterMappings).toHaveLength(1);
    });

    it('removes a filter mapping by index', () => {
      let state = createNavigationEditorState('dash-1');
      state = addFilterMapping(state, { sourceField: 'a', targetFilterDefinitionId: 'fd-a', transform: 'passthrough' });
      state = addFilterMapping(state, { sourceField: 'b', targetFilterDefinitionId: 'fd-b', transform: 'passthrough' });
      state = removeFilterMapping(state, 0);
      expect(state.filterMappings).toHaveLength(1);
      expect(state.filterMappings[0].sourceField).toBe('b');
    });

    it('ignores out-of-bounds removal', () => {
      let state = createNavigationEditorState('dash-1');
      state = addFilterMapping(state, { sourceField: 'a', targetFilterDefinitionId: 'fd-a', transform: 'passthrough' });
      state = removeFilterMapping(state, 5);
      expect(state.filterMappings).toHaveLength(1);
    });
  });

  describe('setOpenBehavior', () => {
    it('sets the open behavior', () => {
      let state = createNavigationEditorState('dash-1');
      state = setOpenBehavior(state, 'new-tab');
      expect(state.openBehavior).toBe('new-tab');
    });
  });

  describe('getNavigationLink', () => {
    it('extracts a NavigationLink from state', () => {
      let state = createNavigationEditorState('dash-1');
      state = setTarget(state, 'report-1', 'report', 'Go to Report');
      state = addFilterMapping(state, { sourceField: 'region', targetFilterDefinitionId: 'fd-region', transform: 'passthrough' });
      const link = getNavigationLink(state);
      expect(link.sourceArtifactId).toBe('dash-1');
      expect(link.targetArtifactId).toBe('report-1');
      expect(link.label).toBe('Go to Report');
      expect(link.filterMappings).toHaveLength(1);
    });
  });

  describe('validateNavigationEditorState', () => {
    it('validates a complete state', () => {
      let state = createNavigationEditorState('dash-1');
      state = setTarget(state, 'report-1', 'report', 'View');
      const result = validateNavigationEditorState(state);
      expect(result.valid).toBe(true);
    });

    it('fails when target is empty', () => {
      const state = createNavigationEditorState('dash-1');
      const result = validateNavigationEditorState(state);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('target artifact is required');
    });

    it('fails when label is empty', () => {
      let state = createNavigationEditorState('dash-1');
      state = { ...state, targetArtifactId: 'r-1', targetArtifactType: 'report' };
      const result = validateNavigationEditorState(state);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('label is required');
    });
  });

  describe('autoMapFilters', () => {
    it('auto-maps source fields to matching filter definitions by binding field name', () => {
      const sourceFields = ['region', 'year', 'status'];
      const targetDefs = [
        makeDef('fd-region', 'region'),
        makeDef('fd-year', 'year'),
      ];
      const mappings = autoMapFilters(sourceFields, targetDefs);
      expect(mappings).toHaveLength(2);
      expect(mappings[0].sourceField).toBe('region');
      expect(mappings[0].targetFilterDefinitionId).toBe('fd-region');
      expect(mappings[1].sourceField).toBe('year');
    });

    it('returns empty when no matches', () => {
      const mappings = autoMapFilters(['foo'], [makeDef('fd-bar', 'bar')]);
      expect(mappings).toEqual([]);
    });
  });
});
