/**
 * @phozart/engine-admin — Filter Picker (Artefact Binding Selector)
 *
 * 2-panel component: Available Definitions (left) | Bound to Artefact (right).
 * Consumer owns persistence — component emits events, consumer passes updated bindings.
 *
 * Events:
 * - binding-add:     { bindings: FilterBinding[] }
 * - binding-remove:  { filterDefinitionId, artefactId }
 * - binding-update:  { filterDefinitionId, artefactId, patch }
 * - binding-reorder: { artefactId, orderedIds: string[] }
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../../safe-custom-element.js';
import { engineAdminStyles } from '../shared-styles.js';
import { artefactId as makeArtefactId } from '@phozart/core';
let PhzFilterPicker = class PhzFilterPicker extends LitElement {
    constructor() {
        super(...arguments);
        /** All available filter definitions from the registry */
        this.definitions = [];
        /** Current bindings for this artefact */
        this.bindings = [];
        /** The artefact these bindings belong to */
        this.artefactId = '';
        this._search = '';
        this._checked = new Set();
        this._expandedOverrides = new Set();
    }
    static { this.styles = [
        engineAdminStyles,
        css `
      :host { display: block; height: 100%; }

      .picker {
        display: grid;
        grid-template-columns: 300px 1fr;
        height: 100%;
        min-height: 400px;
        border: 1px solid #E7E5E4;
        border-radius: 8px;
        overflow: hidden;
        background: white;
      }

      /* Left panel — Available Definitions */
      .avail-panel {
        display: flex;
        flex-direction: column;
        border-right: 1px solid #E7E5E4;
        overflow: hidden;
      }

      .avail-header {
        padding: 12px;
        border-bottom: 1px solid #E7E5E4;
        flex-shrink: 0;
      }

      .avail-search {
        width: 100%;
        padding: 7px 10px;
        border: 1px solid #D6D3D1;
        border-radius: 6px;
        font-size: 13px;
        font-family: inherit;
      }

      .avail-search:focus { outline: none; border-color: #3B82F6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }

      .avail-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
      }

      .avail-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        transition: background 0.1s;
      }

      .avail-item:hover { background: #FAFAF9; }
      .avail-item--bound { opacity: 0.5; }

      .avail-item input[type="checkbox"] { flex-shrink: 0; }

      .avail-item-info { flex: 1; min-width: 0; }
      .avail-item-label { font-weight: 600; color: #1C1917; display: block; }
      .avail-item-meta { font-size: 11px; color: #A8A29E; display: flex; gap: 6px; align-items: center; }

      .type-badge {
        display: inline-flex;
        padding: 1px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        background: #F5F5F4;
        color: #78716C;
      }

      .session-badge {
        font-size: 10px;
        color: #78716C;
      }

      .bound-indicator {
        font-size: 10px;
        color: #3B82F6;
        font-weight: 600;
      }

      .avail-footer {
        padding: 12px;
        border-top: 1px solid #E7E5E4;
        flex-shrink: 0;
      }

      .avail-empty {
        text-align: center;
        padding: 24px;
        color: #A8A29E;
        font-size: 13px;
      }

      /* Right panel — Bound definitions */
      .bound-panel {
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .bound-header {
        padding: 12px 16px;
        border-bottom: 1px solid #E7E5E4;
        flex-shrink: 0;
        font-size: 11px;
        font-weight: 700;
        color: #78716C;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .bound-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px 12px;
      }

      .bound-card {
        background: #FAFAF9;
        border: 1px solid #E7E5E4;
        border-radius: 8px;
        margin-bottom: 8px;
        overflow: hidden;
      }

      .bound-card-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
      }

      .bound-order {
        font-size: 11px;
        font-weight: 700;
        color: #A8A29E;
        min-width: 20px;
        text-align: center;
      }

      .bound-info { flex: 1; min-width: 0; }

      .bound-name {
        font-size: 13px;
        font-weight: 600;
        color: #1C1917;
      }

      .bound-badges {
        display: flex;
        gap: 6px;
        align-items: center;
        margin-top: 2px;
      }

      .bound-actions {
        display: flex;
        gap: 2px;
      }

      .bound-action-btn {
        width: 26px;
        height: 26px;
        border: 1px solid #E7E5E4;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: #78716C;
      }

      .bound-action-btn:hover { background: #F5F5F4; color: #1C1917; }
      .bound-action-btn--danger:hover { background: #FEF2F2; color: #DC2626; border-color: #FCA5A5; }

      /* Override section */
      .override-toggle {
        padding: 0 12px 8px;
      }

      .override-btn {
        font-size: 11px;
        color: #3B82F6;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        font-family: inherit;
      }

      .override-btn:hover { text-decoration: underline; }

      .override-panel {
        padding: 8px 12px 12px;
        border-top: 1px solid #E7E5E4;
        background: white;
      }

      .override-field {
        display: flex;
        flex-direction: column;
        gap: 3px;
        margin-bottom: 10px;
      }

      .override-label {
        font-size: 11px;
        font-weight: 600;
        color: #44403C;
      }

      .override-input {
        padding: 5px 8px;
        border: 1px solid #D6D3D1;
        border-radius: 4px;
        font-size: 12px;
        font-family: inherit;
      }

      .override-input:focus { outline: none; border-color: #3B82F6; }

      /* Toggle */
      .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 3px 0;
      }

      .toggle-label { font-size: 11px; color: #44403C; }

      .toggle {
        width: 32px;
        height: 18px;
        border: none;
        border-radius: 9px;
        background: #D6D3D1;
        cursor: pointer;
        position: relative;
        transition: background 0.15s;
      }

      .toggle--on { background: #3B82F6; }

      .toggle::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: white;
        transition: transform 0.15s;
      }

      .toggle--on::after { transform: translateX(14px); }

      .bound-empty {
        text-align: center;
        padding: 32px;
        color: #A8A29E;
        font-size: 13px;
      }
    `,
    ]; }
    /* ── Computed ── */
    get _boundIds() {
        return new Set((this.bindings ?? []).map(b => b.filterDefinitionId));
    }
    get _filteredDefs() {
        const q = this._search.toLowerCase();
        return (this.definitions ?? []).filter(d => !d.deprecated &&
            (d.label.toLowerCase().includes(q) || d.type.includes(q)));
    }
    get _sortedBindings() {
        return [...this.bindings].sort((a, b) => a.order - b.order);
    }
    /* ── Event dispatch ── */
    _emit(name, detail) {
        this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
    }
    /* ── Actions ── */
    _addSelected() {
        if (this._checked.size === 0)
            return;
        const maxOrder = this.bindings.reduce((max, b) => Math.max(max, b.order), 0);
        const newBindings = [];
        let order = maxOrder;
        this._checked.forEach(defId => {
            if (!this._boundIds.has(defId)) {
                order += 1;
                newBindings.push({
                    filterDefinitionId: defId,
                    artefactId: makeArtefactId(this.artefactId || 'default'),
                    visible: true,
                    order,
                });
            }
        });
        if (newBindings.length > 0) {
            this._emit('binding-add', { bindings: newBindings });
        }
        this._checked = new Set();
    }
    _removeBinding(defId) {
        this._emit('binding-remove', {
            filterDefinitionId: defId,
            artefactId: this.artefactId || 'default',
        });
    }
    _moveBinding(defId, direction) {
        const sorted = this._sortedBindings;
        const idx = sorted.findIndex(b => b.filterDefinitionId === defId);
        if (idx < 0)
            return;
        const targetIdx = idx + direction;
        if (targetIdx < 0 || targetIdx >= sorted.length)
            return;
        const reordered = [...sorted];
        [reordered[idx], reordered[targetIdx]] = [reordered[targetIdx], reordered[idx]];
        this._emit('binding-reorder', {
            artefactId: this.artefactId || 'default',
            orderedIds: reordered.map(b => b.filterDefinitionId),
        });
    }
    _updateOverride(defId, patch) {
        this._emit('binding-update', {
            filterDefinitionId: defId,
            artefactId: this.artefactId || 'default',
            patch,
        });
    }
    _toggleOverrides(defId) {
        const next = new Set(this._expandedOverrides);
        if (next.has(defId))
            next.delete(defId);
        else
            next.add(defId);
        this._expandedOverrides = next;
    }
    _toggleChecked(defId) {
        const next = new Set(this._checked);
        if (next.has(defId))
            next.delete(defId);
        else
            next.add(defId);
        this._checked = next;
    }
    /* ── Render ── */
    render() {
        return html `
      <div class="picker" role="region" aria-label="Filter Binding Picker">
        <div class="avail-panel">
          ${this._renderAvailablePanel()}
        </div>
        <div class="bound-panel">
          ${this._renderBoundPanel()}
        </div>
      </div>
    `;
    }
    /* ── Left Panel ── */
    _renderAvailablePanel() {
        const defs = this._filteredDefs;
        const checkedCount = [...this._checked].filter(id => !this._boundIds.has(id)).length;
        return html `
      <div class="avail-header">
        <input class="avail-search" placeholder="Search filters..."
               .value=${this._search}
               @input=${(e) => this._search = e.target.value}>
      </div>
      <div class="avail-list">
        ${defs.length === 0 ? html `<div class="avail-empty">No definitions available</div>` : nothing}
        ${defs.map(def => {
            const isBound = this._boundIds.has(def.id);
            const isChecked = this._checked.has(def.id);
            return html `
            <label class="avail-item ${isBound ? 'avail-item--bound' : ''}">
              <input type="checkbox"
                     .checked=${isChecked || isBound}
                     .disabled=${isBound}
                     @change=${() => this._toggleChecked(def.id)}>
              <div class="avail-item-info">
                <span class="avail-item-label">${def.label}</span>
                <span class="avail-item-meta">
                  <span class="type-badge">${def.type.replace(/_/g, ' ')}</span>
                  <span class="session-badge">${def.sessionBehavior}</span>
                  ${def.options?.length ? html `<span>${def.options.length} opts</span>` : nothing}
                  ${isBound ? html `<span class="bound-indicator">(bound)</span>` : nothing}
                </span>
              </div>
            </label>
          `;
        })}
      </div>
      <div class="avail-footer">
        <button class="phz-ea-btn phz-ea-btn--primary" style="width:100%"
                .disabled=${checkedCount === 0}
                @click=${this._addSelected}>
          + Add Selected${checkedCount > 0 ? ` (${checkedCount})` : ''}
        </button>
      </div>
    `;
    }
    /* ── Right Panel ── */
    _renderBoundPanel() {
        const sorted = this._sortedBindings;
        return html `
      <div class="bound-header">Bound to This Report (${sorted.length})</div>
      <div class="bound-list">
        ${sorted.length === 0 ? html `<div class="bound-empty">No filters bound to this artefact</div>` : nothing}
        ${sorted.map((binding, idx) => {
            const def = (this.definitions ?? []).find(d => d.id === binding.filterDefinitionId);
            const defId = binding.filterDefinitionId;
            const expanded = this._expandedOverrides.has(defId);
            return html `
            <div class="bound-card">
              <div class="bound-card-header">
                <span class="bound-order">#${idx + 1}</span>
                <div class="bound-info">
                  <span class="bound-name">${binding.labelOverride || def?.label || defId}</span>
                  <div class="bound-badges">
                    <span class="type-badge">${def?.type.replace(/_/g, ' ') ?? '?'}</span>
                    <span class="session-badge">${def?.sessionBehavior ?? ''}</span>
                    ${!binding.visible ? html `<span style="font-size:10px;color:#DC2626">Hidden</span>` : nothing}
                  </div>
                </div>
                <div class="bound-actions">
                  <button class="bound-action-btn" @click=${() => this._moveBinding(defId, -1)}
                          .disabled=${idx === 0} title="Move up">&#9650;</button>
                  <button class="bound-action-btn" @click=${() => this._moveBinding(defId, 1)}
                          .disabled=${idx === sorted.length - 1} title="Move down">&#9660;</button>
                  <button class="bound-action-btn bound-action-btn--danger"
                          @click=${() => this._removeBinding(defId)} title="Remove">&times;</button>
                </div>
              </div>
              <div class="override-toggle">
                <button class="override-btn" @click=${() => this._toggleOverrides(defId)}>
                  ${expanded ? '- Hide overrides' : '> Overrides'}
                </button>
              </div>
              ${expanded ? this._renderOverrides(binding) : nothing}
            </div>
          `;
        })}
      </div>
    `;
    }
    /* ── Overrides panel ── */
    _renderOverrides(binding) {
        const defId = binding.filterDefinitionId;
        const bar = binding.barConfigOverride ?? {};
        return html `
      <div class="override-panel">
        <div class="override-field">
          <label class="override-label">Label Override</label>
          <input class="override-input" .value=${binding.labelOverride ?? ''}
                 placeholder="Use definition label"
                 @change=${(e) => this._updateOverride(defId, { labelOverride: e.target.value || undefined })}>
        </div>
        <div class="toggle-row">
          <span class="toggle-label">Visible</span>
          <button class="toggle ${binding.visible ? 'toggle--on' : ''}"
                  @click=${() => this._updateOverride(defId, { visible: !binding.visible })}></button>
        </div>
        <div class="toggle-row">
          <span class="toggle-label">Required Override</span>
          <button class="toggle ${binding.requiredOverride ? 'toggle--on' : ''}"
                  @click=${() => this._updateOverride(defId, { requiredOverride: !binding.requiredOverride })}></button>
        </div>
        <div style="margin-top:8px; padding-top:8px; border-top:1px solid #F5F5F4;">
          <span class="override-label" style="display:block;margin-bottom:6px">Bar Config</span>
          <div class="toggle-row">
            <span class="toggle-label">Pinned to Bar</span>
            <button class="toggle ${bar.pinnedToBar ? 'toggle--on' : ''}"
                    @click=${() => this._updateOverride(defId, { barConfigOverride: { ...bar, pinnedToBar: !bar.pinnedToBar } })}></button>
          </div>
          <div class="toggle-row">
            <span class="toggle-label">Default Open</span>
            <button class="toggle ${bar.defaultOpen ? 'toggle--on' : ''}"
                    @click=${() => this._updateOverride(defId, { barConfigOverride: { ...bar, defaultOpen: !bar.defaultOpen } })}></button>
          </div>
          <div class="toggle-row">
            <span class="toggle-label">Show on Summary</span>
            <button class="toggle ${bar.showOnSummary ? 'toggle--on' : ''}"
                    @click=${() => this._updateOverride(defId, { barConfigOverride: { ...bar, showOnSummary: !bar.showOnSummary } })}></button>
          </div>
        </div>
      </div>
    `;
    }
};
__decorate([
    property({ type: Array })
], PhzFilterPicker.prototype, "definitions", void 0);
__decorate([
    property({ type: Array })
], PhzFilterPicker.prototype, "bindings", void 0);
__decorate([
    property({ type: String })
], PhzFilterPicker.prototype, "artefactId", void 0);
__decorate([
    state()
], PhzFilterPicker.prototype, "_search", void 0);
__decorate([
    state()
], PhzFilterPicker.prototype, "_checked", void 0);
__decorate([
    state()
], PhzFilterPicker.prototype, "_expandedOverrides", void 0);
PhzFilterPicker = __decorate([
    safeCustomElement('phz-filter-picker')
], PhzFilterPicker);
export { PhzFilterPicker };
//# sourceMappingURL=phz-filter-picker.js.map