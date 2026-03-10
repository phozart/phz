import { describe, it, expect } from 'vitest';
import { migrateDefinition } from '../definitions/migration/migrate.js';
import { CURRENT_SCHEMA_VERSION } from '../definitions/migration/versions.js';
import type { GridDefinition } from '../definitions/types/grid-definition.js';
import { createDefinitionId } from '../definitions/types/identity.js';

function makeDefinition(version?: string): GridDefinition {
  return {
    id: createDefinitionId('mig-test'),
    name: 'Migration Test',
    schemaVersion: version ?? '1.0.0',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    dataSource: { type: 'local', data: [] },
    columns: [],
  };
}

describe('migrateDefinition', () => {
  it('returns current version for up-to-date definition', () => {
    const def = makeDefinition(CURRENT_SCHEMA_VERSION);
    const migrated = migrateDefinition(def);
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('sets version when missing', () => {
    const def = makeDefinition();
    (def as any).schemaVersion = undefined;
    const migrated = migrateDefinition(def);
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('preserves data through migration', () => {
    const def = makeDefinition();
    def.columns = [{ field: 'x' }];
    const migrated = migrateDefinition(def);
    expect(migrated.columns).toEqual([{ field: 'x' }]);
    expect(migrated.name).toBe('Migration Test');
  });
});
