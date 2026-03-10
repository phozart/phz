/**
 * Validate a GridDefinition using Zod schemas.
 */

import { GridDefinitionSchema } from './schemas.js';

export interface DefinitionValidationError {
  path: string;
  message: string;
}

export interface DefinitionValidationResult {
  valid: boolean;
  errors: DefinitionValidationError[];
}

export function validateDefinition(def: unknown): DefinitionValidationResult {
  const result = GridDefinitionSchema.safeParse(def);

  if (result.success) {
    return { valid: true, errors: [] };
  }

  return {
    valid: false,
    errors: result.error.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  };
}
