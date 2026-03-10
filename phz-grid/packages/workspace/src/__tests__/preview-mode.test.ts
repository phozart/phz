/**
 * Preview Mode State (L.11) — Tests
 */
import { describe, it, expect } from 'vitest';
import {
  DEFAULT_VIEWPORT_PRESETS,
  createPreviewState,
  togglePreview,
  setViewport,
  getViewportWidth,
  type ViewportPreset,
  type PreviewState,
} from '../shell/preview-mode.js';

describe('Preview Mode (L.11)', () => {
  describe('DEFAULT_VIEWPORT_PRESETS', () => {
    it('has desktop, tablet, mobile presets', () => {
      const names = DEFAULT_VIEWPORT_PRESETS.map(p => p.name);
      expect(names).toContain('desktop');
      expect(names).toContain('tablet');
      expect(names).toContain('mobile');
    });

    it('desktop is 1280, tablet is 768, mobile is 375', () => {
      const find = (n: string) => DEFAULT_VIEWPORT_PRESETS.find(p => p.name === n)!;
      expect(find('desktop').width).toBe(1280);
      expect(find('tablet').width).toBe(768);
      expect(find('mobile').width).toBe(375);
    });
  });

  describe('createPreviewState', () => {
    it('starts inactive with desktop viewport', () => {
      const state = createPreviewState();
      expect(state.active).toBe(false);
      expect(state.viewport).toBe('desktop');
    });
  });

  describe('togglePreview', () => {
    it('toggles active flag', () => {
      const s1 = createPreviewState();
      const s2 = togglePreview(s1);
      expect(s2.active).toBe(true);
      const s3 = togglePreview(s2);
      expect(s3.active).toBe(false);
    });

    it('is immutable', () => {
      const s1 = createPreviewState();
      const s2 = togglePreview(s1);
      expect(s1.active).toBe(false);
      expect(s2.active).toBe(true);
    });
  });

  describe('setViewport', () => {
    it('sets viewport preset name', () => {
      const s1 = createPreviewState();
      const s2 = setViewport(s1, 'tablet');
      expect(s2.viewport).toBe('tablet');
    });

    it('is immutable', () => {
      const s1 = createPreviewState();
      setViewport(s1, 'mobile');
      expect(s1.viewport).toBe('desktop');
    });
  });

  describe('getViewportWidth', () => {
    it('resolves width from preset name', () => {
      const state = setViewport(createPreviewState(), 'tablet');
      expect(getViewportWidth(state, DEFAULT_VIEWPORT_PRESETS)).toBe(768);
    });

    it('falls back to first preset width for unknown name', () => {
      const state: PreviewState = { active: true, viewport: 'unknown' };
      const width = getViewportWidth(state, DEFAULT_VIEWPORT_PRESETS);
      expect(width).toBe(DEFAULT_VIEWPORT_PRESETS[0].width);
    });
  });
});
