/**
 * @phozart/grid — AriaManager
 *
 * Manages ARIA attributes on the grid's DOM elements to maintain
 * screen reader accessibility, including the semantic shadow layer
 * for virtualized content.
 *
 * Uses separate host element (for setAttribute) and shadowRoot
 * (for querySelector/appendChild) to avoid the crash when the grid
 * passes its renderRoot instead of the host.
 */
import type { GridApi, AriaLabels } from '@phozart/core';
export declare class AriaManager {
    private hostElement;
    private shadowRoot;
    private liveRegion;
    private grid;
    private labels;
    constructor(grid: GridApi);
    setAriaLabels(labels: AriaLabels): void;
    getLabel(key: keyof AriaLabels, fallback: string): string;
    attach(host: HTMLElement, shadowRoot?: DocumentFragment | HTMLElement): void;
    updateGridRole(rowCount: number, columnCount: number): void;
    updateCellRole(rowAttr: string, colAttr: string, role: string): void;
    announceChange(message: string): void;
    destroy(): void;
    private ensureLiveRegion;
}
//# sourceMappingURL=aria-manager.d.ts.map