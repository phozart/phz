/**
 * @phozart/workspace — Versioned Config Schema
 *
 * All workspace-persisted configs carry $schema and $version.
 * Migrations are pure functions, applied in version order on load.
 */

export interface VersionedConfig<T = unknown> {
  $schema: 'phz-workspace';
  $version: number;
  type: string;
  data: T;
}

export type MigrationFn = (data: Record<string, unknown>) => Record<string, unknown>;

interface Migration {
  fromVersion: number;
  toVersion: number;
  migrate: MigrationFn;
}

const registry = new Map<string, Migration[]>();

export function registerMigration(
  type: string,
  fromVersion: number,
  toVersion: number,
  migrate: MigrationFn,
): void {
  const existing = registry.get(type) ?? [];
  existing.push({ fromVersion, toVersion, migrate });
  existing.sort((a, b) => a.fromVersion - b.fromVersion);
  registry.set(type, existing);
}

export function createVersionedConfig<T>(type: string, data: T): VersionedConfig<T> {
  return {
    $schema: 'phz-workspace',
    $version: 1,
    type,
    data,
  };
}

export function migrateConfig<T = unknown>(
  config: VersionedConfig<T>,
  type: string,
): VersionedConfig<T> {
  const migrations = registry.get(type);
  if (!migrations || migrations.length === 0) {
    return config;
  }

  let currentVersion = config.$version;
  let currentData = { ...(config.data as Record<string, unknown>) };

  for (const m of migrations) {
    if (m.fromVersion === currentVersion) {
      currentData = m.migrate(currentData);
      currentVersion = m.toVersion;
    }
  }

  if (currentVersion === config.$version) {
    return config;
  }

  return {
    ...config,
    $version: currentVersion,
    data: currentData as T,
  };
}
