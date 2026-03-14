/**
 * @phozart/widgets -- Drill Link Pure Logic Tests
 *
 * Tests for PhzDrillLink default properties.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('lit', () => ({
  LitElement: class {},
  html: () => '',
  css: () => '',
}));
vi.mock('lit/decorators.js', () => ({
  customElement: () => (c: any) => c,
  property: () => () => {},
  state: () => () => {},
}));
vi.mock('@phozart/engine', () => ({}));

import { PhzDrillLink } from '../components/phz-drill-link.js';

describe('PhzDrillLink — default properties', () => {
  it('has correct defaults', () => {
    const link = new PhzDrillLink();
    expect(link.label).toBe('View Details');
    expect(link.targetReportId).toBe('');
    expect(link.filters).toBeUndefined();
    expect(link.openIn).toBe('panel');
  });
});
