/**
 * @phozart/phz-viewer — <phz-attention-dropdown> Custom Element
 *
 * Dropdown panel for attention items (alerts, notifications).
 * Delegates to the headless attention-state functions.
 */
import { LitElement, type TemplateResult } from 'lit';
import type { AttentionItem } from '@phozart/phz-shared/adapters';
import { type AttentionDropdownState } from '../screens/attention-state.js';
export declare class PhzAttentionDropdown extends LitElement {
    static styles: import("lit").CSSResult;
    open: boolean;
    items: AttentionItem[];
    private _dropdownState;
    willUpdate(changed: Map<string, unknown>): void;
    getDropdownState(): AttentionDropdownState;
    toggle(): void;
    render(): TemplateResult;
    private _renderItem;
    private _handleMarkAllRead;
    private _handleTypeFilter;
    private _handleItemClick;
    private _handleDismiss;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-attention-dropdown': PhzAttentionDropdown;
    }
}
//# sourceMappingURL=phz-attention-dropdown.d.ts.map