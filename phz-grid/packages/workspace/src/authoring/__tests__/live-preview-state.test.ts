import { describe, it, expect } from 'vitest';
import {
  createLivePreviewState,
  togglePreview,
  setPreviewBreakpoint,
  cycleBreakpoint,
  setLivePreviewRole,
  toggleAnnotations,
  toggleBreakpointLabel,
  getBreakpointWidth,
  getBreakpointConfig,
  PREVIEW_BREAKPOINTS,
} from '../live-preview-state.js';
import type { LivePreviewState } from '../live-preview-state.js';

describe('LivePreviewState', () => {
  describe('createLivePreviewState', () => {
    it('returns correct defaults', () => {
      const s = createLivePreviewState();
      expect(s.active).toBe(false);
      expect(s.breakpoint).toBe('desktop');
      expect(s.role).toBe('viewer');
      expect(s.showAnnotations).toBe(false);
      expect(s.showBreakpointLabel).toBe(true);
    });

    it('accepts partial overrides', () => {
      const s = createLivePreviewState({ active: true, role: 'admin' });
      expect(s.active).toBe(true);
      expect(s.role).toBe('admin');
      // non-overridden fields keep defaults
      expect(s.breakpoint).toBe('desktop');
      expect(s.showAnnotations).toBe(false);
      expect(s.showBreakpointLabel).toBe(true);
    });

    it('accepts all overrides', () => {
      const s = createLivePreviewState({
        active: true,
        breakpoint: 'mobile',
        role: 'author',
        showAnnotations: true,
        showBreakpointLabel: false,
      });
      expect(s.active).toBe(true);
      expect(s.breakpoint).toBe('mobile');
      expect(s.role).toBe('author');
      expect(s.showAnnotations).toBe(true);
      expect(s.showBreakpointLabel).toBe(false);
    });
  });

  describe('togglePreview', () => {
    it('activates when inactive', () => {
      const s = togglePreview(createLivePreviewState());
      expect(s.active).toBe(true);
    });

    it('deactivates and resets breakpoint to desktop', () => {
      let s = createLivePreviewState({ active: true, breakpoint: 'mobile' });
      s = togglePreview(s);
      expect(s.active).toBe(false);
      expect(s.breakpoint).toBe('desktop');
    });

    it('preserves other fields when activating', () => {
      const s = togglePreview(createLivePreviewState({ role: 'admin', showAnnotations: true }));
      expect(s.role).toBe('admin');
      expect(s.showAnnotations).toBe(true);
    });
  });

  describe('setPreviewBreakpoint', () => {
    it('sets breakpoint when active', () => {
      const active = createLivePreviewState({ active: true });
      const s = setPreviewBreakpoint(active, 'tablet');
      expect(s.breakpoint).toBe('tablet');
    });

    it('is no-op (same ref) when not active', () => {
      const inactive = createLivePreviewState();
      const s = setPreviewBreakpoint(inactive, 'tablet');
      expect(s).toBe(inactive);
    });

    it('sets mobile breakpoint when active', () => {
      const active = createLivePreviewState({ active: true });
      const s = setPreviewBreakpoint(active, 'mobile');
      expect(s.breakpoint).toBe('mobile');
    });
  });

  describe('cycleBreakpoint', () => {
    it('cycles desktop -> tablet', () => {
      const s = cycleBreakpoint(createLivePreviewState({ active: true, breakpoint: 'desktop' }));
      expect(s.breakpoint).toBe('tablet');
    });

    it('cycles tablet -> mobile', () => {
      const s = cycleBreakpoint(createLivePreviewState({ active: true, breakpoint: 'tablet' }));
      expect(s.breakpoint).toBe('mobile');
    });

    it('cycles mobile -> desktop', () => {
      const s = cycleBreakpoint(createLivePreviewState({ active: true, breakpoint: 'mobile' }));
      expect(s.breakpoint).toBe('desktop');
    });

    it('is no-op (same ref) when not active', () => {
      const inactive = createLivePreviewState({ breakpoint: 'desktop' });
      const s = cycleBreakpoint(inactive);
      expect(s).toBe(inactive);
    });
  });

  describe('setLivePreviewRole', () => {
    it('sets role to admin', () => {
      const s = setLivePreviewRole(createLivePreviewState(), 'admin');
      expect(s.role).toBe('admin');
    });

    it('sets role to author', () => {
      const s = setLivePreviewRole(createLivePreviewState(), 'author');
      expect(s.role).toBe('author');
    });

    it('sets role to viewer', () => {
      const s = setLivePreviewRole(createLivePreviewState({ role: 'admin' }), 'viewer');
      expect(s.role).toBe('viewer');
    });
  });

  describe('toggleAnnotations', () => {
    it('flips false to true', () => {
      const s = toggleAnnotations(createLivePreviewState());
      expect(s.showAnnotations).toBe(true);
    });

    it('flips true to false', () => {
      const s = toggleAnnotations(createLivePreviewState({ showAnnotations: true }));
      expect(s.showAnnotations).toBe(false);
    });
  });

  describe('toggleBreakpointLabel', () => {
    it('flips true to false', () => {
      const s = toggleBreakpointLabel(createLivePreviewState());
      expect(s.showBreakpointLabel).toBe(false);
    });

    it('flips false to true', () => {
      const s = toggleBreakpointLabel(createLivePreviewState({ showBreakpointLabel: false }));
      expect(s.showBreakpointLabel).toBe(true);
    });
  });

  describe('getBreakpointWidth', () => {
    it('returns 1440 for desktop', () => {
      const s = createLivePreviewState({ breakpoint: 'desktop' });
      expect(getBreakpointWidth(s)).toBe(1440);
    });

    it('returns 768 for tablet', () => {
      const s = createLivePreviewState({ breakpoint: 'tablet' });
      expect(getBreakpointWidth(s)).toBe(768);
    });

    it('returns 375 for mobile', () => {
      const s = createLivePreviewState({ breakpoint: 'mobile' });
      expect(getBreakpointWidth(s)).toBe(375);
    });
  });

  describe('getBreakpointConfig', () => {
    it('returns desktop config', () => {
      const cfg = getBreakpointConfig('desktop');
      expect(cfg).toEqual({ name: 'desktop', label: 'Desktop', width: 1440 });
    });

    it('returns tablet config', () => {
      const cfg = getBreakpointConfig('tablet');
      expect(cfg).toEqual({ name: 'tablet', label: 'Tablet', width: 768 });
    });

    it('returns mobile config', () => {
      const cfg = getBreakpointConfig('mobile');
      expect(cfg).toEqual({ name: 'mobile', label: 'Mobile', width: 375 });
    });
  });

  describe('PREVIEW_BREAKPOINTS', () => {
    it('has exactly 3 entries', () => {
      expect(PREVIEW_BREAKPOINTS).toHaveLength(3);
    });

    it('is ordered desktop, tablet, mobile', () => {
      expect(PREVIEW_BREAKPOINTS[0].name).toBe('desktop');
      expect(PREVIEW_BREAKPOINTS[1].name).toBe('tablet');
      expect(PREVIEW_BREAKPOINTS[2].name).toBe('mobile');
    });
  });

  describe('immutability', () => {
    it('togglePreview returns a new object', () => {
      const s0 = createLivePreviewState();
      const s1 = togglePreview(s0);
      expect(s0).not.toBe(s1);
    });

    it('togglePreview does not mutate original state', () => {
      const original = createLivePreviewState();
      const frozen = { ...original };
      togglePreview(original);
      expect(original).toEqual(frozen);
    });

    it('setPreviewBreakpoint returns a new object when active', () => {
      const s0 = createLivePreviewState({ active: true });
      const s1 = setPreviewBreakpoint(s0, 'tablet');
      expect(s0).not.toBe(s1);
    });

    it('setPreviewBreakpoint does not mutate original', () => {
      const original = createLivePreviewState({ active: true });
      const frozen = { ...original };
      setPreviewBreakpoint(original, 'mobile');
      expect(original).toEqual(frozen);
    });

    it('cycleBreakpoint returns a new object when active', () => {
      const s0 = createLivePreviewState({ active: true });
      const s1 = cycleBreakpoint(s0);
      expect(s0).not.toBe(s1);
    });

    it('cycleBreakpoint does not mutate original', () => {
      const original = createLivePreviewState({ active: true, breakpoint: 'desktop' });
      const frozen = { ...original };
      cycleBreakpoint(original);
      expect(original).toEqual(frozen);
    });

    it('setLivePreviewRole returns a new object', () => {
      const s0 = createLivePreviewState();
      const s1 = setLivePreviewRole(s0, 'admin');
      expect(s0).not.toBe(s1);
    });

    it('setLivePreviewRole does not mutate original', () => {
      const original = createLivePreviewState();
      const frozen = { ...original };
      setLivePreviewRole(original, 'author');
      expect(original).toEqual(frozen);
    });

    it('toggleAnnotations returns a new object', () => {
      const s0 = createLivePreviewState();
      const s1 = toggleAnnotations(s0);
      expect(s0).not.toBe(s1);
    });

    it('toggleAnnotations does not mutate original', () => {
      const original = createLivePreviewState();
      const frozen = { ...original };
      toggleAnnotations(original);
      expect(original).toEqual(frozen);
    });

    it('toggleBreakpointLabel returns a new object', () => {
      const s0 = createLivePreviewState();
      const s1 = toggleBreakpointLabel(s0);
      expect(s0).not.toBe(s1);
    });

    it('toggleBreakpointLabel does not mutate original', () => {
      const original = createLivePreviewState();
      const frozen = { ...original };
      toggleBreakpointLabel(original);
      expect(original).toEqual(frozen);
    });

    it('each transition returns a new object reference', () => {
      const s0 = createLivePreviewState();
      const s1 = togglePreview(s0);
      const s2 = setPreviewBreakpoint(s1, 'tablet');
      const s3 = cycleBreakpoint(s2);
      const s4 = setLivePreviewRole(s3, 'admin');
      const s5 = toggleAnnotations(s4);
      const s6 = toggleBreakpointLabel(s5);
      expect(s0).not.toBe(s1);
      expect(s1).not.toBe(s2);
      expect(s2).not.toBe(s3);
      expect(s3).not.toBe(s4);
      expect(s4).not.toBe(s5);
      expect(s5).not.toBe(s6);
    });
  });
});
