/**
 * @phozart/phz-criteria — Filter Drawer
 *
 * Right-side slide-out panel (520px default) with backdrop overlay.
 * Supports pinned mode: drawer becomes an inline sidebar (no overlay).
 * Drag-to-resize handle on the left edge. CSS transition, escape key close, focus trap.
 */
import { LitElement, nothing } from 'lit';
export declare class PhzFilterDrawer extends LitElement {
    static styles: import("lit").CSSResult[];
    open: boolean;
    width: number;
    minWidth: number;
    maxWidth: number;
    showBackdrop: boolean;
    resizable: boolean;
    drawerTitle: string;
    /** Whether the pin button is shown */
    pinnable: boolean;
    /** Whether the drawer is currently pinned as a sidebar */
    pinned: boolean;
    private _resizing;
    private _transitionDone;
    private _panel?;
    private _keydownHandler;
    private _startX;
    private _startWidth;
    connectedCallback(): void;
    disconnectedCallback(): void;
    updated(changed: Map<string, unknown>): void;
    private _onTransitionEnd;
    private _close;
    private _togglePin;
    private _onBackdropClick;
    private _onResizeStart;
    private _onResizeMove;
    private _onResizeEnd;
    private _cleanupResize;
    render(): import("lit-html").TemplateResult<1> | typeof nothing;
}
//# sourceMappingURL=phz-filter-drawer.d.ts.map