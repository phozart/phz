/**
 * Shell Layout Constants
 *
 * Canonical layout dimensions and z-index values for the workspace shell.
 * These constants are used by all shell implementations (workspace, viewer, editor)
 * to ensure consistent positioning.
 */
export declare const SHELL_LAYOUT: {
    /** Header bar height in pixels */
    readonly headerHeight: 56;
    /** Sidebar width in pixels (full/expanded mode) */
    readonly sidebarWidth: 240;
    /** Maximum content area width in pixels */
    readonly contentMaxWidth: 1440;
    /** Z-index for the header */
    readonly headerZ: 50;
};
export type ShellLayoutKey = keyof typeof SHELL_LAYOUT;
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
export declare function getDefaultShellRegions(): ShellRegionConfig[];
export declare const EXPLORER_LAYOUT: {
    /** Width of the field palette panel in pixels */
    readonly fieldPaletteWidth: 260;
    /** Width of the configuration panel in pixels */
    readonly configPanelWidth: 360;
    /** Width of the widget palette panel in pixels */
    readonly widgetPaletteWidth: 260;
};
export declare const SQL_PREVIEW_THEME: {
    readonly background: "#1C1917";
    readonly textColor: "#E7E5E4";
    readonly keywordColor: "#3B82F6";
    readonly stringColor: "#10B981";
    readonly commentColor: "#78716C";
    readonly lineNumberColor: "#57534E";
};
//# sourceMappingURL=shell-layout.d.ts.map