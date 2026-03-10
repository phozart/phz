/**
 * @phozart/phz-workspace — Context Menu Component
 *
 * Generic positioned overlay for context menus.
 * Receives ContextMenuItem[] and emits 'menu-action' with the selected action ID.
 * Supports nested submenus, separators, icons, shortcuts, and keyboard navigation.
 */
import { LitElement, nothing } from 'lit';
import type { ContextMenuItem } from './report-context-menu.js';
export declare class PhzContextMenu extends LitElement {
    items: ContextMenuItem[];
    x: number;
    y: number;
    open: boolean;
    private _focusedIndex;
    private _openSubmenuId?;
    static styles: import("lit").CSSResult;
    connectedCallback(): void;
    disconnectedCallback(): void;
    updated(changed: Map<string, unknown>): void;
    private _clampPosition;
    private _onDocClick;
    private _onDocKeyDown;
    private _getActionItems;
    private _selectItem;
    private _close;
    render(): typeof nothing | import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-context-menu': PhzContextMenu;
    }
}
//# sourceMappingURL=phz-context-menu.d.ts.map