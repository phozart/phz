/**
 * Schema migration — upgrade definitions from old versions to current.
 */

import type { GridDefinition } from '../types/grid-definition.js';
import { CURRENT_SCHEMA_VERSION } from './versions.js';

type Migrator = (def: GridDefinition) => GridDefinition;

const MIGRATIONS: Record<string, Migrator> = {
  // Future migrations: '0.9.0': (def) => { ... return upgraded; }
};

export function migrateDefinition(def: GridDefinition): GridDefinition {
  let current = { ...def };

  if (!current.schemaVersion) {
    current.schemaVersion = CURRENT_SCHEMA_VERSION;
  }

  // Apply migrations in version order
  const versions = Object.keys(MIGRATIONS).sort();
  for (const version of versions) {
    if (current.schemaVersion < version) {
      current = MIGRATIONS[version](current);
      current.schemaVersion = version;
    }
  }

  current.schemaVersion = CURRENT_SCHEMA_VERSION;
  return current;
}
