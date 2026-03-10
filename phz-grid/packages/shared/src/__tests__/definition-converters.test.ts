import { describe, it, expect } from 'vitest';
import { definitionToGridConfig } from '../definitions/converters/to-grid-config.js';
import { gridConfigToDefinition } from '../definitions/converters/from-grid-config.js';
import { exportDefinition, importDefinition } from '../definitions/converters/export.js';
import type { GridDefinition } from '../definitions/types/grid-definition.js';
import { createDefinitionId } from '../definitions/types/identity.js';

function makeDefinition(): GridDefinition {
  return {
    id: createDefinitionId('conv-test'),
    name: 'Converter Test',
    schemaVersion: '1.0.0',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    dataSource: { type: 'local', data: [{ name: 'Alice', age: 30 }] },
    columns: [
      { field: 'name', header: 'Name', type: 'string', sortable: true },
      { field: 'age', header: 'Age', type: 'number', filterable: true },
    ],
    defaults: { sort: { field: 'name', direction: 'asc' } },
    behavior: { selectionMode: 'multi', editMode: 'dblclick' },
  };
}

describe('definitionToGridConfig', () => {
  it('converts definition to grid config', () => {
    const def = makeDefinition();
    const config = definitionToGridConfig(def);
    expect(config.data).toEqual(def.dataSource.type === 'local' ? def.dataSource.data : []);
    expect(config.columns).toHaveLength(2);
    expect(config.columns![0].field).toBe('name');
    expect(config.initialState?.sort?.columns?.[0]?.field).toBe('name');
    expect(config.initialState?.sort?.columns?.[0]?.direction).toBe('asc');
  });

  it('maps behavior to config flags', () => {
    const def = makeDefinition();
    const config = definitionToGridConfig(def);
    expect(config.enableSelection).toBe(true);
    expect(config.enableEditing).toBe(true);
  });

  it('handles empty data for non-local sources', () => {
    const def = makeDefinition();
    def.dataSource = { type: 'url', url: 'https://api.example.com/data' };
    const config = definitionToGridConfig(def);
    expect(config.data).toEqual([]);
  });
});

describe('gridConfigToDefinition', () => {
  it('captures config as definition', () => {
    const config = {
      data: [{ x: 1 }],
      columns: [{ field: 'x', header: 'X', type: 'number' as const }],
      initialState: { sort: { columns: [{ field: 'x', direction: 'asc' as const }] } },
      enableSelection: true,
    };
    const def = gridConfigToDefinition(config, { name: 'My Grid' });
    expect(def.name).toBe('My Grid');
    expect(def.dataSource.type).toBe('local');
    expect(def.columns).toHaveLength(1);
    expect(def.defaults?.sort?.field).toBe('x');
    expect(def.schemaVersion).toBe('1.0.0');
  });

  it('generates unique ids', () => {
    const config = { data: [], columns: [] };
    const def1 = gridConfigToDefinition(config, { name: 'A' });
    const def2 = gridConfigToDefinition(config, { name: 'B' });
    expect(def1.id).not.toBe(def2.id);
  });
});

describe('exportDefinition / importDefinition', () => {
  it('round-trips a definition', () => {
    const def = makeDefinition();
    const json = exportDefinition(def);
    const parsed = JSON.parse(json);
    expect(parsed.format).toBe('phz-grid-definition');
    expect(parsed.version).toBe('1.0.0');

    const imported = importDefinition(json);
    expect(imported.id).toBe(def.id);
    expect(imported.name).toBe(def.name);
    expect(imported.columns).toHaveLength(2);
  });

  it('imports raw definition without envelope', () => {
    const def = makeDefinition();
    const json = JSON.stringify(def);
    const imported = importDefinition(json);
    expect(imported.name).toBe('Converter Test');
  });

  it('throws on invalid definition', () => {
    const invalid = JSON.stringify({ name: 'Missing required fields' });
    expect(() => importDefinition(invalid)).toThrow('Invalid definition');
  });
});
