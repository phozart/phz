/**
 * @phozart/phz-shared — PersonalView (A-1.04)
 *
 * User personal views that override specific presentation settings
 * on top of admin-defined defaults.
 *
 * Extracted from workspace/navigation/default-presentation.ts.
 */

import type { DefaultPresentation } from './default-presentation.js';
import { mergePresentation } from './default-presentation.js';

// ========================================================================
// PersonalView
// ========================================================================

export interface PersonalView {
  id: string;
  userId: string;
  artifactId: string;
  presentation: Partial<DefaultPresentation>;
  filterValues: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

let counter = 0;
function generateId(): string {
  return `pv_${Date.now()}_${++counter}`;
}

export function createPersonalView(input: {
  userId: string;
  artifactId: string;
  presentation: Partial<DefaultPresentation>;
  filterValues?: Record<string, unknown>;
}): PersonalView {
  const now = Date.now();
  return {
    id: generateId(),
    userId: input.userId,
    artifactId: input.artifactId,
    presentation: { ...input.presentation },
    filterValues: input.filterValues ? { ...input.filterValues } : {},
    createdAt: now,
    updatedAt: now,
  };
}

// ========================================================================
// Apply personal view over admin defaults
// ========================================================================

export function applyPersonalView(
  adminDefaults: DefaultPresentation,
  personalView: PersonalView | undefined,
): { presentation: DefaultPresentation; filterValues: Record<string, unknown> } {
  if (!personalView) {
    return { presentation: adminDefaults, filterValues: {} };
  }

  return {
    presentation: mergePresentation(adminDefaults, personalView.presentation),
    filterValues: { ...personalView.filterValues },
  };
}
