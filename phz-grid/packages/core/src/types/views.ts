/**
 * @phozart/phz-core — Saved Views Types
 */

import type { SerializedGridState } from './state.js';
import type { GridPresentation } from './grid-presentation.js';

export interface SavedView {
  id: string;
  name: string;
  state: SerializedGridState;
  presentation?: GridPresentation;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ViewsState {
  views: Map<string, SavedView>;
  activeViewId: string | null;
  defaultViewId: string | null;
}

export interface ViewsSummary {
  id: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  updatedAt: string;
}

export interface SaveViewOptions {
  makeDefault?: boolean;
  presentation?: GridPresentation;
}
