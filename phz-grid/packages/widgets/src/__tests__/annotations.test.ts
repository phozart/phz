import { describe, it, expect } from 'vitest';

import {
  createAnnotationManager,
  renderAnnotationMarker,
  type Annotation,
  type MarkerStyle,
} from '../annotations.js';

describe('AnnotationManager', () => {
  function makeAnnotation(overrides: Partial<Annotation> = {}): Annotation {
    return {
      id: 'ann-1',
      chartId: 'chart-revenue',
      dataPoint: { x: 100, y: 50 },
      text: 'Revenue spike',
      timestamp: new Date('2026-03-01T10:00:00Z'),
      style: 'pin',
      ...overrides,
    };
  }

  it('adds an annotation', () => {
    const mgr = createAnnotationManager();
    mgr.add(makeAnnotation());
    expect(mgr.getForChart('chart-revenue')).toHaveLength(1);
  });

  it('removes an annotation by id', () => {
    const mgr = createAnnotationManager();
    mgr.add(makeAnnotation({ id: 'a1' }));
    mgr.add(makeAnnotation({ id: 'a2' }));
    mgr.remove('a1');
    expect(mgr.getForChart('chart-revenue')).toHaveLength(1);
    expect(mgr.getForChart('chart-revenue')[0].id).toBe('a2');
  });

  it('updates an annotation', () => {
    const mgr = createAnnotationManager();
    mgr.add(makeAnnotation({ id: 'a1', text: 'Original' }));
    mgr.update('a1', { text: 'Updated' });
    expect(mgr.getForChart('chart-revenue')[0].text).toBe('Updated');
  });

  it('returns only annotations for the specified chart', () => {
    const mgr = createAnnotationManager();
    mgr.add(makeAnnotation({ id: 'a1', chartId: 'chart-a' }));
    mgr.add(makeAnnotation({ id: 'a2', chartId: 'chart-b' }));
    mgr.add(makeAnnotation({ id: 'a3', chartId: 'chart-a' }));
    expect(mgr.getForChart('chart-a')).toHaveLength(2);
    expect(mgr.getForChart('chart-b')).toHaveLength(1);
  });

  it('returns empty array for unknown chart', () => {
    const mgr = createAnnotationManager();
    expect(mgr.getForChart('nonexistent')).toEqual([]);
  });

  it('serializes and deserializes annotations', () => {
    const mgr = createAnnotationManager();
    mgr.add(makeAnnotation({ id: 'a1' }));
    mgr.add(makeAnnotation({ id: 'a2', chartId: 'chart-cost', text: 'Cost note' }));

    const serialized = mgr.serialize();
    expect(typeof serialized).toBe('string');

    const mgr2 = createAnnotationManager();
    mgr2.deserialize(serialized);
    expect(mgr2.getForChart('chart-revenue')).toHaveLength(1);
    expect(mgr2.getForChart('chart-cost')).toHaveLength(1);
    expect(mgr2.getForChart('chart-cost')[0].text).toBe('Cost note');
  });

  it('preserves annotation dates through serialization', () => {
    const mgr = createAnnotationManager();
    const ts = new Date('2026-03-01T10:00:00Z');
    mgr.add(makeAnnotation({ id: 'a1', timestamp: ts }));

    const serialized = mgr.serialize();
    const mgr2 = createAnnotationManager();
    mgr2.deserialize(serialized);
    expect(mgr2.getForChart('chart-revenue')[0].timestamp).toEqual(ts);
  });

  it('update on nonexistent annotation is a no-op', () => {
    const mgr = createAnnotationManager();
    mgr.update('nonexistent', { text: 'nope' });
    expect(mgr.getForChart('anything')).toEqual([]);
  });

  it('remove on nonexistent annotation is a no-op', () => {
    const mgr = createAnnotationManager();
    mgr.add(makeAnnotation({ id: 'a1' }));
    mgr.remove('nonexistent');
    expect(mgr.getForChart('chart-revenue')).toHaveLength(1);
  });
});

describe('renderAnnotationMarker', () => {
  it('returns SVG string for pin style', () => {
    const svg = renderAnnotationMarker(
      { id: 'a1', chartId: 'c1', dataPoint: { x: 100, y: 50 }, text: 'Note', style: 'pin', timestamp: new Date() },
      { x: 100, y: 50 },
    );
    expect(svg).toContain('<g');
    expect(svg).toContain('</g>');
    expect(svg).toContain('Note');
  });

  it('returns SVG string for flag style', () => {
    const svg = renderAnnotationMarker(
      { id: 'a1', chartId: 'c1', dataPoint: { x: 0, y: 0 }, text: 'Flag', style: 'flag', timestamp: new Date() },
      { x: 50, y: 30 },
    );
    expect(svg).toContain('<g');
    expect(svg).toContain('Flag');
  });

  it('returns SVG string for circle style', () => {
    const svg = renderAnnotationMarker(
      { id: 'a1', chartId: 'c1', dataPoint: { x: 0, y: 0 }, text: 'Circle', style: 'circle', timestamp: new Date() },
      { x: 50, y: 30 },
    );
    expect(svg).toContain('<circle');
  });

  it('returns SVG string for highlight style', () => {
    const svg = renderAnnotationMarker(
      { id: 'a1', chartId: 'c1', dataPoint: { x: 0, y: 0 }, text: 'HL', style: 'highlight', timestamp: new Date() },
      { x: 50, y: 30 },
    );
    expect(svg).toContain('<rect');
  });

  it('includes accessible title element', () => {
    const svg = renderAnnotationMarker(
      { id: 'a1', chartId: 'c1', dataPoint: { x: 0, y: 0 }, text: 'Accessible', style: 'pin', timestamp: new Date() },
      { x: 50, y: 30 },
    );
    expect(svg).toContain('<title');
    expect(svg).toContain('Accessible');
  });

  it('defaults to pin style when style is undefined', () => {
    const svg = renderAnnotationMarker(
      { id: 'a1', chartId: 'c1', dataPoint: { x: 0, y: 0 }, text: 'Default', timestamp: new Date() },
      { x: 50, y: 30 },
    );
    expect(svg).toContain('<g');
  });
});
