/**
 * @phozart/phz-editor — <phz-alert-subscription> (B-2.12)
 *
 * Alert and subscription management component. Users create,
 * edit, and manage personal alerts and report subscriptions.
 */
import { LitElement } from 'lit';
import type { PersonalAlert } from '@phozart/phz-shared/types';
import type { Subscription } from '@phozart/phz-shared/types';
import type { AlertSubscriptionState } from '../authoring/alert-subscription-state.js';
export declare class PhzAlertSubscription extends LitElement {
    static styles: import("lit").CSSResult;
    alerts: PersonalAlert[];
    subscriptions: Subscription[];
    private _state;
    willUpdate(changed: Map<PropertyKey, unknown>): void;
    /** Get the current state. */
    getState(): AlertSubscriptionState;
    private _onTabChange;
    private _onSearch;
    private _onToggleAlert;
    private _onToggleSub;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-alert-subscription': PhzAlertSubscription;
    }
}
//# sourceMappingURL=phz-alert-subscription.d.ts.map