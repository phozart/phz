import { describe, it, expect } from 'vitest';
import { createPlacement, placementId } from '../placement.js';

describe('PlacementRecord', () => {
  it('creates a placement with required fields', () => {
    const p = createPlacement({
      artifactType: 'report',
      artifactId: 'report-1',
      target: 'dashboard-main',
    });
    expect(p.id).toBeTruthy();
    expect(p.artifactType).toBe('report');
    expect(p.artifactId).toBe('report-1');
    expect(p.target).toBe('dashboard-main');
    expect(p.createdAt).toBeGreaterThan(0);
  });

  it('creates branded PlacementId', () => {
    const id = placementId('test-123');
    expect(id).toBe('test-123');
  });

  it('accepts optional config', () => {
    const p = createPlacement({
      artifactType: 'dashboard',
      artifactId: 'dash-1',
      target: 'page-home',
      config: { position: { row: 0, col: 0 }, size: { colSpan: 6 } },
    });
    expect(p.config).toEqual({ position: { row: 0, col: 0 }, size: { colSpan: 6 } });
  });
});
