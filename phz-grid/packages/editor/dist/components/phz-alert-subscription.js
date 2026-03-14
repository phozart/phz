/**
 * @phozart/editor — <phz-alert-subscription> (B-2.12)
 *
 * Alert and subscription management component. Users create,
 * edit, and manage personal alerts and report subscriptions.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createAlertSubscriptionState, setAlertSubTab, searchAlertsSubs, openCreateAlert, openCreateSubscription, toggleAlertEnabled, toggleSubscriptionEnabled, } from '../authoring/alert-subscription-state.js';
let PhzAlertSubscription = class PhzAlertSubscription extends LitElement {
    constructor() {
        super(...arguments);
        this.alerts = [];
        this.subscriptions = [];
        this._state = createAlertSubscriptionState();
    }
    static { this.styles = css `
    :host { display: block; }
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }
    .tabs {
      display: flex;
      gap: 4px;
    }
    .tab {
      padding: 6px 12px;
      border: 1px solid var(--phz-border, #e5e7eb);
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      background: var(--phz-surface, #ffffff);
    }
    .tab[data-active] {
      background: var(--phz-primary, #3b82f6);
      color: white;
      border-color: var(--phz-primary, #3b82f6);
    }
    input[type="search"] {
      flex: 1;
      padding: 6px 12px;
      border: 1px solid var(--phz-border, #e5e7eb);
      border-radius: 4px;
      font-size: 14px;
    }
    .item-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .item-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border: 1px solid var(--phz-border, #e5e7eb);
      border-radius: 8px;
    }
    .item-info { flex: 1; }
    .item-name { font-weight: 600; font-size: 14px; }
    .item-meta { font-size: 12px; color: var(--phz-text-secondary, #6b7280); }
    button {
      cursor: pointer;
      border: 1px solid var(--phz-border, #e5e7eb);
      background: var(--phz-surface, #ffffff);
      border-radius: 4px;
      padding: 6px 12px;
      font-size: 13px;
    }
    .toggle {
      width: 40px;
      height: 22px;
      border-radius: 11px;
      border: 1px solid var(--phz-border, #e5e7eb);
      cursor: pointer;
      position: relative;
      background: var(--phz-surface, #ffffff);
    }
    .toggle[data-enabled] {
      background: var(--phz-primary, #3b82f6);
      border-color: var(--phz-primary, #3b82f6);
    }
  `; }
    willUpdate(changed) {
        if (changed.has('alerts') || changed.has('subscriptions')) {
            this._state = createAlertSubscriptionState(this.alerts, this.subscriptions);
        }
    }
    /** Get the current state. */
    getState() {
        return this._state;
    }
    _onTabChange(tab) {
        this._state = setAlertSubTab(this._state, tab);
    }
    _onSearch(e) {
        const input = e.target;
        this._state = searchAlertsSubs(this._state, input.value);
    }
    _onToggleAlert(alertId) {
        this._state = toggleAlertEnabled(this._state, alertId);
        this.dispatchEvent(new CustomEvent('alert-toggle', {
            detail: { alertId },
            bubbles: true,
            composed: true,
        }));
    }
    _onToggleSub(subId) {
        this._state = toggleSubscriptionEnabled(this._state, subId);
        this.dispatchEvent(new CustomEvent('subscription-toggle', {
            detail: { subscriptionId: subId },
            bubbles: true,
            composed: true,
        }));
    }
    render() {
        return html `
      <div class="header">
        <div class="tabs" role="tablist">
          <button
            class="tab"
            role="tab"
            ?data-active=${this._state.activeTab === 'alerts'}
            aria-selected=${this._state.activeTab === 'alerts'}
            @click=${() => this._onTabChange('alerts')}
          >Alerts (${this._state.filteredAlerts.length})</button>
          <button
            class="tab"
            role="tab"
            ?data-active=${this._state.activeTab === 'subscriptions'}
            aria-selected=${this._state.activeTab === 'subscriptions'}
            @click=${() => this._onTabChange('subscriptions')}
          >Subscriptions (${this._state.filteredSubscriptions.length})</button>
        </div>
        <input
          type="search"
          placeholder="Search..."
          .value=${this._state.searchQuery}
          @input=${this._onSearch}
          aria-label="Search alerts and subscriptions"
        />
        ${this._state.activeTab === 'alerts'
            ? html `<button @click=${() => { this._state = openCreateAlert(this._state); }}>New Alert</button>`
            : html `<button @click=${() => { this._state = openCreateSubscription(this._state); }}>New Subscription</button>`}
      </div>

      <div class="item-list" role="list">
        ${this._state.activeTab === 'alerts'
            ? this._state.filteredAlerts.map(alert => html `
            <div class="item-card" role="listitem">
              <div class="item-info">
                <div class="item-name">${alert.name}</div>
                <div class="item-meta">${alert.channels.join(', ')}</div>
              </div>
              <button
                class="toggle"
                ?data-enabled=${alert.enabled}
                @click=${() => this._onToggleAlert(alert.id)}
                aria-label=${`${alert.enabled ? 'Disable' : 'Enable'} ${alert.name}`}
                role="switch"
                aria-checked=${alert.enabled}
              ></button>
            </div>
          `)
            : this._state.filteredSubscriptions.map(sub => html `
            <div class="item-card" role="listitem">
              <div class="item-info">
                <div class="item-name">${sub.artifactId}</div>
                <div class="item-meta">${sub.frequency} &middot; ${sub.format}</div>
              </div>
              <button
                class="toggle"
                ?data-enabled=${sub.enabled}
                @click=${() => this._onToggleSub(sub.id)}
                aria-label=${`${sub.enabled ? 'Disable' : 'Enable'} subscription`}
                role="switch"
                aria-checked=${sub.enabled}
              ></button>
            </div>
          `)}
      </div>
    `;
    }
};
__decorate([
    property({ type: Array })
], PhzAlertSubscription.prototype, "alerts", void 0);
__decorate([
    property({ type: Array })
], PhzAlertSubscription.prototype, "subscriptions", void 0);
__decorate([
    state()
], PhzAlertSubscription.prototype, "_state", void 0);
PhzAlertSubscription = __decorate([
    customElement('phz-alert-subscription')
], PhzAlertSubscription);
export { PhzAlertSubscription };
//# sourceMappingURL=phz-alert-subscription.js.map