/**
 * @phozart/phz-grid — ForcedColorsAdapter
 *
 * Detects and adapts to Windows High Contrast / Forced Colors Mode.
 * Ensures the grid remains fully usable when system forced colors
 * override custom CSS properties.
 */

export class ForcedColorsAdapter {
  /**
   * Detects whether the user has forced colors mode enabled.
   */
  static detect(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(forced-colors: active)').matches;
  }

  /**
   * Applies forced-colors-safe styles to an element.
   * Uses system color keywords that respect the user's high contrast settings.
   */
  static applyForcedColorsStyles(element: HTMLElement): void {
    element.classList.add('phz-forced-colors');
  }

  /**
   * Removes forced-colors overrides from an element.
   */
  static removeForcedColorsStyles(element: HTMLElement): void {
    element.classList.remove('phz-forced-colors');
  }

  /**
   * Returns a media query listener for forced-colors changes.
   * Use to reactively adapt when the user toggles high contrast mode.
   */
  static onChange(callback: (active: boolean) => void): (() => void) | null {
    if (typeof window === 'undefined' || !window.matchMedia) return null;
    const mql = window.matchMedia('(forced-colors: active)');
    const handler = (e: MediaQueryListEvent) => callback(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }
}

/**
 * CSS for forced colors mode. Apply via Lit's `css` tagged template
 * or inject as a <style> block.
 */
export const forcedColorsCSS = `
@media (forced-colors: active) {
  :host {
    border-color: CanvasText;
    color: CanvasText;
    background: Canvas;
    forced-color-adjust: none;
  }

  .phz-header-cell {
    border-color: CanvasText;
    background: Canvas;
    color: CanvasText;
  }

  .phz-data-cell {
    border-color: CanvasText;
    color: CanvasText;
  }

  .phz-row--selected {
    background: Highlight;
    color: HighlightText;
  }

  .phz-row--hover {
    outline: 2px solid LinkText;
    outline-offset: -2px;
  }

  :focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  .phz-sort-icon,
  .phz-filter-badge {
    color: LinkText;
  }

  .phz-checkbox {
    border-color: CanvasText;
  }

  .phz-checkbox--checked {
    background: Highlight;
    border-color: Highlight;
    color: HighlightText;
  }

  .phz-resize-handle {
    background: CanvasText;
  }

  .phz-cell--editing {
    outline: 2px solid Highlight;
    background: Field;
    color: FieldText;
  }
}
`;
