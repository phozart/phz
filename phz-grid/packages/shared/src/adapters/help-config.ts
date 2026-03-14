/**
 * @phozart/shared — HelpConfig
 *
 * Contextual help configuration. Consumers provide HelpEntry records
 * keyed by feature or component ID. The shell renders help tooltips,
 * links, and guided tours based on this configuration.
 */

// ========================================================================
// HelpEntry — a single contextual help item
// ========================================================================

export interface HelpEntry {
  /** Unique key identifying the feature or component (e.g. 'filter-bar', 'column-chooser'). */
  key: string;

  /** Short title displayed in the help tooltip. */
  title: string;

  /** Longer description or explanation. Supports plain text. */
  body: string;

  /** Optional external documentation URL. */
  docUrl?: string;

  /** Optional video tutorial URL. */
  videoUrl?: string;

  /** Tags for grouping and searching help entries. */
  tags?: string[];
}

// ========================================================================
// HelpConfig — complete help configuration
// ========================================================================

export interface HelpConfig {
  /** Map of feature key to help entry. */
  entries: Record<string, HelpEntry>;

  /** Optional base URL prefix for relative docUrl values. */
  docBaseUrl?: string;

  /** Whether to show in-line help indicators by default. */
  showInlineHelp?: boolean;

  /** Locale code for help content (e.g. 'en', 'fr', 'de'). */
  locale?: string;
}
