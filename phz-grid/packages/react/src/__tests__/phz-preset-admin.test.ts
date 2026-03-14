/**
 * @phozart/react — PhzPresetAdmin Component Tests
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
  PhzPresetAdmin: class PhzPresetAdmin {},
}));

import { PhzPresetAdmin, type PhzPresetAdminProps } from '../phz-preset-admin.js';

// ─── Component Existence Tests ──────────────────────────────

describe('PhzPresetAdmin Component', () => {
  it('is defined and not null', () => {
    expect(PhzPresetAdmin).toBeDefined();
    expect(PhzPresetAdmin).not.toBeNull();
  });

  it('is a function (React component)', () => {
    expect(typeof PhzPresetAdmin).toBe('function');
  });

  it('has name containing PhzPresetAdmin', () => {
    expect(PhzPresetAdmin.name).toContain('PhzPresetAdmin');
  });

  it('is a plain function (no forwardRef)', () => {
    expect((PhzPresetAdmin as any).$$typeof).toBeUndefined();
  });
});

// ─── Props Interface Tests ──────────────────────────────────

describe('PhzPresetAdminProps', () => {
  it('accepts preset props', () => {
    const props: PhzPresetAdminProps = {
      sharedPresets: [{ id: 'sp1', name: 'Default' }],
      userPresets: [{ id: 'up1', name: 'My Preset' }],
    };
    expect(props.sharedPresets).toHaveLength(1);
    expect(props.userPresets).toHaveLength(1);
  });

  it('accepts mode prop with valid values', () => {
    const modes: PhzPresetAdminProps['mode'][] = ['cross-filter', 'per-filter'];
    modes.forEach((mode) => {
      const props: PhzPresetAdminProps = { mode };
      expect(props.mode).toBe(mode);
    });
  });

  it('accepts per-filter mode data', () => {
    const props: PhzPresetAdminProps = {
      mode: 'per-filter',
      definitions: [{ id: 'region', label: 'Region' }],
      filterPresets: [{ id: 'fp1', name: 'Default' }],
      dataSources: [{ id: 'ds1', name: 'Sales' }],
      data: [{ region: 'EMEA' }],
    };
    expect(props.definitions).toHaveLength(1);
    expect(props.filterPresets).toHaveLength(1);
  });

  it('accepts cross-filter event handlers', () => {
    const handlers = {
      onPresetCreate: vi.fn(),
      onPresetUpdate: vi.fn(),
      onPresetDelete: vi.fn(),
    };
    const props: PhzPresetAdminProps = { ...handlers };
    expect(props.onPresetCreate).toBe(handlers.onPresetCreate);
    expect(props.onPresetUpdate).toBe(handlers.onPresetUpdate);
    expect(props.onPresetDelete).toBe(handlers.onPresetDelete);
  });

  it('accepts per-filter event handlers', () => {
    const handlers = {
      onFilterPresetCreate: vi.fn(),
      onFilterPresetUpdate: vi.fn(),
      onFilterPresetDelete: vi.fn(),
      onFilterPresetCopy: vi.fn(),
      onFilterPresetContextMenu: vi.fn(),
    };
    const props: PhzPresetAdminProps = { ...handlers };
    expect(props.onFilterPresetCreate).toBe(handlers.onFilterPresetCreate);
    expect(props.onFilterPresetUpdate).toBe(handlers.onFilterPresetUpdate);
    expect(props.onFilterPresetDelete).toBe(handlers.onFilterPresetDelete);
    expect(props.onFilterPresetCopy).toBe(handlers.onFilterPresetCopy);
    expect(props.onFilterPresetContextMenu).toBe(handlers.onFilterPresetContextMenu);
  });

  it('accepts styling props', () => {
    const props: PhzPresetAdminProps = {
      className: 'preset-panel',
      style: { maxHeight: '500px' },
    };
    expect(props.className).toBe('preset-panel');
    expect(props.style).toEqual({ maxHeight: '500px' });
  });
});

// ─── Component Invocation ───────────────────────────────────

describe('PhzPresetAdmin invocation', () => {
  it('can be called with props', () => {
    const props: PhzPresetAdminProps = {
      sharedPresets: [],
      mode: 'cross-filter',
    };
    expect(() => PhzPresetAdmin(props)).not.toThrow();
  });
});
