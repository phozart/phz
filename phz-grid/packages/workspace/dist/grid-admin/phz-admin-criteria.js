/**
 * @phozart/grid-admin — Criteria Binding Tab
 *
 * Two-panel interface: available filter definitions (left) and
 * bound filters (right). Admins add/remove/reorder/configure bindings.
 * Emits `criteria-binding-change` on any binding change.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import { adminBaseStyles } from './shared-styles.js';
let PhzAdminCriteria = class PhzAdminCriteria extends LitElement {
    constructor() {
        super(...arguments);
        this.availableDefinitions = [];
        this.bindings = [];
        this.searchQuery = '';
        this.editingBindingId = null;
    }
    static { this.styles = [
        adminBaseStyles,
        css `
      :host { display: block; }

      .criteria-layout {
        display: grid; grid-template-columns: 1fr 1fr;
        gap: 12px; min-height: 280px;
      }

      .criteria-panel {
        border: 1px solid #E7E5E4; border-radius: 10px;
        display: flex; flex-direction: column; overflow: hidden;
      }
      .criteria-panel__header {
        padding: 8px 12px; background: #FAFAF9;
        border-bottom: 1px solid #E7E5E4;
        font-size: 12px; font-weight: 700; color: #78716C;
        text-transform: uppercase; letter-spacing: 0.05em;
        display: flex; justify-content: space-between; align-items: center;
      }
      .criteria-panel__body {
        flex: 1; overflow-y: auto; padding: 8px;
      }
      .criteria-panel__count {
        font-weight: 400; color: #A8A29E;
      }

      .criteria-search {
        padding: 4px 8px; margin-bottom: 6px;
        border: 1px solid #E7E5E4; border-radius: 6px;
        display: flex; align-items: center;
      }
      .criteria-search input {
        border: none; outline: none; font-size: 12px;
        background: transparent; width: 100%; color: #1C1917;
        font-family: inherit;
      }
      .criteria-search input::placeholder { color: #A8A29E; }

      .def-item {
        display: flex; align-items: center; justify-content: space-between;
        padding: 6px 10px; border-radius: 6px; margin-bottom: 4px;
        cursor: pointer; font-size: 13px; transition: background 0.1s;
      }
      .def-item:hover { background: #EFF6FF; }
      .def-item__info { display: flex; flex-direction: column; gap: 2px; }
      .def-item__label { color: #1C1917; font-weight: 500; }
      .def-item__type { font-size: 10px; color: #A8A29E; }

      .add-btn, .remove-btn {
        background: none; border: none; cursor: pointer;
        padding: 4px 8px; border-radius: 4px; font-size: 12px;
        transition: all 0.1s;
      }
      .add-btn { color: #3B82F6; }
      .add-btn:hover { background: #EFF6FF; }
      .remove-btn { color: #DC2626; }
      .remove-btn:hover { background: #FEF2F2; }

      .bound-item {
        display: flex; align-items: center; justify-content: space-between;
        padding: 6px 10px; border-radius: 8px; margin-bottom: 4px;
        background: white; border: 1px solid #E7E5E4;
        box-shadow: var(--phz-admin-shadow-sm);
        transition: all 0.15s;
      }
      .bound-item:hover {
        box-shadow: var(--phz-admin-shadow-md);
      }
      .bound-item__order {
        font-size: 11px; font-weight: 700; color: #A8A29E;
        width: 20px; text-align: center;
      }
      .bound-item__label { flex: 1; font-size: 13px; color: #1C1917; margin-left: 8px; }
      .bound-item__actions { display: flex; gap: 2px; }
      .bound-item__hidden { opacity: 0.5; }

      .icon-btn {
        background: none; border: none; cursor: pointer;
        width: 28px; height: 28px; border-radius: 6px;
        display: flex; align-items: center; justify-content: center;
        color: #78716C; font-size: 14px; transition: all 0.1s;
      }
      .icon-btn:hover { background: #F5F5F4; color: #1C1917; }
      .icon-btn--danger:hover { background: #FEF2F2; color: #DC2626; }

      .move-btn { font-size: 12px; }

      .config-overlay {
        margin-top: 8px; padding: 12px;
        background: #FAFAF9; border: 1px solid #E7E5E4; border-radius: 8px;
      }
      .config-overlay__title {
        font-size: 12px; font-weight: 700; color: #44403C; margin: 0 0 8px;
      }

      .empty-state {
        text-align: center; padding: 24px 12px; color: #A8A29E; font-size: 12px;
      }
    `,
    ]; }
    /** Definitions not yet bound */
    get unboundDefinitions() {
        const boundIds = new Set((this.bindings ?? []).map(b => b.filterDefinitionId));
        const defs = (this.availableDefinitions ?? []).filter(d => !boundIds.has(d.id));
        if (!this.searchQuery.trim())
            return defs;
        const q = this.searchQuery.toLowerCase();
        return defs.filter(d => d.label.toLowerCase().includes(q) ||
            d.type.toLowerCase().includes(q));
    }
    _emitChange() {
        this.dispatchEvent(new CustomEvent('criteria-binding-change', {
            bubbles: true, composed: true,
            detail: { bindings: [...this.bindings] },
        }));
    }
    _addBinding(def) {
        const newBinding = {
            filterDefinitionId: def.id,
            label: def.label,
            type: def.type,
            visible: true,
            order: (this.bindings ?? []).length + 1,
        };
        this.bindings = [...(this.bindings ?? []), newBinding];
        this._emitChange();
    }
    _removeBinding(filterDefinitionId) {
        this.bindings = (this.bindings ?? [])
            .filter(b => b.filterDefinitionId !== filterDefinitionId)
            .map((b, i) => ({ ...b, order: i + 1 }));
        if (this.editingBindingId === filterDefinitionId)
            this.editingBindingId = null;
        this._emitChange();
    }
    _moveBinding(filterDefinitionId, direction) {
        const idx = (this.bindings ?? []).findIndex(b => b.filterDefinitionId === filterDefinitionId);
        if (idx < 0)
            return;
        const newIdx = idx + direction;
        if (newIdx < 0 || newIdx >= (this.bindings ?? []).length)
            return;
        const arr = [...(this.bindings ?? [])];
        [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
        this.bindings = arr.map((b, i) => ({ ...b, order: i + 1 }));
        this._emitChange();
    }
    _toggleVisibility(filterDefinitionId) {
        this.bindings = (this.bindings ?? []).map(b => b.filterDefinitionId === filterDefinitionId
            ? { ...b, visible: !b.visible }
            : b);
        this._emitChange();
    }
    _toggleConfig(filterDefinitionId) {
        this.editingBindingId = this.editingBindingId === filterDefinitionId
            ? null
            : filterDefinitionId;
    }
    _updateLabelOverride(filterDefinitionId, value) {
        this.bindings = (this.bindings ?? []).map(b => b.filterDefinitionId === filterDefinitionId
            ? { ...b, labelOverride: value || undefined }
            : b);
        this._emitChange();
    }
    render() {
        const unbound = this.unboundDefinitions;
        const sortedBindings = [...this.bindings].sort((a, b) => a.order - b.order);
        return html `
      <div class="criteria-layout">
        <!-- Available Definitions -->
        <div class="criteria-panel">
          <div class="criteria-panel__header">
            Available Filters
            <span class="criteria-panel__count">${unbound.length}</span>
          </div>
          <div class="criteria-panel__body">
            <div class="criteria-search">
              <input type="text" placeholder="Search filters..."
                     .value=${this.searchQuery}
                     @input=${(e) => { this.searchQuery = e.target.value; }} />
            </div>
            ${unbound.length === 0 ? html `
              <div class="empty-state">
                ${(this.availableDefinitions ?? []).length === 0
            ? 'No filter definitions registered.'
            : 'All filters are bound.'}
              </div>
            ` : unbound.map(def => html `
              <div class="def-item">
                <div class="def-item__info">
                  <span class="def-item__label">${def.label}</span>
                  <span class="def-item__type">${def.type}${def.dataField ? ` \u2192 ${def.dataField}` : ''}</span>
                </div>
                <button class="add-btn" @click=${() => this._addBinding(def)} title="Add to report">+ Add</button>
              </div>
            `)}
          </div>
        </div>

        <!-- Bound Filters -->
        <div class="criteria-panel">
          <div class="criteria-panel__header">
            Bound to Report
            <span class="criteria-panel__count">${sortedBindings.length}</span>
          </div>
          <div class="criteria-panel__body">
            ${sortedBindings.length === 0 ? html `
              <div class="empty-state">No filters bound. Add from the left panel.</div>
            ` : sortedBindings.map((b, idx) => html `
              <div class="bound-item ${!b.visible ? 'bound-item__hidden' : ''}">
                <span class="bound-item__order">${b.order}</span>
                <span class="bound-item__label">${b.labelOverride ?? b.label}</span>
                <div class="bound-item__actions">
                  <button class="icon-btn move-btn" @click=${() => this._moveBinding(b.filterDefinitionId, -1)}
                          ?disabled=${idx === 0} title="Move up">\u25B2</button>
                  <button class="icon-btn move-btn" @click=${() => this._moveBinding(b.filterDefinitionId, 1)}
                          ?disabled=${idx === sortedBindings.length - 1} title="Move down">\u25BC</button>
                  <button class="icon-btn" @click=${() => this._toggleVisibility(b.filterDefinitionId)}
                          title="${b.visible ? 'Hide' : 'Show'}">${b.visible ? '\u{1F441}' : '\u{1F441}\u200D\u{1F5E8}'}</button>
                  <button class="icon-btn" @click=${() => this._toggleConfig(b.filterDefinitionId)}
                          title="Configure">\u2699</button>
                  <button class="icon-btn icon-btn--danger" @click=${() => this._removeBinding(b.filterDefinitionId)}
                          title="Remove">\u2715</button>
                </div>
              </div>
              ${this.editingBindingId === b.filterDefinitionId ? html `
                <div class="config-overlay">
                  <p class="config-overlay__title">Binding Configuration</p>
                  <div class="phz-admin-field">
                    <label class="phz-admin-label">Label Override</label>
                    <input class="phz-admin-input" type="text"
                           .value=${b.labelOverride ?? ''}
                           @input=${(e) => this._updateLabelOverride(b.filterDefinitionId, e.target.value)}
                           placeholder="${b.label}" />
                  </div>
                  <div class="phz-admin-field">
                    <label class="phz-admin-checkbox">
                      <input type="checkbox" .checked=${b.visible}
                             @change=${() => this._toggleVisibility(b.filterDefinitionId)} />
                      Visible in criteria bar
                    </label>
                  </div>
                </div>
              ` : nothing}
            `)}
          </div>
        </div>
      </div>
    `;
    }
};
__decorate([
    property({ attribute: false })
], PhzAdminCriteria.prototype, "availableDefinitions", void 0);
__decorate([
    property({ attribute: false })
], PhzAdminCriteria.prototype, "bindings", void 0);
__decorate([
    state()
], PhzAdminCriteria.prototype, "searchQuery", void 0);
__decorate([
    state()
], PhzAdminCriteria.prototype, "editingBindingId", void 0);
PhzAdminCriteria = __decorate([
    safeCustomElement('phz-admin-criteria')
], PhzAdminCriteria);
export { PhzAdminCriteria };
//# sourceMappingURL=phz-admin-criteria.js.map