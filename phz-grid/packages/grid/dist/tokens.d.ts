/**
 * @phozart/phz-grid — Phz Console Design Tokens (Three-Layer System)
 *
 * Layer 1: Brand Tokens (primitives — warm neutrals, dual typography, status colors)
 * Layer 2: Semantic Tokens (theme — purpose-based references)
 * Layer 3: Component Tokens (specific — individual component values + density scale)
 */
export declare const BrandTokens: {
    readonly '--phz-color-primary': "#3B82F6";
    readonly '--phz-color-primary-hover': "#2563EB";
    readonly '--phz-color-primary-light': "rgba(59, 130, 246, 0.1)";
    readonly '--phz-color-secondary': "#8B5CF6";
    readonly '--phz-color-success': "#22C55E";
    readonly '--phz-color-warning': "#F59E0B";
    readonly '--phz-color-danger': "#EF4444";
    readonly '--phz-color-info': "#3B82F6";
    readonly '--phz-color-neutral-50': "#FAFAF9";
    readonly '--phz-color-neutral-100': "#F5F5F4";
    readonly '--phz-color-neutral-200': "#E7E5E4";
    readonly '--phz-color-neutral-300': "#D6D3D1";
    readonly '--phz-color-neutral-400': "#A8A29E";
    readonly '--phz-color-neutral-500': "#78716C";
    readonly '--phz-color-neutral-600': "#57534E";
    readonly '--phz-color-neutral-700': "#44403C";
    readonly '--phz-color-neutral-800': "#292524";
    readonly '--phz-color-neutral-900': "#1C1917";
    readonly '--phz-font-family-base': "'SF Pro Display', 'Inter', system-ui, -apple-system, sans-serif";
    readonly '--phz-font-family-mono': "'SF Mono', 'JetBrains Mono', 'Fira Code', ui-monospace, monospace";
    readonly '--phz-font-size-xs': "0.75rem";
    readonly '--phz-font-size-sm': "0.8125rem";
    readonly '--phz-font-size-base': "0.875rem";
    readonly '--phz-font-size-lg': "1rem";
    readonly '--phz-font-size-xl': "1.125rem";
    readonly '--phz-font-weight-normal': "400";
    readonly '--phz-font-weight-medium': "500";
    readonly '--phz-font-weight-semibold': "600";
    readonly '--phz-font-weight-bold': "700";
    readonly '--phz-spacing-xs': "0.25rem";
    readonly '--phz-spacing-sm': "0.5rem";
    readonly '--phz-spacing-md': "1rem";
    readonly '--phz-spacing-lg': "1.5rem";
    readonly '--phz-spacing-xl': "2rem";
    readonly '--phz-border-radius-sm': "6px";
    readonly '--phz-border-radius-md': "12px";
    readonly '--phz-border-radius-lg': "16px";
    readonly '--phz-border-radius-full': "9999px";
    readonly '--phz-shadow-sm': "0 1px 2px rgba(28,25,23,0.06), 0 1px 3px rgba(28,25,23,0.04)";
    readonly '--phz-shadow-md': "0 4px 6px rgba(28,25,23,0.07), 0 2px 4px rgba(28,25,23,0.04)";
    readonly '--phz-shadow-lg': "0 10px 25px rgba(28,25,23,0.10), 0 4px 10px rgba(28,25,23,0.05)";
    readonly '--phz-shadow-xl': "0 20px 40px rgba(28,25,23,0.12), 0 8px 16px rgba(28,25,23,0.06)";
    readonly '--phz-shadow-float': "0 8px 30px rgba(28,25,23,0.12), 0 2px 8px rgba(28,25,23,0.06)";
    readonly '--phz-transition-fast': "150ms cubic-bezier(0.0, 0.0, 0.2, 1)";
    readonly '--phz-transition-base': "200ms cubic-bezier(0.0, 0.0, 0.2, 1)";
    readonly '--phz-transition-slow': "300ms cubic-bezier(0.0, 0.0, 0.2, 1)";
};
export declare const SemanticTokens: {
    readonly '--phz-grid-bg': "#FEFDFB";
    readonly '--phz-grid-text': "#1C1917";
    readonly '--phz-grid-border': "#E7E5E4";
    readonly '--phz-header-bg': "#1C1917";
    readonly '--phz-header-text': "#FAFAF9";
    readonly '--phz-header-border': "#292524";
    readonly '--phz-header-hover-bg': "#292524";
    readonly '--phz-row-bg': "transparent";
    readonly '--phz-row-bg-alt': "#FAF9F7";
    readonly '--phz-row-bg-hover': "rgba(59, 130, 246, 0.06)";
    readonly '--phz-row-bg-selected': "rgba(59, 130, 246, 0.12)";
    readonly '--phz-row-text-selected': "#1C1917";
    readonly '--phz-row-border': "#F5F5F4";
    readonly '--phz-cell-bg': "transparent";
    readonly '--phz-cell-text': "inherit";
    readonly '--phz-cell-border': "#F5F5F4";
    readonly '--phz-cell-bg-editing': "#FFFFFF";
    readonly '--phz-cell-border-editing': "var(--phz-color-primary)";
    readonly '--phz-focus-ring-color': "var(--phz-color-primary)";
    readonly '--phz-focus-ring-width': "2px";
    readonly '--phz-focus-ring-offset': "2px";
    readonly '--phz-filter-badge-color': "var(--phz-color-primary)";
    readonly '--phz-filter-badge-size': "8px";
    readonly '--phz-popover-bg': "#FEFDFB";
    readonly '--phz-popover-border': "#E7E5E4";
    readonly '--phz-popover-shadow': "var(--phz-shadow-float)";
    readonly '--phz-footer-bg': "#F5F5F4";
    readonly '--phz-footer-text': "#44403C";
    readonly '--phz-footer-border': "#E7E5E4";
};
export declare const ComponentTokens: {
    readonly '--phz-cell-padding': "8px 16px";
    readonly '--phz-cell-font-size': "var(--phz-font-size-sm)";
    readonly '--phz-cell-line-height': "1.5";
    readonly '--phz-header-padding': "10px 16px";
    readonly '--phz-header-font-size': "0.6875rem";
    readonly '--phz-header-font-weight': "600";
    readonly '--phz-header-letter-spacing': "0.06em";
    readonly '--phz-header-text-transform': "uppercase";
    readonly '--phz-row-height': "40px";
    readonly '--phz-row-height-compact': "36px";
    readonly '--phz-row-height-comfortable': "48px";
    readonly '--phz-row-height-dense': "32px";
    readonly '--phz-scrollbar-width': "8px";
    readonly '--phz-scrollbar-thumb-bg': "var(--phz-color-neutral-300)";
    readonly '--phz-scrollbar-track-bg': "transparent";
    readonly '--phz-resize-handle-width': "8px";
    readonly '--phz-resize-handle-bg': "transparent";
    readonly '--phz-resize-handle-bg-hover': "var(--phz-color-primary)";
    readonly '--phz-resize-handle-bg-active': "var(--phz-color-primary)";
};
/**
 * Generates a CSS stylesheet string from all three token layers.
 * Apply to :host for Lit components.
 */
export declare function generateTokenStyles(): string;
//# sourceMappingURL=tokens.d.ts.map