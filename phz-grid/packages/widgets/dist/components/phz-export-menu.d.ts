/**
 * @phozart/phz-widgets — Export Menu Component
 *
 * Dropdown menu for exporting widget data (CSV, clipboard, image).
 * Emits `widget-export` event with format and data.
 */
import { LitElement } from 'lit';
export interface ExportMenuItem {
    id: 'csv' | 'clipboard' | 'image';
    label: string;
    icon: string;
}
export declare const EXPORT_MENU_ITEMS: ExportMenuItem[];
export interface WidgetExportEvent {
    format: 'csv' | 'clipboard' | 'image';
}
export declare class PhzExportMenu extends LitElement {
    static styles: import("lit").CSSResult[];
    private _open;
    private _focusIndex;
    private _onTriggerClick;
    private _onTriggerKeyDown;
    private _onMenuKeyDown;
    private _focusCurrentItem;
    private _close;
    private _onItemClick;
    private _onOutsideClick;
    connectedCallback(): void;
    disconnectedCallback(): void;
    render(): import("lit-html").TemplateResult<1>;
    private _renderIcon;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-export-menu': PhzExportMenu;
    }
}
//# sourceMappingURL=phz-export-menu.d.ts.map