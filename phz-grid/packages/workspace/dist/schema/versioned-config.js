/**
 * @phozart/phz-workspace — Versioned Config Schema
 *
 * All workspace-persisted configs carry $schema and $version.
 * Migrations are pure functions, applied in version order on load.
 */
const registry = new Map();
export function registerMigration(type, fromVersion, toVersion, migrate) {
    const existing = registry.get(type) ?? [];
    existing.push({ fromVersion, toVersion, migrate });
    existing.sort((a, b) => a.fromVersion - b.fromVersion);
    registry.set(type, existing);
}
export function createVersionedConfig(type, data) {
    return {
        $schema: 'phz-workspace',
        $version: 1,
        type,
        data,
    };
}
export function migrateConfig(config, type) {
    const migrations = registry.get(type);
    if (!migrations || migrations.length === 0) {
        return config;
    }
    let currentVersion = config.$version;
    let currentData = { ...config.data };
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
        data: currentData,
    };
}
//# sourceMappingURL=versioned-config.js.map