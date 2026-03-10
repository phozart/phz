/**
 * @phozart/phz-criteria — Preset Manager
 *
 * List, save, load, delete, and set default presets.
 * Supports personal + shared scopes with owner-based editing.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { criteriaStyles } from '../shared-styles.js';
let PhzPresetManager = class PhzPresetManager extends LitElement {
    constructor() {
        super(...arguments);
        this.presets = [];
        this.currentUserId = '';
        this._open = false;
        this._showSave = false;
        this._saveName = '';
        this._saveScope = 'personal';
    }
    static { this.styles = [criteriaStyles, css `
    :host { position: relative; }
    .phz-sc-pm-popup {
      position: absolute; bottom: 100%; right: 0; margin-bottom: 4px;
      z-index: 100; background: #FFF; border: 1px solid #E7E5E4;
      border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      min-width: 280px; max-height: 400px; overflow-y: auto;
    }
    .phz-sc-pm-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 12px; border-bottom: 1px solid #E7E5E4;
      font-size: 12px; font-weight: 600; color: #44403C;
    }
    .phz-sc-pm-list { padding: 4px 0; }
    .phz-sc-pm-item {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 12px; cursor: pointer; font-size: 13px;
    }
    .phz-sc-pm-item:hover { background: #F5F5F4; }
    .phz-sc-pm-item-name { flex: 1; }
    .phz-sc-pm-item-default { font-size: 10px; color: #059669; font-weight: 600; }
    .phz-sc-pm-actions { display: flex; gap: 4px; }
    .phz-sc-pm-action {
      padding: 2px 6px; border: none; background: none; cursor: pointer;
      font-size: 11px; color: #78716C; border-radius: 4px;
    }
    .phz-sc-pm-action:hover { background: #E7E5E4; color: #1C1917; }
    .phz-sc-pm-action--danger:hover { background: #FEE2E2; color: #DC2626; }
    .phz-sc-pm-save-form {
      padding: 12px; border-top: 1px solid #E7E5E4;
      display: flex; flex-direction: column; gap: 8px;
    }
    .phz-sc-pm-scope-row { display: flex; gap: 8px; align-items: center; font-size: 12px; }
    .phz-sc-pm-scope-row label { display: flex; align-items: center; gap: 4px; cursor: pointer; }
  `]; }
    _toggle() { this._open = !this._open; this._showSave = false; }
    _canEdit(preset) {
        return preset.owner === this.currentUserId;
    }
    _loadPreset(preset) {
        this.dispatchEvent(new CustomEvent('preset-load', {
            detail: { preset }, bubbles: true, composed: true,
        }));
        this._open = false;
    }
    _deletePreset(preset, e) {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('preset-delete', {
            detail: { presetId: preset.id }, bubbles: true, composed: true,
        }));
    }
    _setDefault(preset, e) {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('preset-set-default', {
            detail: { presetId: preset.id }, bubbles: true, composed: true,
        }));
    }
    _openSave() { this._showSave = true; }
    _doSave() {
        if (!this._saveName.trim())
            return;
        this.dispatchEvent(new CustomEvent('preset-save', {
            detail: { name: this._saveName.trim(), scope: this._saveScope },
            bubbles: true, composed: true,
        }));
        this._saveName = '';
        this._showSave = false;
        this._open = false;
    }
    render() {
        return html `
      <button class="phz-sc-btn phz-sc-btn--ghost" @click=${this._toggle}>
        <svg width="14" height="14" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><rect x="40" y="40" width="176" height="176" rx="8"/><line x1="88" y1="104" x2="168" y2="104"/><line x1="88" y1="136" x2="168" y2="136"/><line x1="88" y1="168" x2="136" y2="168"/></svg>
        Presets${(this.presets ?? []).length > 0 ? ` (${(this.presets ?? []).length})` : ''}
      </button>

      ${this._open ? html `
        <div class="phz-sc-pm-popup">
          <div class="phz-sc-pm-header">
            <span>Saved Presets</span>
            <button class="phz-sc-btn" style="font-size:11px; padding:4px 8px" @click=${this._openSave}>+ Save Current</button>
          </div>

          ${(this.presets ?? []).length === 0 ? html `
            <div style="padding:16px; text-align:center; font-size:12px; color:#A8A29E">No presets saved</div>
          ` : html `
            <div class="phz-sc-pm-list">
              ${(this.presets ?? []).map(p => html `
                <div class="phz-sc-pm-item" @click=${() => this._loadPreset(p)}>
                  <span class="phz-sc-preset-badge phz-sc-preset-badge--${p.scope}">${p.scope}</span>
                  <span class="phz-sc-pm-item-name">${p.name}</span>
                  ${p.isDefault ? html `<span class="phz-sc-pm-item-default">DEFAULT</span>` : nothing}
                  <div class="phz-sc-pm-actions">
                    ${!p.isDefault ? html `
                      <button class="phz-sc-pm-action" @click=${(e) => this._setDefault(p, e)} title="Set as default"><svg width="12" height="12" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="20" stroke-linejoin="round"><polygon points="128,24 160,96 240,104 176,160 196,240 128,200 60,240 80,160 16,104 96,96"/></svg></button>
                    ` : nothing}
                    ${this._canEdit(p) ? html `
                      <button class="phz-sc-pm-action phz-sc-pm-action--danger" @click=${(e) => this._deletePreset(p, e)} title="Delete"><svg width="12" height="12" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="24" stroke-linecap="round"><line x1="64" y1="64" x2="192" y2="192"/><line x1="192" y1="64" x2="64" y2="192"/></svg></button>
                    ` : nothing}
                  </div>
                </div>
              `)}
            </div>
          `}

          ${this._showSave ? html `
            <div class="phz-sc-pm-save-form">
              <input
                class="phz-sc-input"
                type="text"
                placeholder="Preset name..."
                .value=${this._saveName}
                @input=${(e) => { this._saveName = e.target.value; }}
              />
              <div class="phz-sc-pm-scope-row">
                <label>
                  <input type="radio" name="scope" value="personal"
                    ?checked=${this._saveScope === 'personal'}
                    @change=${() => { this._saveScope = 'personal'; }}
                  /> Personal
                </label>
                <label>
                  <input type="radio" name="scope" value="shared"
                    ?checked=${this._saveScope === 'shared'}
                    @change=${() => { this._saveScope = 'shared'; }}
                  /> Shared
                </label>
              </div>
              <button class="phz-sc-btn phz-sc-btn--primary" @click=${this._doSave}>Save</button>
            </div>
          ` : nothing}
        </div>
      ` : nothing}
    `;
    }
};
__decorate([
    property({ type: Array })
], PhzPresetManager.prototype, "presets", void 0);
__decorate([
    property({ type: String })
], PhzPresetManager.prototype, "currentUserId", void 0);
__decorate([
    state()
], PhzPresetManager.prototype, "_open", void 0);
__decorate([
    state()
], PhzPresetManager.prototype, "_showSave", void 0);
__decorate([
    state()
], PhzPresetManager.prototype, "_saveName", void 0);
__decorate([
    state()
], PhzPresetManager.prototype, "_saveScope", void 0);
PhzPresetManager = __decorate([
    customElement('phz-preset-manager')
], PhzPresetManager);
export { PhzPresetManager };
//# sourceMappingURL=phz-preset-manager.js.map