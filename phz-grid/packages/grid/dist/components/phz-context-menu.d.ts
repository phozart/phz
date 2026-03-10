/**
 * @phozart/phz-grid — <phz-context-menu>
 *
 * A reusable context menu component with Phz Console styling,
 * keyboard navigation, smart viewport positioning, and ARIA support.
 */
import { LitElement, type TemplateResult } from 'lit';
export interface MenuItem {
    id: string;
    label: string;
    icon?: string;
    shortcut?: string;
    disabled?: boolean;
    separator?: boolean;
    checked?: boolean;
    variant?: 'default' | 'danger';
}
export interface ContextMenuOpenEvent {
    x: number;
    y: number;
    items: MenuItem[];
    source?: 'header' | 'body';
    field?: string;
    rowId?: string | number;
}
export declare class PhzContextMenu extends LitElement {
    open: boolean;
    items: MenuItem[];
    x: number;
    y: number;
    private focusedIndex;
    private adjustedX;
    private adjustedY;
    private cleanup;
    static styles: import("lit").CSSResult;
    connectedCallback(): void;
    disconnectedCallback(): void;
    updated(changed: Map<string, unknown>): void;
    show(x: number, y: number, items: MenuItem[]): void;
    hide(): void;
    private positionMenu;
    private addListeners;
    private removeListeners;
    private handleKeydown;
    /** Move DOM focus to the currently highlighted menu item */
    private focusMenuItem;
    private selectItem;
    protected render(): TemplateResult;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-context-menu': PhzContextMenu;
    }
}
//# sourceMappingURL=phz-context-menu.d.ts.map