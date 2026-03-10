/**
 * @phozart/phz-workspace — Versioned Config Schema
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
export declare function registerMigration(type: string, fromVersion: number, toVersion: number, migrate: MigrationFn): void;
export declare function createVersionedConfig<T>(type: string, data: T): VersionedConfig<T>;
export declare function migrateConfig<T = unknown>(config: VersionedConfig<T>, type: string): VersionedConfig<T>;
//# sourceMappingURL=versioned-config.d.ts.map