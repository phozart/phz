import { describe, it, expect } from 'vitest';
import { migrateConfig, registerMigration, createVersionedConfig } from '../schema/versioned-config.js';

describe('VersionedConfig', () => {
  it('creates a versioned config with schema and version', () => {
    const config = createVersionedConfig('dashboard', { name: 'Test' });
    expect(config.$schema).toBe('phz-workspace');
    expect(config.$version).toBe(1);
    expect(config.data.name).toBe('Test');
  });

  it('returns config unchanged when already at latest version', () => {
    const config = { $schema: 'phz-workspace' as const, $version: 1, type: 'dashboard' as const, data: { name: 'Test' } };
    const migrated = migrateConfig(config, 'dashboard');
    expect(migrated).toEqual(config);
  });

  it('applies migration chain in version order', () => {
    registerMigration('test-type', 1, 2, (data) => ({ ...data, newField: 'added' }));
    registerMigration('test-type', 2, 3, (data) => ({ ...data, upgraded: true }));

    const config = { $schema: 'phz-workspace' as const, $version: 1, type: 'test-type' as const, data: { name: 'Old' } };
    const migrated = migrateConfig(config, 'test-type');
    expect(migrated.$version).toBe(3);
    expect(migrated.data).toEqual({ name: 'Old', newField: 'added', upgraded: true });
  });

  it('migrations are pure functions — do not mutate input', () => {
    registerMigration('pure-test', 1, 2, (data) => ({ ...data, extra: true }));
    const original = { $schema: 'phz-workspace' as const, $version: 1, type: 'pure-test' as const, data: { name: 'Original' } };
    const migrated = migrateConfig(original, 'pure-test');
    expect(original.data).toEqual({ name: 'Original' });
    expect(migrated.data).toEqual({ name: 'Original', extra: true });
  });

  it('skips migrations for unrelated types', () => {
    registerMigration('type-a', 1, 2, (data) => ({ ...data, a: true }));
    const config = { $schema: 'phz-workspace' as const, $version: 1, type: 'type-b' as const, data: { name: 'B' } };
    const migrated = migrateConfig(config, 'type-b');
    expect(migrated.data).toEqual({ name: 'B' });
  });
});
