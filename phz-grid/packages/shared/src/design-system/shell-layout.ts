/**
 * Shell Layout Constants
 *
 * Canonical layout dimensions and z-index values for the workspace shell.
 * These constants are used by all shell implementations (workspace, viewer, editor)
 * to ensure consistent positioning.
 */

// ========================================================================
// Shell Layout
// ========================================================================

export const SHELL_LAYOUT = {
  /** Header bar height in pixels */
  headerHeight: 56,
  /** Sidebar width in pixels (full/expanded mode) */
  sidebarWidth: 240,
  /** Maximum content area width in pixels */
  contentMaxWidth: 1440,
  /** Z-index for the header */
  headerZ: 50,
} as const;

export type ShellLayoutKey = keyof typeof SHELL_LAYOUT;

// ========================================================================
// Shell Regions
// ========================================================================

/** Identifiers for the major regions of the shell layout. */
export type ShellRegion = 'header' | 'sidebar' | 'content' | 'footer' | 'overlay';

export interface ShellRegionConfig {
  region: ShellRegion;
  visible: boolean;
  collapsible: boolean;
}

/**
 * Get the default region configuration for the workspace shell.
 * All regions are visible by default; sidebar and footer are collapsible.
 */
export function getDefaultShellRegions(): ShellRegionConfig[] {
  return [
    { region: 'header', visible: true, collapsible: false },
    { region: 'sidebar', visible: true, collapsible: true },
    { region: 'content', visible: true, collapsible: false },
    { region: 'footer', visible: true, collapsible: true },
    { region: 'overlay', visible: false, collapsible: false },
  ];
}

// ========================================================================
// Explorer Layout Constants
// ========================================================================

export const EXPLORER_LAYOUT = {
  /** Width of the field palette panel in pixels */
  fieldPaletteWidth: 260,
  /** Width of the configuration panel in pixels */
  configPanelWidth: 360,
  /** Width of the widget palette panel in pixels */
  widgetPaletteWidth: 260,
} as const;

// ========================================================================
// SQL Preview Theme
// ========================================================================

export const SQL_PREVIEW_THEME = {
  background: '#1C1917',
  textColor: '#E7E5E4',
  keywordColor: '#3B82F6',
  stringColor: '#10B981',
  commentColor: '#78716C',
  lineNumberColor: '#57534E',
} as const;
