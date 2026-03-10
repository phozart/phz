/**
 * GridDefinition — root type assembling all definition sections.
 */

import type { DefinitionIdentity } from './identity.js';
import type { DefinitionDataSource } from './data-source.js';
import type { DefinitionColumnSpec } from './column.js';
import type { DefinitionDefaults } from './defaults.js';
import type { DefinitionFormatting } from './formatting.js';
import type { DefinitionBehavior } from './behavior.js';
import type { ViewCollection } from './views.js';
import type { DefinitionAccess } from './access.js';

export interface GridDefinition extends DefinitionIdentity {
  dataSource: DefinitionDataSource;
  columns: DefinitionColumnSpec[];
  defaults?: DefinitionDefaults;
  formatting?: DefinitionFormatting;
  behavior?: DefinitionBehavior;
  views?: ViewCollection;
  access?: DefinitionAccess;
  metadata?: Record<string, unknown>;
}

export interface DefinitionMeta {
  id: string;
  name: string;
  description?: string;
  updatedAt: string;
}
