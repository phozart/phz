/**
 * @phozart/shared — UsageAnalyticsAdapter SPI
 *
 * Telemetry contract for capturing user interactions. The shell emits
 * events through this adapter; consumer applications route them to
 * their analytics backend (Mixpanel, Amplitude, custom, etc.).
 *
 * All 26 event types from the v15 spec (section 16.4).
 */

// ========================================================================
// UsageEventType — exhaustive union of all tracked event types
// ========================================================================

export type UsageEventType =
  | 'page-view'
  | 'artifact-open'
  | 'artifact-create'
  | 'artifact-save'
  | 'artifact-delete'
  | 'artifact-share'
  | 'artifact-publish'
  | 'filter-apply'
  | 'filter-reset'
  | 'filter-preset-select'
  | 'sort-change'
  | 'column-resize'
  | 'column-reorder'
  | 'column-toggle'
  | 'export-start'
  | 'export-complete'
  | 'drill-through'
  | 'cross-filter'
  | 'widget-interact'
  | 'search-execute'
  | 'alert-triggered'
  | 'alert-acknowledged'
  | 'subscription-create'
  | 'subscription-cancel'
  | 'session-start'
  | 'session-end';

// ========================================================================
// UsageEvent — a single telemetry event
// ========================================================================

export interface UsageEvent {
  /** Event type identifier. */
  type: UsageEventType;

  /** ISO 8601 timestamp of when the event occurred. */
  timestamp: string;

  /** User ID of the actor (may be anonymized). */
  userId?: string;

  /** Session identifier for correlating events. */
  sessionId?: string;

  /** Artifact ID related to the event, if applicable. */
  artifactId?: string;

  /** Artifact type related to the event, if applicable. */
  artifactType?: string;

  /** Additional event-specific properties. */
  properties?: Record<string, unknown>;
}

// ========================================================================
// UsageAnalyticsAdapter interface
// ========================================================================

/**
 * Telemetry SPI. Consumer applications implement this to capture
 * usage analytics. The shell calls track() for each user interaction.
 * Implementations should be non-blocking and failure-tolerant.
 */
export interface UsageAnalyticsAdapter {
  /**
   * Track a single usage event.
   * Implementations should not throw on failure; events may be dropped.
   */
  track(event: UsageEvent): void;

  /**
   * Track a batch of events (optional optimization).
   * Falls back to calling track() for each event if not implemented.
   */
  trackBatch?(events: UsageEvent[]): void;

  /**
   * Flush any buffered events to the backend.
   * Called on session end and page unload.
   */
  flush?(): Promise<void>;

  /**
   * Identify the current user for enrichment purposes.
   */
  identify?(userId: string, traits?: Record<string, unknown>): void;
}
