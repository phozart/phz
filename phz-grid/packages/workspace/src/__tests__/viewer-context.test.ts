import { describe, it, expect } from 'vitest';
import type { ViewerContext } from '../types.js';

describe('ViewerContext', () => {
  it('accepts a fully populated context', () => {
    const ctx: ViewerContext = {
      userId: 'user-123',
      roles: ['admin', 'editor'],
      attributes: { department: 'engineering', tier: 'enterprise' },
    };
    expect(ctx.userId).toBe('user-123');
    expect(ctx.roles).toContain('admin');
    expect(ctx.attributes?.department).toBe('engineering');
  });

  it('accepts an empty context (all fields optional)', () => {
    const ctx: ViewerContext = {};
    expect(ctx.userId).toBeUndefined();
    expect(ctx.roles).toBeUndefined();
    expect(ctx.attributes).toBeUndefined();
  });

  it('accepts partial context — userId only', () => {
    const ctx: ViewerContext = { userId: 'anon-456' };
    expect(ctx.userId).toBe('anon-456');
    expect(ctx.roles).toBeUndefined();
  });

  it('accepts partial context — roles only', () => {
    const ctx: ViewerContext = { roles: ['viewer'] };
    expect(ctx.roles).toEqual(['viewer']);
    expect(ctx.userId).toBeUndefined();
  });

  it('attributes can hold any value types', () => {
    const ctx: ViewerContext = {
      attributes: {
        stringVal: 'hello',
        numVal: 42,
        boolVal: true,
        nested: { key: 'value' },
        arrayVal: [1, 2, 3],
        nullVal: null,
      },
    };
    expect(ctx.attributes?.stringVal).toBe('hello');
    expect(ctx.attributes?.numVal).toBe(42);
    expect(ctx.attributes?.nested).toEqual({ key: 'value' });
  });

  it('can be used as undefined in optional positions', () => {
    const options: { viewerContext?: ViewerContext } = {};
    expect(options.viewerContext).toBeUndefined();

    options.viewerContext = { userId: 'u1' };
    expect(options.viewerContext.userId).toBe('u1');
  });

  it('passes through correctly when spread', () => {
    const base: ViewerContext = { userId: 'base', roles: ['viewer'] };
    const override: Partial<ViewerContext> = { roles: ['admin'] };
    const merged: ViewerContext = { ...base, ...override };

    expect(merged.userId).toBe('base');
    expect(merged.roles).toEqual(['admin']);
  });
});
