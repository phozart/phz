/**
 * Export/Import definitions as JSON with envelope and validation.
 */

import type { GridDefinition } from '../types/grid-definition.js';
import { validateDefinition } from '../validation/validate.js';
import { migrateDefinition } from '../migration/migrate.js';

export interface DefinitionEnvelope {
  format: 'phz-grid-definition';
  version: string;
  exportedAt: string;
  definition: GridDefinition;
}

export function exportDefinition(def: GridDefinition): string {
  const envelope: DefinitionEnvelope = {
    format: 'phz-grid-definition',
    version: def.schemaVersion,
    exportedAt: new Date().toISOString(),
    definition: def,
  };
  return JSON.stringify(envelope, null, 2);
}

export interface ImportOptions {
  skipValidation?: boolean;
  skipMigration?: boolean;
}

export function importDefinition(json: string, options?: ImportOptions): GridDefinition {
  const parsed = JSON.parse(json);

  let def: GridDefinition;
  if (parsed.format === 'phz-grid-definition' && parsed.definition) {
    def = parsed.definition;
  } else {
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
