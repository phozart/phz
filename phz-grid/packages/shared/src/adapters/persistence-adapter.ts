/**
 * @phozart/phz-shared — PersistenceAdapter SPI
 *
 * Contract for artifact CRUD, filter presets, personal views,
 * personal alerts, and role listing. Consumer applications implement
 * this interface to provide server-side or local persistence.
 *
 * v15 additions: saveLastAppliedFilters, loadLastAppliedFilters,
 * savePersonalAlert, listPersonalAlerts, deletePersonalAlert, listAvailableRoles.
 */

import type { PersonalView } from '../artifacts/personal-view.js';
import type { FieldEnrichment } from '../types/field-enrichment.js';
import type { PersonalAlert } from '../types/personal-alert.js';

// ========================================================================
// ArtifactPayload — generic envelope for saving artifacts
// ========================================================================

export interface ArtifactPayload<T = unknown> {
  id: string;
  type: string;
  name: string;
  description?: string;
  data: T;
  version?: number;
  createdAt?: number;
  updatedAt?: number;
}

// ========================================================================
// SaveResult — outcome of a save operation
// ========================================================================

export interface SaveResult {
  id: string;
  version: number;
  savedAt: number;
  success: boolean;
  error?: string;
}

// ========================================================================
// ArtifactFilter — query parameters for listing artifacts
// ========================================================================

export interface ArtifactFilter {
  type?: string;
  search?: string;
  published?: boolean;
  ownerId?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

// ========================================================================
// ArtifactList — paginated list of artifact summaries
// ========================================================================

export interface ArtifactListItem {
  id: string;
  type: string;
  name: string;
  description?: string;
  version: number;
  createdAt: number;
  updatedAt: number;
  ownerId?: string;
  published?: boolean;
}

export interface ArtifactList {
  items: ArtifactListItem[];
  totalCount: number;
  hasMore: boolean;
}

// ========================================================================
// FilterPreset — saved filter state
// ========================================================================

export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  artifactId: string;
  values: Record<string, unknown>;
  isDefault?: boolean;
  ownerId?: string;
  createdAt: number;
  updatedAt: number;
}

// ========================================================================
// LastAppliedFilters — per-user last-used filter state
// ========================================================================

export interface LastAppliedFilters {
  artifactId: string;
  userId: string;
  values: Record<string, unknown>;
  appliedAt: number;
}

// ========================================================================
// PersistenceAdapter interface
// ========================================================================

/**
 * Artifact persistence SPI. Consumer applications implement this interface
 * to provide CRUD operations for all artifact types (reports, dashboards,
 * grid definitions, filter presets, personal views, etc.).
 */
export interface PersistenceAdapter {
  // ---- Core CRUD ----

  /**
   * Save (create or update) an artifact.
   */
  save(payload: ArtifactPayload): Promise<SaveResult>;

  /**
   * Load an artifact by ID.
   */
  load<T = unknown>(id: string): Promise<ArtifactPayload<T> | null>;

  /**
   * Delete an artifact by ID.
   */
  delete(id: string): Promise<{ success: boolean; error?: string }>;

  /**
   * List artifacts matching the given filter criteria.
   */
  list(filter?: ArtifactFilter): Promise<ArtifactList>;

  // ---- Filter presets ----

  /**
   * Save a filter preset for an artifact.
   */
  saveFilterPreset(preset: FilterPreset): Promise<SaveResult>;

  /**
   * List filter presets for an artifact.
   */
  listFilterPresets(artifactId: string): Promise<FilterPreset[]>;

  /**
   * Delete a filter preset by ID.
   */
  deleteFilterPreset(presetId: string): Promise<{ success: boolean; error?: string }>;

  // ---- Personal views ----

  /**
   * Save a user's personal view for an artifact.
   */
  savePersonalView(view: PersonalView): Promise<SaveResult>;

  /**
   * Load a user's personal view for a given artifact.
   */
  loadPersonalView(userId: string, artifactId: string): Promise<PersonalView | null>;

  /**
   * Delete a personal view.
   */
  deletePersonalView(viewId: string): Promise<{ success: boolean; error?: string }>;

  // ---- Field enrichments ----

  /**
   * Save field enrichments (labels, descriptions, formatting hints)
   * for a given data source.
   */
  saveFieldEnrichments(
    sourceId: string,
    enrichments: FieldEnrichment[],
  ): Promise<SaveResult>;

  /**
   * Load field enrichments for a given data source.
   */
  loadFieldEnrichments(sourceId: string): Promise<FieldEnrichment[]>;

  // ---- v15: Last applied filters ----

  /**
   * Persist the last-applied filter state for a user + artifact pair.
   * Enables "resume where you left off" behavior.
   */
  saveLastAppliedFilters?(filters: LastAppliedFilters): Promise<SaveResult>;

  /**
   * Load the last-applied filter state for a user + artifact.
   */
  loadLastAppliedFilters?(
    userId: string,
    artifactId: string,
  ): Promise<LastAppliedFilters | null>;

  // ---- v15: Personal alerts ----

  /**
   * Save a personal alert configuration for a user.
   */
  savePersonalAlert?(alert: PersonalAlert): Promise<SaveResult>;

  /**
   * List all personal alerts for a user.
   */
  listPersonalAlerts?(userId: string): Promise<PersonalAlert[]>;

  /**
   * Delete a personal alert by ID.
   */
  deletePersonalAlert?(alertId: string): Promise<{ success: boolean; error?: string }>;

  // ---- v15: Role listing ----

  /**
   * List all available roles in the system. Used by the sharing UI
   * and security binding configuration.
   */
  listAvailableRoles?(): Promise<Array<{ id: string; name: string; description?: string }>>;
}
