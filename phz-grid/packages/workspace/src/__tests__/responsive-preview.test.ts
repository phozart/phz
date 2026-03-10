import { describe, it, expect } from 'vitest';
import { PREVIEW_WIDTHS, PhzResponsivePreview } from '../shell/responsive-preview.js';
import type { PreviewDevice } from '../shell/responsive-preview.js';

describe('ResponsivePreview', () => {
  it('PREVIEW_WIDTHS has correct desktop width', () => {
    expect(PREVIEW_WIDTHS.desktop).toBe(1200);
  });

  it('PREVIEW_WIDTHS has correct tablet width', () => {
    expect(PREVIEW_WIDTHS.tablet).toBe(768);
  });

  it('PREVIEW_WIDTHS has correct mobile width', () => {
    expect(PREVIEW_WIDTHS.mobile).toBe(375);
  });

  it('PreviewDevice type covers 3 devices', () => {
    const devices: PreviewDevice[] = ['desktop', 'tablet', 'mobile'];
    expect(devices).toHaveLength(3);
    for (const device of devices) {
      expect(PREVIEW_WIDTHS[device]).toBeGreaterThan(0);
    }
  });

  it('component class exists with correct tag name', () => {
    expect(PhzResponsivePreview).toBeDefined();
    expect(PhzResponsivePreview.TAG).toBe('phz-responsive-preview');
  });
});
