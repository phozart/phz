/**
 * @phozart/react — PhzFilterConfigurator Component Tests
 *
 * Structural validation: exports, component shape, prop interface.
 */
import { describe, it, expect, vi } from 'vitest';

// Mock React
vi.mock('react', () => ({
  default: {
    createElement: vi.fn((..._args: unknown[]) => null),
  },
  createElement: vi.fn((..._args: unknown[]) => null),
}));

// Mock @lit/react
vi.mock('@lit/react', () => ({
  createComponent: ({ elementClass, events }: any) => {
    const component = vi.fn((..._args: unknown[]) => null);
    (component as any).__litElementClass = elementClass;
    (component as any).__litEvents = events;
    return component;
  },
  EventName: {},
}));

vi.mock('@phozart/criteria', () => ({
  PhzFilterConfigurator: class PhzFilterConfigurator {},
}));

import { PhzFilterConfigurator, type PhzFilterConfiguratorProps } from '../phz-filter-configurator.js';

// ─── Component Existence Tests ──────────────────────────────

describe('PhzFilterConfigurator Component', () => {
  it('is defined and not null', () => {
    expect(PhzFilterConfigurator).toBeDefined();
    expect(PhzFilterConfigurator).not.toBeNull();
  });

  it('is a function (React component)', () => {
    expect(typeof PhzFilterConfigurator).toBe('function');
  });

  it('has name containing PhzFilterConfigurator', () => {
    expect(PhzFilterConfigurator.name).toContain('PhzFilterConfigurator');
  });

  it('is a plain function (no forwardRef)', () => {
    // PhzFilterConfigurator has no imperative API so no forwardRef
    expect((PhzFilterConfigurator as any).$$typeof).toBeUndefined();
  });
});

// ─── Props Interface Tests ──────────────────────────────────

describe('PhzFilterConfiguratorProps', () => {
  it('accepts definitions as required prop', () => {
    const props: PhzFilterConfiguratorProps = {
      definitions: [{ id: 'region', label: 'Region', type: 'single_select' }],
    };
    expect(props.definitions).toHaveLength(1);
  });

  it('accepts optional binding props', () => {
    const props: PhzFilterConfiguratorProps = {
      definitions: [],
      bindings: [{ id: 'b1', definitionId: 'region', column: 'region' }],
      artefactId: 'report:r1',
      artefactName: 'Sales Report',
      availableColumns: ['region', 'status', 'revenue'],
    };
    expect(props.bindings).toHaveLength(1);
    expect(props.artefactId).toBe('report:r1');
    expect(props.availableColumns).toHaveLength(3);
  });

  it('accepts event handler props', () => {
    const handlers = {
      onBindingAdd: vi.fn(),
      onBindingRemove: vi.fn(),
      onBindingUpdate: vi.fn(),
      onBindingReorder: vi.fn(),
      onOpenDesigner: vi.fn(),
    };
    const props: PhzFilterConfiguratorProps = { definitions: [], ...handlers };
    expect(props.onBindingAdd).toBe(handlers.onBindingAdd);
    expect(props.onBindingRemove).toBe(handlers.onBindingRemove);
    expect(props.onBindingUpdate).toBe(handlers.onBindingUpdate);
    expect(props.onBindingReorder).toBe(handlers.onBindingReorder);
    expect(props.onOpenDesigner).toBe(handlers.onOpenDesigner);
  });

  it('accepts styling props', () => {
    const props: PhzFilterConfiguratorProps = {
      definitions: [],
      className: 'configurator',
      style: { width: '400px' },
    };
    expect(props.className).toBe('configurator');
    expect(props.style).toEqual({ width: '400px' });
  });
});

// ─── Component Invocation ───────────────────────────────────

describe('PhzFilterConfigurator invocation', () => {
  it('can be called with props', () => {
    const props: PhzFilterConfiguratorProps = { definitions: [] };
    expect(() => PhzFilterConfigurator(props)).not.toThrow();
  });
});
