/**
 * Tests for adapter forwarding logic — determines which adapter properties
 * to set on panel components based on panel ID.
 *
 * Tasks: 1.6 (WB-001)
 */

import { describe, it, expect } from 'vitest';
import {
  getAdapterBindings,
  forwardAdaptersToElement,
  PANELS_NEEDING_DATA_ADAPTER,
  PANELS_NEEDING_WORKSPACE_ADAPTER,
} from '../shell/adapter-forwarding.js';

// Simple mocks — these are just marker objects for identity checks
const mockDataAdapter = { execute: () => {}, getSchema: () => {} } as any;
const mockWorkspaceAdapter = { getArtifact: () => {}, saveArtifact: () => {} } as any;

describe('adapter-forwarding', () => {
  describe('getAdapterBindings', () => {
    it('returns dataAdapter binding for data-sources panel', () => {
      const bindings = getAdapterBindings('data-sources', {
        dataAdapter: mockDataAdapter,
      });
      expect(bindings.adapter).toBe(mockDataAdapter);
    });

    it('returns dataAdapter binding for explore panel', () => {
      const bindings = getAdapterBindings('explore', {
        dataAdapter: mockDataAdapter,
      });
      expect(bindings.adapter).toBe(mockDataAdapter);
    });

    it('returns dataAdapter binding for authoring-report panel', () => {
      const bindings = getAdapterBindings('authoring-report', {
        dataAdapter: mockDataAdapter,
      });
      expect(bindings.adapter).toBe(mockDataAdapter);
    });

    it('returns dataAdapter binding for authoring-dashboard panel', () => {
      const bindings = getAdapterBindings('authoring-dashboard', {
        dataAdapter: mockDataAdapter,
      });
      expect(bindings.adapter).toBe(mockDataAdapter);
    });

    it('returns workspaceAdapter binding for catalog panel', () => {
      const bindings = getAdapterBindings('catalog', {
        workspaceAdapter: mockWorkspaceAdapter,
      });
      expect(bindings.workspaceAdapter).toBe(mockWorkspaceAdapter);
      // Catalog-only panels also get .adapter = workspaceAdapter
      // since the component expects its primary adapter on .adapter
      expect(bindings.adapter).toBe(mockWorkspaceAdapter);
    });

    it('returns workspaceAdapter binding for authoring-catalog panel', () => {
      const bindings = getAdapterBindings('authoring-catalog', {
        workspaceAdapter: mockWorkspaceAdapter,
      });
      expect(bindings.workspaceAdapter).toBe(mockWorkspaceAdapter);
      // Same: catalog-only panels get .adapter = workspaceAdapter
      expect(bindings.adapter).toBe(mockWorkspaceAdapter);
    });

    it('returns both adapters for authoring-report', () => {
      const bindings = getAdapterBindings('authoring-report', {
        dataAdapter: mockDataAdapter,
        workspaceAdapter: mockWorkspaceAdapter,
      });
      expect(bindings.adapter).toBe(mockDataAdapter);
      expect(bindings.workspaceAdapter).toBe(mockWorkspaceAdapter);
    });

    it('returns both adapters for authoring-dashboard', () => {
      const bindings = getAdapterBindings('authoring-dashboard', {
        dataAdapter: mockDataAdapter,
        workspaceAdapter: mockWorkspaceAdapter,
      });
      expect(bindings.adapter).toBe(mockDataAdapter);
      expect(bindings.workspaceAdapter).toBe(mockWorkspaceAdapter);
    });

    it('returns empty bindings for unknown panel', () => {
      const bindings = getAdapterBindings('unknown-panel', {
        dataAdapter: mockDataAdapter,
        workspaceAdapter: mockWorkspaceAdapter,
      });
      expect(Object.keys(bindings)).toHaveLength(0);
    });

    it('skips dataAdapter binding when adapter is undefined', () => {
      const bindings = getAdapterBindings('data-sources', {});
      expect(bindings.adapter).toBeUndefined();
      expect(Object.keys(bindings)).toHaveLength(0);
    });

    it('skips workspaceAdapter binding when adapter is undefined', () => {
      const bindings = getAdapterBindings('catalog', {});
      expect(bindings.workspaceAdapter).toBeUndefined();
      expect(Object.keys(bindings)).toHaveLength(0);
    });

    it('includes all panels that need DataAdapter', () => {
      expect(PANELS_NEEDING_DATA_ADAPTER).toContain('data-sources');
      expect(PANELS_NEEDING_DATA_ADAPTER).toContain('explore');
      expect(PANELS_NEEDING_DATA_ADAPTER).toContain('authoring-report');
      expect(PANELS_NEEDING_DATA_ADAPTER).toContain('authoring-dashboard');
      expect(PANELS_NEEDING_DATA_ADAPTER).toContain('engine-admin');
    });

    it('includes all panels that need WorkspaceAdapter', () => {
      expect(PANELS_NEEDING_WORKSPACE_ADAPTER).toContain('catalog');
      expect(PANELS_NEEDING_WORKSPACE_ADAPTER).toContain('authoring-catalog');
      expect(PANELS_NEEDING_WORKSPACE_ADAPTER).toContain('authoring-report');
      expect(PANELS_NEEDING_WORKSPACE_ADAPTER).toContain('authoring-dashboard');
    });
  });

  describe('forwardAdaptersToElement', () => {
    it('sets all binding properties on the element', () => {
      const el = {} as any;
      forwardAdaptersToElement(el, {
        adapter: mockDataAdapter,
        workspaceAdapter: mockWorkspaceAdapter,
      });
      expect(el.adapter).toBe(mockDataAdapter);
      expect(el.workspaceAdapter).toBe(mockWorkspaceAdapter);
    });

    it('does nothing with empty bindings', () => {
      const el = {} as any;
      forwardAdaptersToElement(el, {});
      expect(Object.keys(el)).toHaveLength(0);
    });

    it('preserves existing element properties', () => {
      const el = { name: 'test', role: 'admin' } as any;
      forwardAdaptersToElement(el, { adapter: mockDataAdapter });
      expect(el.name).toBe('test');
      expect(el.role).toBe('admin');
      expect(el.adapter).toBe(mockDataAdapter);
    });
  });
});
