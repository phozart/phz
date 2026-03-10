import { describe, it, expect } from 'vitest';
import {
  initialUnifiedWorkspaceState,
  navigateToView,
  navigateBack,
  canNavigateBack,
  setWorkspaceViewDirty,
  renameWorkspaceView,
  toggleWorkspaceDataPanel,
  setWorkspaceDataPanelWidth,
  setWorkspaceDataPanelTab,
  getAvailableDataPanelTabs,
  openWorkspaceDrawer,
  closeWorkspaceDrawer,
  setWorkspaceDrawerWidth,
  addWorkspaceRecentArtifact,
  getActiveWorkspaceView,
  isAuthoringView,
  shouldShowDataPanel,
  shouldShowSelectorBar,
  type WorkspaceView,
} from '../unified-workspace-state.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeView(
  type: WorkspaceView['type'] = 'report',
  label = 'Test',
  artifactId?: string,
): WorkspaceView {
  return { type, label, icon: type, artifactId };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('UnifiedWorkspaceState', () => {
  // =========================================================================
  // Initialization
  // =========================================================================
  describe('initialUnifiedWorkspaceState', () => {
    it('starts with catalog view', () => {
      const s = initialUnifiedWorkspaceState();
      expect(s.activeView.type).toBe('catalog');
      expect(s.activeView.label).toBe('Catalog');
    });

    it('starts not dirty', () => {
      const s = initialUnifiedWorkspaceState();
      expect(s.isDirty).toBe(false);
    });

    it('starts with empty history', () => {
      const s = initialUnifiedWorkspaceState();
      expect(s.navigationHistory).toHaveLength(0);
    });

    it('starts with data panel open on data tab', () => {
      const s = initialUnifiedWorkspaceState();
      expect(s.dataPanelOpen).toBe(true);
      expect(s.dataPanelTab).toBe('data');
      expect(s.dataPanelWidth).toBe(280);
    });

    it('starts with no drawer', () => {
      const s = initialUnifiedWorkspaceState();
      expect(s.activeDrawer).toBeNull();
      expect(s.drawerWidth).toBe(360);
    });

    it('starts with empty recent artifacts', () => {
      const s = initialUnifiedWorkspaceState();
      expect(s.recentArtifacts).toHaveLength(0);
    });
  });

  // =========================================================================
  // Navigation
  // =========================================================================
  describe('navigateToView', () => {
    it('switches the active view', () => {
      const s = initialUnifiedWorkspaceState();
      const result = navigateToView(s, makeView('report', 'Sales Report', 'r1'));
      expect(result.activeView.type).toBe('report');
      expect(result.activeView.label).toBe('Sales Report');
      expect(result.activeView.artifactId).toBe('r1');
    });

    it('pushes current view onto history', () => {
      const s = initialUnifiedWorkspaceState();
      const result = navigateToView(s, makeView('report', 'Report', 'r1'));
      expect(result.navigationHistory).toHaveLength(1);
      expect(result.navigationHistory[0].type).toBe('catalog');
    });

    it('resets dirty state on navigation', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('report', 'R1', 'r1'));
      s = setWorkspaceViewDirty(s, true);
      expect(s.isDirty).toBe(true);

      const result = navigateToView(s, makeView('dashboard', 'D1', 'd1'));
      expect(result.isDirty).toBe(false);
    });

    it('no-op when navigating to the same view', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('report', 'R1', 'r1'));
      const result = navigateToView(s, makeView('report', 'R1', 'r1'));
      expect(result).toBe(s);
    });

    it('same view type with different artifactId is a different view', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('report', 'R1', 'r1'));
      const result = navigateToView(s, makeView('report', 'R2', 'r2'));
      expect(result.activeView.artifactId).toBe('r2');
      expect(result.navigationHistory).toHaveLength(2);
    });

    it('catalog to catalog is same view (no artifactId)', () => {
      const s = initialUnifiedWorkspaceState();
      const result = navigateToView(s, { type: 'catalog', label: 'Cat', icon: 'catalog' });
      expect(result).toBe(s);
    });

    it('adds artifact views to recent artifacts', () => {
      const s = initialUnifiedWorkspaceState();
      const result = navigateToView(s, makeView('dashboard', 'Sales', 'dash-1'));
      expect(result.recentArtifacts).toHaveLength(1);
      expect(result.recentArtifacts[0].id).toBe('dash-1');
      expect(result.recentArtifacts[0].name).toBe('Sales');
    });

    it('does not add non-artifact views to recent', () => {
      const s = initialUnifiedWorkspaceState();
      const result = navigateToView(s, makeView('explore', 'Explore'));
      expect(result.recentArtifacts).toHaveLength(0);
    });

    it('caps history at 20 entries', () => {
      let s = initialUnifiedWorkspaceState();
      for (let i = 0; i < 25; i++) {
        s = navigateToView(s, makeView('report', `R${i}`, `r${i}`));
      }
      expect(s.navigationHistory.length).toBeLessThanOrEqual(20);
    });

    it('resets dataPanelTab when navigating from authoring to non-authoring', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('report', 'R1', 'r1'));
      // dataPanelTab is always 'data' now
      expect(s.dataPanelTab).toBe('data');

      const result = navigateToView(s, { type: 'catalog', label: 'Catalog', icon: 'catalog' });
      expect(result.dataPanelTab).toBe('data');
    });

    it('keeps dataPanelTab as data when navigating between authoring views', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('report', 'R1', 'r1'));

      const result = navigateToView(s, makeView('dashboard', 'D1', 'd1'));
      expect(result.dataPanelTab).toBe('data');
    });

    it('does not mutate original state', () => {
      const s = initialUnifiedWorkspaceState();
      const copy = { ...s, activeView: { ...s.activeView } };
      navigateToView(s, makeView('report', 'R1', 'r1'));
      expect(s.activeView).toEqual(copy.activeView);
      expect(s.navigationHistory).toEqual(copy.navigationHistory);
    });

    it('auto-closes data panel when entering authoring view', () => {
      const s = initialUnifiedWorkspaceState();
      expect(s.dataPanelOpen).toBe(true);

      const result = navigateToView(s, makeView('report', 'R1', 'r1'));
      expect(result.dataPanelOpen).toBe(false);
    });

    it('auto-opens data panel when leaving authoring view', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('report', 'R1', 'r1'));
      expect(s.dataPanelOpen).toBe(false);

      const result = navigateToView(s, { type: 'catalog', label: 'Catalog', icon: 'catalog' });
      expect(result.dataPanelOpen).toBe(true);
    });

    it('keeps data panel closed between authoring views', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('report', 'R1', 'r1'));
      expect(s.dataPanelOpen).toBe(false);

      const result = navigateToView(s, makeView('dashboard', 'D1', 'd1'));
      expect(result.dataPanelOpen).toBe(false);
    });

    it('keeps data panel open between non-authoring views', () => {
      let s = initialUnifiedWorkspaceState();
      expect(s.dataPanelOpen).toBe(true);

      const result = navigateToView(s, makeView('data-sources', 'Data'));
      expect(result.dataPanelOpen).toBe(true);
    });
  });

  describe('navigateBack', () => {
    it('returns to previous view', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('report', 'R1', 'r1'));
      const result = navigateBack(s);
      expect(result.activeView.type).toBe('catalog');
    });

    it('pops history stack', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('report', 'R1', 'r1'));
      s = navigateToView(s, makeView('dashboard', 'D1', 'd1'));
      expect(s.navigationHistory).toHaveLength(2);

      const result = navigateBack(s);
      expect(result.activeView.type).toBe('report');
      expect(result.navigationHistory).toHaveLength(1);
    });

    it('no-op when history is empty', () => {
      const s = initialUnifiedWorkspaceState();
      const result = navigateBack(s);
      expect(result).toBe(s);
    });

    it('resets dirty state', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('report', 'R1', 'r1'));
      s = setWorkspaceViewDirty(s, true);
      const result = navigateBack(s);
      expect(result.isDirty).toBe(false);
    });

    it('resets dataPanelTab when going back to non-authoring view', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('report', 'R1', 'r1'));
      const result = navigateBack(s);
      expect(result.dataPanelTab).toBe('data');
    });

    it('auto-opens data panel when going back from authoring to catalog', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('report', 'R1', 'r1'));
      expect(s.dataPanelOpen).toBe(false);

      const result = navigateBack(s);
      expect(result.dataPanelOpen).toBe(true);
    });

    it('auto-closes data panel when going back into authoring', () => {
      let s = initialUnifiedWorkspaceState();
      // catalog → report → catalog
      s = navigateToView(s, makeView('report', 'R1', 'r1'));
      s = navigateToView(s, { type: 'catalog', label: 'Catalog', icon: 'catalog' });
      expect(s.dataPanelOpen).toBe(true);

      // Go back to report
      const result = navigateBack(s);
      expect(result.activeView.type).toBe('report');
      expect(result.dataPanelOpen).toBe(false);
    });
  });

  describe('canNavigateBack', () => {
    it('false when history is empty', () => {
      expect(canNavigateBack(initialUnifiedWorkspaceState())).toBe(false);
    });

    it('true when history has entries', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('report', 'R1', 'r1'));
      expect(canNavigateBack(s)).toBe(true);
    });
  });

  // =========================================================================
  // Dirty State
  // =========================================================================
  describe('setWorkspaceViewDirty', () => {
    it('marks the current view dirty', () => {
      const s = initialUnifiedWorkspaceState();
      const result = setWorkspaceViewDirty(s, true);
      expect(result.isDirty).toBe(true);
    });

    it('marks the current view clean', () => {
      let s = initialUnifiedWorkspaceState();
      s = setWorkspaceViewDirty(s, true);
      const result = setWorkspaceViewDirty(s, false);
      expect(result.isDirty).toBe(false);
    });

    it('no-op when already in the same state', () => {
      const s = initialUnifiedWorkspaceState();
      const result = setWorkspaceViewDirty(s, false);
      expect(result).toBe(s);
    });
  });

  // =========================================================================
  // Rename
  // =========================================================================
  describe('renameWorkspaceView', () => {
    it('updates the active view label', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('report', 'Draft', 'r1'));
      const result = renameWorkspaceView(s, 'Sales Report Q4');
      expect(result.activeView.label).toBe('Sales Report Q4');
    });
  });

  // =========================================================================
  // Data Panel
  // =========================================================================
  describe('toggleWorkspaceDataPanel', () => {
    it('toggles from open to closed', () => {
      const s = initialUnifiedWorkspaceState();
      const result = toggleWorkspaceDataPanel(s);
      expect(result.dataPanelOpen).toBe(false);
    });

    it('toggles from closed to open', () => {
      let s = initialUnifiedWorkspaceState();
      s = toggleWorkspaceDataPanel(s);
      const result = toggleWorkspaceDataPanel(s);
      expect(result.dataPanelOpen).toBe(true);
    });
  });

  describe('setWorkspaceDataPanelWidth', () => {
    it('sets width within valid range', () => {
      const s = initialUnifiedWorkspaceState();
      const result = setWorkspaceDataPanelWidth(s, 350);
      expect(result.dataPanelWidth).toBe(350);
    });

    it('clamps width below minimum to 200', () => {
      const s = initialUnifiedWorkspaceState();
      const result = setWorkspaceDataPanelWidth(s, 50);
      expect(result.dataPanelWidth).toBe(200);
    });

    it('clamps width above maximum to 480', () => {
      const s = initialUnifiedWorkspaceState();
      const result = setWorkspaceDataPanelWidth(s, 900);
      expect(result.dataPanelWidth).toBe(480);
    });
  });

  // =========================================================================
  // Data Panel Tabs
  // =========================================================================
  describe('dataPanelTab', () => {
    it('defaults to data tab', () => {
      const s = initialUnifiedWorkspaceState();
      expect(s.dataPanelTab).toBe('data');
    });

    it('rejects filters tab on a report (filters live in editor)', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('report', 'R1', 'r1'));
      const result = setWorkspaceDataPanelTab(s, 'filters' as 'data');
      expect(result).toBe(s);
      expect(result.dataPanelTab).toBe('data');
    });

    it('rejects settings tab on a dashboard (settings live in editor)', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('dashboard', 'D1', 'd1'));
      const result = setWorkspaceDataPanelTab(s, 'settings' as 'data');
      expect(result).toBe(s);
      expect(result.dataPanelTab).toBe('data');
    });

    it('rejects filters tab when on catalog', () => {
      const s = initialUnifiedWorkspaceState();
      const result = setWorkspaceDataPanelTab(s, 'filters' as 'data');
      expect(result).toBe(s);
      expect(result.dataPanelTab).toBe('data');
    });

    it('rejects settings tab when on data-sources', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('data-sources', 'Data Sources'));
      const result = setWorkspaceDataPanelTab(s, 'settings' as 'data');
      expect(result).toBe(s);
    });

    it('no-op when setting the same tab', () => {
      const s = initialUnifiedWorkspaceState();
      const result = setWorkspaceDataPanelTab(s, 'data');
      expect(result).toBe(s);
    });

    it('rejects filters on explore (filters live in editor)', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('explore', 'Explore'));
      const result = setWorkspaceDataPanelTab(s, 'filters' as 'data');
      expect(result).toBe(s);
      expect(result.dataPanelTab).toBe('data');
    });
  });

  describe('getAvailableDataPanelTabs', () => {
    it('returns only data for catalog', () => {
      const s = initialUnifiedWorkspaceState();
      expect(getAvailableDataPanelTabs(s)).toEqual(['data']);
    });

    it('returns only data for report (filters/settings live in editor)', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('report', 'R1', 'r1'));
      expect(getAvailableDataPanelTabs(s)).toEqual(['data']);
    });

    it('returns only data for dashboard (filters/settings live in editor)', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('dashboard', 'D1', 'd1'));
      expect(getAvailableDataPanelTabs(s)).toEqual(['data']);
    });

    it('returns only data for explore (filters/settings live in editor)', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('explore', 'Explore'));
      expect(getAvailableDataPanelTabs(s)).toEqual(['data']);
    });

    it('returns only data for data-sources', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('data-sources', 'Data'));
      expect(getAvailableDataPanelTabs(s)).toEqual(['data']);
    });
  });

  // =========================================================================
  // Drawer
  // =========================================================================
  describe('openWorkspaceDrawer', () => {
    it('opens a drawer panel', () => {
      const s = initialUnifiedWorkspaceState();
      const result = openWorkspaceDrawer(s, 'preferences');
      expect(result.activeDrawer).toBe('preferences');
    });

    it('toggles off when opening the same drawer', () => {
      let s = initialUnifiedWorkspaceState();
      s = openWorkspaceDrawer(s, 'alerts');
      const result = openWorkspaceDrawer(s, 'alerts');
      expect(result.activeDrawer).toBeNull();
    });

    it('switches drawer when opening a different one', () => {
      let s = initialUnifiedWorkspaceState();
      s = openWorkspaceDrawer(s, 'alerts');
      const result = openWorkspaceDrawer(s, 'lineage');
      expect(result.activeDrawer).toBe('lineage');
    });
  });

  describe('closeWorkspaceDrawer', () => {
    it('closes the active drawer', () => {
      let s = initialUnifiedWorkspaceState();
      s = openWorkspaceDrawer(s, 'permissions');
      const result = closeWorkspaceDrawer(s);
      expect(result.activeDrawer).toBeNull();
    });

    it('no-op when no drawer is open', () => {
      const s = initialUnifiedWorkspaceState();
      const result = closeWorkspaceDrawer(s);
      expect(result.activeDrawer).toBeNull();
    });
  });

  describe('setWorkspaceDrawerWidth', () => {
    it('sets width within valid range', () => {
      const s = initialUnifiedWorkspaceState();
      const result = setWorkspaceDrawerWidth(s, 400);
      expect(result.drawerWidth).toBe(400);
    });

    it('clamps width below minimum to 280', () => {
      const s = initialUnifiedWorkspaceState();
      const result = setWorkspaceDrawerWidth(s, 100);
      expect(result.drawerWidth).toBe(280);
    });

    it('clamps width above maximum to 600', () => {
      const s = initialUnifiedWorkspaceState();
      const result = setWorkspaceDrawerWidth(s, 900);
      expect(result.drawerWidth).toBe(600);
    });
  });

  // =========================================================================
  // Recent Artifacts
  // =========================================================================
  describe('addWorkspaceRecentArtifact', () => {
    it('adds an artifact to the front', () => {
      const s = initialUnifiedWorkspaceState();
      const result = addWorkspaceRecentArtifact(s, {
        id: 'r1', type: 'report', name: 'Sales',
      });
      expect(result.recentArtifacts).toHaveLength(1);
      expect(result.recentArtifacts[0].id).toBe('r1');
    });

    it('deduplicates by id', () => {
      let s = initialUnifiedWorkspaceState();
      s = addWorkspaceRecentArtifact(s, { id: 'r1', type: 'report', name: 'Old' });
      s = addWorkspaceRecentArtifact(s, { id: 'r2', type: 'report', name: 'Other' });
      const result = addWorkspaceRecentArtifact(s, { id: 'r1', type: 'report', name: 'New' });
      expect(result.recentArtifacts).toHaveLength(2);
      expect(result.recentArtifacts[0].id).toBe('r1');
      expect(result.recentArtifacts[0].name).toBe('New');
    });

    it('caps at 10 entries', () => {
      let s = initialUnifiedWorkspaceState();
      for (let i = 0; i < 15; i++) {
        s = addWorkspaceRecentArtifact(s, { id: `r${i}`, type: 'report', name: `R${i}` });
      }
      expect(s.recentArtifacts).toHaveLength(10);
    });

    it('sets openedAt timestamp', () => {
      const s = initialUnifiedWorkspaceState();
      const result = addWorkspaceRecentArtifact(s, { id: 'r1', type: 'report', name: 'R' });
      expect(result.recentArtifacts[0].openedAt).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // Queries
  // =========================================================================
  describe('getActiveWorkspaceView', () => {
    it('returns the active view', () => {
      const s = initialUnifiedWorkspaceState();
      expect(getActiveWorkspaceView(s).type).toBe('catalog');
    });
  });

  describe('isAuthoringView', () => {
    it('false for catalog', () => {
      expect(isAuthoringView(initialUnifiedWorkspaceState())).toBe(false);
    });

    it('true for report', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('report', 'R1', 'r1'));
      expect(isAuthoringView(s)).toBe(true);
    });

    it('true for dashboard', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('dashboard', 'D1', 'd1'));
      expect(isAuthoringView(s)).toBe(true);
    });

    it('true for explore', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('explore', 'Explore'));
      expect(isAuthoringView(s)).toBe(true);
    });

    it('false for data-sources', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('data-sources', 'Data'));
      expect(isAuthoringView(s)).toBe(false);
    });
  });

  // =========================================================================
  // shouldShowDataPanel / shouldShowSelectorBar
  // =========================================================================
  describe('shouldShowDataPanel', () => {
    it('true for catalog', () => {
      expect(shouldShowDataPanel(initialUnifiedWorkspaceState())).toBe(true);
    });

    it('true for data-sources', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('data-sources', 'Data'));
      expect(shouldShowDataPanel(s)).toBe(true);
    });

    it('false for report', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('report', 'R1', 'r1'));
      expect(shouldShowDataPanel(s)).toBe(false);
    });

    it('false for dashboard', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('dashboard', 'D1', 'd1'));
      expect(shouldShowDataPanel(s)).toBe(false);
    });

    it('false for explore', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('explore', 'Explore'));
      expect(shouldShowDataPanel(s)).toBe(false);
    });
  });

  describe('shouldShowSelectorBar', () => {
    it('true for catalog', () => {
      expect(shouldShowSelectorBar(initialUnifiedWorkspaceState())).toBe(true);
    });

    it('true for data-sources', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('data-sources', 'Data'));
      expect(shouldShowSelectorBar(s)).toBe(true);
    });

    it('false for report', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('report', 'R1', 'r1'));
      expect(shouldShowSelectorBar(s)).toBe(false);
    });

    it('false for dashboard', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('dashboard', 'D1', 'd1'));
      expect(shouldShowSelectorBar(s)).toBe(false);
    });

    it('false for explore', () => {
      let s = initialUnifiedWorkspaceState();
      s = navigateToView(s, makeView('explore', 'Explore'));
      expect(shouldShowSelectorBar(s)).toBe(false);
    });
  });
});
