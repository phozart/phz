import { describe, it, expect } from 'vitest';
import { validateDefinition } from '../definitions/validation/validate.js';
import { createDefinitionId } from '../definitions/types/identity.js';

function makeValidDef() {
  return {
    id: createDefinitionId('val-test'),
    name: 'Valid Grid',
    schemaVersion: '1.0.0',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    dataSource: { type: 'local' as const, data: [] },
    columns: [{ field: 'x' }],
  };
}

describe('validateDefinition', () => {
  it('validates a correct definition', () => {
    const result = validateDefinition(makeValidDef());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects missing name', () => {
    const def = makeValidDef();
    (def as any).name = '';
    const result = validateDefinition(def);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects missing dataSource', () => {
    const def = makeValidDef();
    (def as any).dataSource = undefined;
    const result = validateDefinition(def);
    expect(result.valid).toBe(false);
  });

  it('rejects invalid data source type', () => {
    const def = makeValidDef();
    (def as any).dataSource = { type: 'invalid' };
    const result = validateDefinition(def);
    expect(result.valid).toBe(false);
  });

  it('validates url data source', () => {
    const def = {
      ...makeValidDef(),
      dataSource: { type: 'url' as const, url: 'https://api.example.com' },
    };
    const result = validateDefinition(def);
    expect(result.valid).toBe(true);
  });

  it('validates definition with all optional sections', () => {
    const def = {
      ...makeValidDef(),
      defaults: { sort: { field: 'x', direction: 'asc' } },
      behavior: { density: 'compact', editMode: 'dblclick' },
      access: { visibility: 'public' },
      metadata: { foo: 'bar' },
    };
    const result = validateDefinition(def);
    expect(result.valid).toBe(true);
  });

  it('rejects column with empty field', () => {
    const def = makeValidDef();
    def.columns = [{ field: '' }];
    const result = validateDefinition(def);
    expect(result.valid).toBe(false);
  });

  it('validates completely empty columns array', () => {
    const def = makeValidDef();
    def.columns = [];
    const result = validateDefinition(def);
    expect(result.valid).toBe(true);
  });
});
