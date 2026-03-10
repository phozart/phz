/**
 * @phozart/phz-widgets -- Annotations Pure Logic Tests
 *
 * Tests for the annotation manager factory and SVG marker rendering.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('lit', () => ({
  LitElement: class {},
  html: () => '',
  svg: () => '',
  css: () => '',
  nothing: Symbol('nothing'),
}));
vi.mock('lit/decorators.js', () => ({
  customElement: () => (c: any) => c,
  property: () => () => {},
  state: () => () => {},
}));

import {
  createAnnotationManager,
  renderAnnotationMarker,
  type Annotation,
  type AnnotationManager,
} from '../annotations.js';

function makeAnnotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    id: 'ann-1',
    chartId: 'chart-1',
    dataPoint: { x: 100, y: 200 },
    text: 'Test annotation',
    ...overrides,
  };
}

describe('createAnnotationManager', () => {
  let manager: AnnotationManager;

  it('starts empty', () => {
    manager = createAnnotationManager();
    expect(manager.getForChart('chart-1')).toEqual([]);
  });

  it('adds an annotation', () => {
    manager = createAnnotationManager();
    manager.add(makeAnnotation());
    expect(manager.getForChart('chart-1')).toHaveLength(1);
    expect(manager.getForChart('chart-1')[0].text).toBe('Test annotation');
  });

  it('removes an annotation', () => {
    manager = createAnnotationManager();
    manager.add(makeAnnotation());
    manager.remove('ann-1');
    expect(manager.getForChart('chart-1')).toHaveLength(0);
  });

  it('updates an annotation', () => {
    manager = createAnnotationManager();
    manager.add(makeAnnotation());
    manager.update('ann-1', { text: 'Updated text' });
    expect(manager.getForChart('chart-1')[0].text).toBe('Updated text');
  });

  it('update preserves the original id', () => {
    manager = createAnnotationManager();
    manager.add(makeAnnotation());
    manager.update('ann-1', { id: 'different-id', text: 'New' } as any);
    expect(manager.getForChart('chart-1')[0].id).toBe('ann-1');
  });

  it('update does nothing for nonexistent id', () => {
    manager = createAnnotationManager();
    manager.add(makeAnnotation());
    manager.update('nonexistent', { text: 'ghost' });
    expect(manager.getForChart('chart-1')).toHaveLength(1);
    expect(manager.getForChart('chart-1')[0].text).toBe('Test annotation');
  });

  it('filters annotations by chartId', () => {
    manager = createAnnotationManager();
    manager.add(makeAnnotation({ id: 'a1', chartId: 'chart-1' }));
    manager.add(makeAnnotation({ id: 'a2', chartId: 'chart-2' }));
    manager.add(makeAnnotation({ id: 'a3', chartId: 'chart-1' }));
    expect(manager.getForChart('chart-1')).toHaveLength(2);
    expect(manager.getForChart('chart-2')).toHaveLength(1);
  });

  it('serializes to JSON', () => {
    manager = createAnnotationManager();
    const ann = makeAnnotation({ timestamp: new Date('2026-03-05T10:00:00Z') });
    manager.add(ann);
    const json = manager.serialize();
    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe('ann-1');
    expect(parsed[0].timestamp).toBe('2026-03-05T10:00:00.000Z');
  });

  it('serializes annotation without timestamp', () => {
    manager = createAnnotationManager();
    manager.add(makeAnnotation());
    const json = manager.serialize();
    const parsed = JSON.parse(json);
    expect(parsed[0].timestamp).toBeUndefined();
  });

  it('deserializes from JSON', () => {
    manager = createAnnotationManager();
    const json = JSON.stringify([
      {
        id: 'ann-2',
        chartId: 'chart-5',
        dataPoint: { x: 50, y: 75 },
        text: 'Deserialized',
        timestamp: '2026-01-15T12:00:00.000Z',
        style: 'flag',
      },
    ]);
    manager.deserialize(json);
    const result = manager.getForChart('chart-5');
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe('Deserialized');
    expect(result[0].timestamp).toEqual(new Date('2026-01-15T12:00:00.000Z'));
    expect(result[0].style).toBe('flag');
  });

  it('deserializes clears existing data', () => {
    manager = createAnnotationManager();
    manager.add(makeAnnotation());
    manager.deserialize('[]');
    expect(manager.getForChart('chart-1')).toHaveLength(0);
  });

  it('deserializes handles missing timestamp', () => {
    manager = createAnnotationManager();
    const json = JSON.stringify([
      { id: 'a1', chartId: 'c1', dataPoint: { x: 0, y: 0 }, text: 'no time' },
    ]);
    manager.deserialize(json);
    const result = manager.getForChart('c1');
    expect(result[0].timestamp).toBeUndefined();
  });
});

describe('renderAnnotationMarker', () => {
  const baseAnnotation = makeAnnotation();
  const position = { x: 100, y: 200 };

  it('renders pin marker by default', () => {
    const svgStr = renderAnnotationMarker(baseAnnotation, position);
    expect(svgStr).toContain('class="phz-annotation"');
    expect(svgStr).toContain('data-id="ann-1"');
    expect(svgStr).toContain('role="img"');
    expect(svgStr).toContain('circle');
    expect(svgStr).toContain('line');
  });

  it('renders pin marker explicitly', () => {
    const ann = makeAnnotation({ style: 'pin' });
    const svgStr = renderAnnotationMarker(ann, position);
    expect(svgStr).toContain('circle');
    expect(svgStr).toContain('line');
    expect(svgStr).toContain('fill="#DC2626"'); // pin color
  });

  it('renders flag marker', () => {
    const ann = makeAnnotation({ style: 'flag' });
    const svgStr = renderAnnotationMarker(ann, position);
    expect(svgStr).toContain('polygon');
    expect(svgStr).toContain('fill="#3B82F6"'); // flag color
  });

  it('renders circle marker', () => {
    const ann = makeAnnotation({ style: 'circle' });
    const svgStr = renderAnnotationMarker(ann, position);
    expect(svgStr).toContain('circle');
    expect(svgStr).toContain('stroke="#8B5CF6"'); // circle color
    expect(svgStr).toContain('stroke-dasharray');
  });

  it('renders highlight marker', () => {
    const ann = makeAnnotation({ style: 'highlight' });
    const svgStr = renderAnnotationMarker(ann, position);
    expect(svgStr).toContain('rect');
    expect(svgStr).toContain('fill="#FBBF24"');
  });

  it('escapes XML special characters in text', () => {
    const ann = makeAnnotation({ text: 'A < B & "C"' });
    const svgStr = renderAnnotationMarker(ann, position);
    expect(svgStr).toContain('&lt;');
    expect(svgStr).toContain('&amp;');
    expect(svgStr).toContain('&quot;');
    expect(svgStr).not.toContain('>C<'); // > should be escaped
  });

  it('includes title element for accessibility', () => {
    const svgStr = renderAnnotationMarker(baseAnnotation, position);
    expect(svgStr).toContain('<title>');
    expect(svgStr).toContain('Test annotation');
  });

  it('includes tabindex for keyboard access', () => {
    const svgStr = renderAnnotationMarker(baseAnnotation, position);
    expect(svgStr).toContain('tabindex="0"');
  });

  it('positions correctly based on coordinates', () => {
    const svgStr = renderAnnotationMarker(baseAnnotation, { x: 50, y: 75 });
    expect(svgStr).toContain('cx="50"');
    expect(svgStr).toContain('cy="75"');
  });
});
