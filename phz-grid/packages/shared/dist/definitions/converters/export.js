/**
 * Export/Import definitions as JSON with envelope and validation.
 */
import { validateDefinition } from '../validation/validate.js';
import { migrateDefinition } from '../migration/migrate.js';
export function exportDefinition(def) {
    const envelope = {
        format: 'phz-grid-definition',
        version: def.schemaVersion,
        exportedAt: new Date().toISOString(),
        definition: def,
    };
    return JSON.stringify(envelope, null, 2);
}
export function importDefinition(json, options) {
    const parsed = JSON.parse(json);
    let def;
    if (parsed.format === 'phz-grid-definition' && parsed.definition) {
        def = parsed.definition;
    }
    else {
        def = parsed;
    }
    if (!options?.skipMigration) {
        def = migrateDefinition(def);
    }
    if (!options?.skipValidation) {
        const result = validateDefinition(def);
        if (!result.valid) {
            throw new Error(`Invalid definition: ${result.errors.map(e => e.message).join(', ')}`);
        }
    }
    return def;
}
//# sourceMappingURL=export.js.map