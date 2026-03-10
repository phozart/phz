/**
 * Annotation XSS prevention test
 *
 * Verifies that annotation.id is properly escaped in SVG output
 * to prevent XSS via crafted annotation IDs.
 */
import { describe, it, expect } from 'vitest';
import { renderAnnotationMarker, type Annotation } from '../annotations.js';

function makeAnnotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    id: 'safe-id',
    chartId: 'chart-1',
    dataPoint: { x: 10, y: 20 },
    text: 'Test annotation',
    ...overrides,
  };
}

describe('annotation XSS prevention', () => {
  it('escapes annotation.id with HTML entities in data-id', () => {
    const ann = makeAnnotation({ id: '"><script>alert(1)</script>' });
    const svg = renderAnnotationMarker(ann, { x: 10, y: 20 });
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&quot;&gt;&lt;script&gt;');
  });

  it('escapes annotation.id with double quotes', () => {
    const ann = makeAnnotation({ id: 'a"onload="alert(1)' });
    const svg = renderAnnotationMarker(ann, { x: 10, y: 20 });
    expect(svg).not.toContain('"onload=');
    expect(svg).toContain('a&quot;onload=');
  });

  it('escapes annotation.text (pre-existing)', () => {
    const ann = makeAnnotation({ text: '<img onerror=alert(1)>' });
    const svg = renderAnnotationMarker(ann, { x: 10, y: 20 });
    expect(svg).not.toContain('<img');
    expect(svg).toContain('&lt;img');
  });

  it('handles all marker styles with escaped id', () => {
    const maliciousId = '"><svg/onload=alert(1)>';
    const styles = ['pin', 'flag', 'circle', 'highlight'] as const;
    for (const style of styles) {
      const ann = makeAnnotation({ id: maliciousId, style });
      const svg = renderAnnotationMarker(ann, { x: 10, y: 20 });
      // The raw unescaped id must never appear — angle brackets must be escaped
      expect(svg).not.toContain('data-id=""><svg');
      expect(svg).toContain('data-id="&quot;&gt;&lt;svg/onload=alert(1)&gt;"');
    }
  });

  it('escapes ampersands in id', () => {
    const ann = makeAnnotation({ id: 'a&b' });
    const svg = renderAnnotationMarker(ann, { x: 10, y: 20 });
    expect(svg).toContain('data-id="a&amp;b"');
  });

  it('safe IDs pass through unchanged', () => {
    const ann = makeAnnotation({ id: 'ann-123-abc' });
    const svg = renderAnnotationMarker(ann, { x: 10, y: 20 });
    expect(svg).toContain('data-id="ann-123-abc"');
  });
});
