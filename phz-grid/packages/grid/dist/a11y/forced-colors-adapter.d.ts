/**
 * @phozart/phz-grid — ForcedColorsAdapter
 *
 * Detects and adapts to Windows High Contrast / Forced Colors Mode.
 * Ensures the grid remains fully usable when system forced colors
 * override custom CSS properties.
 */
export declare class ForcedColorsAdapter {
    /**
     * Detects whether the user has forced colors mode enabled.
     */
    static detect(): boolean;
    /**
     * Applies forced-colors-safe styles to an element.
     * Uses system color keywords that respect the user's high contrast settings.
     */
    static applyForcedColorsStyles(element: HTMLElement): void;
    /**
     * Removes forced-colors overrides from an element.
     */
    static removeForcedColorsStyles(element: HTMLElement): void;
    /**
     * Returns a media query listener for forced-colors changes.
     * Use to reactively adapt when the user toggles high contrast mode.
     */
    static onChange(callback: (active: boolean) => void): (() => void) | null;
}
/**
 * CSS for forced colors mode. Apply via Lit's `css` tagged template
 * or inject as a <style> block.
 */
export declare const forcedColorsCSS = "\n@media (forced-colors: active) {\n  :host {\n    border-color: CanvasText;\n    color: CanvasText;\n    background: Canvas;\n    forced-color-adjust: none;\n  }\n\n  .phz-header-cell {\n    border-color: CanvasText;\n    background: Canvas;\n    color: CanvasText;\n  }\n\n  .phz-data-cell {\n    border-color: CanvasText;\n    color: CanvasText;\n  }\n\n  .phz-row--selected {\n    background: Highlight;\n    color: HighlightText;\n  }\n\n  .phz-row--hover {\n    outline: 2px solid LinkText;\n    outline-offset: -2px;\n  }\n\n  :focus-visible {\n    outline: 2px solid Highlight;\n    outline-offset: 2px;\n  }\n\n  .phz-sort-icon,\n  .phz-filter-badge {\n    color: LinkText;\n  }\n\n  .phz-checkbox {\n    border-color: CanvasText;\n  }\n\n  .phz-checkbox--checked {\n    background: Highlight;\n    border-color: Highlight;\n    color: HighlightText;\n  }\n\n  .phz-resize-handle {\n    background: CanvasText;\n  }\n\n  .phz-cell--editing {\n    outline: 2px solid Highlight;\n    background: Field;\n    color: FieldText;\n  }\n}\n";
//# sourceMappingURL=forced-colors-adapter.d.ts.map