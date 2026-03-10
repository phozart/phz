/**
 * @phozart/phz-criteria — Filter Definition Admin
 *
 * Two-view admin component for managing artefact-independent filter definitions
 * and their bindings to artefacts. CSS prefix: phz-fda-
 *
 * @deprecated Use `<phz-filter-designer>` for definition management and
 * `<phz-filter-configurator>` for artefact binding. This component remains
 * functional for backward compatibility.
 *
 * Events:
 * - definition-create: { definition }
 * - definition-update: { id, patch }
 * - definition-deprecate: { id }
 * - binding-add: { filterDefinitionId, artefactId, order }
 * - binding-remove: { filterDefinitionId, artefactId }
 * - binding-update: { filterDefinitionId, artefactId, patch }
 */

import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import type {
  FilterDefinition, FilterDefinitionId, FilterBinding, ArtefactId,
  SelectionFieldType, SessionBehavior,
} from '@phozart/phz-core';
import { filterDefinitionId, artefactId } from '@phozart/phz-core';
import { criteriaStyles } from '@phozart/phz-criteria/shared-styles';

type AdminView = 'definitions' | 'bindings';

const FIELD_TYPES: { value: SelectionFieldType; label: string }[] = [
  { value: 'single_select', label: 'Single Select' },
  { value: 'multi_select', label: 'Multi Select' },
  { value: 'chip_group', label: 'Chip Group' },
  { value: 'text', label: 'Text' },
  { value: 'date_range', label: 'Date Range' },
  { value: 'numeric_range', label: 'Numeric Range' },
  { value: 'tree_select', label: 'Tree Select' },
  { value: 'search', label: 'Search' },
  { value: 'field_presence', label: 'Field Presence' },
];

@safeCustomElement('phz-filter-definition-admin')
export class PhzFilterDefinitionAdmin extends LitElement {
  static styles = [criteriaStyles, css`
    :host { display: block; height: 100%; }

    .phz-fda-root {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #FAFAF9;
      border: 1px solid #E7E5E4;
      border-radius: 12px;
      overflow: hidden;
    }

    .phz-fda-tabs {
      display: flex;
      border-bottom: 1px solid #E7E5E4;
      background: #FFFFFF;
    }

    .phz-fda-tab {
      flex: 1;
      padding: 10px 16px;
      font-size: 12px;
      font-weight: 500;
      color: #78716C;
      cursor: pointer;
      border: none;
      background: none;
      border-bottom: 2px solid transparent;
      text-align: center;
      font-family: inherit;
      transition: all 0.15s;
    }

    .phz-fda-tab:hover { color: #44403C; background: #FAFAF9; }
    .phz-fda-tab--active { color: #1C1917; border-bottom-color: #1C1917; }

    .phz-fda-body {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }

    .phz-fda-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .phz-fda-card {
      background: #FFFFFF;
      border: 1px solid #E7E5E4;
      border-radius: 10px;
      padding: 12px;
    }

    .phz-fda-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .phz-fda-card-label {
      font-size: 13px;
      font-weight: 600;
      color: #1C1917;
    }

    .phz-fda-card-type {
      font-size: 11px;
      color: #78716C;
      background: #F5F5F4;
      padding: 2px 8px;
      border-radius: 6px;
    }

    .phz-fda-card-meta {
      display: flex;
      gap: 8px;
      margin-top: 6px;
      font-size: 11px;
      color: #A8A29E;
    }

    .phz-fda-card-actions {
      display: flex;
      gap: 4px;
      margin-top: 8px;
    }

    .phz-fda-deprecated {
      opacity: 0.5;
    }

    .phz-fda-dep-badge {
      font-size: 10px;
      font-weight: 600;
      color: #DC2626;
      background: #FEF2F2;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .phz-fda-form {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 12px;
      background: #FFFFFF;
      border: 1px solid #E7E5E4;
      border-radius: 10px;
      margin-bottom: 12px;
    }

    .phz-fda-form-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .phz-fda-binding-card {
      background: #FFFFFF;
      border: 1px solid #E7E5E4;
      border-radius: 10px;
      padding: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .phz-fda-binding-order {
      font-size: 11px;
      font-weight: 700;
      color: #A8A29E;
      min-width: 20px;
      text-align: center;
    }

    .phz-fda-binding-info {
      flex: 1;
    }

    .phz-fda-binding-name {
      font-size: 13px;
      font-weight: 600;
      color: #1C1917;
    }

    .phz-fda-binding-override {
      font-size: 11px;
      color: #78716C;
      margin-top: 2px;
    }

    .phz-fda-empty {
      text-align: center;
      padding: 32px;
      color: #A8A29E;
      font-size: 13px;
    }
  `];

  @property({ type: Array }) definitions: FilterDefinition[] = [];
  @property({ type: Array }) bindings: FilterBinding[] = [];
  @property({ type: String }) artefactId: string = '';

  @state() private _view: AdminView = 'definitions';
  @state() private _editingId: string | null = null;
  @state() private _editingLabel = '';
  @state() private _showNewForm = false;
  private _deprecationWarned = false;

  connectedCallback(): void {
    super.connectedCallback();
    if (!this._deprecationWarned) {
      console.warn(
        '[phz-filter-definition-admin] Deprecated: use <phz-filter-designer> for definition management ' +
        'and <phz-filter-configurator> for artefact binding configuration.'
      );
      this._deprecationWarned = true;
    }
  }
  @state() private _newLabel = '';
  @state() private _newType: SelectionFieldType = 'single_select';
  @state() private _newSession: SessionBehavior = 'reset';

  render() {
    return html`
      <div class="phz-fda-root">
        <div class="phz-fda-tabs">
          <button class="phz-fda-tab ${this._view === 'definitions' ? 'phz-fda-tab--active' : ''}"
                  @click=${() => this._view = 'definitions'}>Definitions</button>
          <button class="phz-fda-tab ${this._view === 'bindings' ? 'phz-fda-tab--active' : ''}"
                  @click=${() => this._view = 'bindings'}>Bindings</button>
        </div>
        <div class="phz-fda-body">
          ${this._view === 'definitions' ? this._renderDefinitions() : this._renderBindings()}
        </div>
      </div>
    `;
  }

  private _renderDefinitions() {
    return html`
      ${this._showNewForm ? this._renderNewForm() : html`
        <button class="phz-sc-btn phz-sc-btn--primary" style="margin-bottom: 12px; width: 100%"
                @click=${() => this._showNewForm = true}>+ New Definition</button>
      `}
      <div class="phz-fda-list">
        ${(this.definitions ?? []).length === 0 ? html`<div class="phz-fda-empty">No filter definitions yet</div>` : nothing}
        ${(this.definitions ?? []).map(def => html`
          <div class="phz-fda-card ${def.deprecated ? 'phz-fda-deprecated' : ''}">
            <div class="phz-fda-card-header">
              ${this._editingId === def.id ? html`
                <input class="phz-sc-input" style="flex:1;font-size:13px;padding:2px 6px;"
                  .value=${this._editingLabel}
                  @input=${(e: Event) => this._editingLabel = (e.target as HTMLInputElement).value}
                  @keydown=${(e: KeyboardEvent) => {
                    if (e.key === 'Enter') this._commitLabelEdit(def.id);
                    if (e.key === 'Escape') { this._editingId = null; }
                  }}>
                <button class="phz-sc-btn" @click=${() => this._commitLabelEdit(def.id)}>Save</button>
                <button class="phz-sc-btn" @click=${() => { this._editingId = null; }}>Cancel</button>
              ` : html`
                <span class="phz-fda-card-label">${def.label}</span>
              `}
              <span class="phz-fda-card-type">${def.type}</span>
              ${def.deprecated ? html`<span class="phz-fda-dep-badge">Deprecated</span>` : nothing}
            </div>
            <div class="phz-fda-card-meta">
              <span>Session: ${def.sessionBehavior}</span>
              ${def.dataField ? html`<span>Field: ${def.dataField}</span>` : nothing}
              ${def.required ? html`<span style="color:#DC2626">Required</span>` : nothing}
            </div>
            <div class="phz-fda-card-actions">
              ${!def.deprecated ? html`
                <button class="phz-sc-btn" @click=${() => { this._editingId = def.id; this._editingLabel = def.label; }}>Edit</button>
                <button class="phz-sc-btn" style="color:#DC2626" @click=${() => this._dispatchEvent('definition-deprecate', { id: def.id })}>Deprecate</button>
              ` : nothing}
            </div>
          </div>
        `)}
      </div>
    `;
  }

  private _renderNewForm() {
    return html`
      <div class="phz-fda-form">
        <div class="phz-fda-form-row">
          <label class="phz-sc-field-label">Label</label>
          <input class="phz-sc-input" .value=${this._newLabel}
                 @input=${(e: Event) => this._newLabel = (e.target as HTMLInputElement).value}
                 placeholder="Filter label">
        </div>
        <div class="phz-fda-form-row">
          <label class="phz-sc-field-label">Type</label>
          <select class="phz-sc-select" .value=${this._newType}
                  @change=${(e: Event) => this._newType = (e.target as HTMLSelectElement).value as SelectionFieldType}>
            ${FIELD_TYPES.map(t => html`<option value=${t.value}>${t.label}</option>`)}
          </select>
        </div>
        <div class="phz-fda-form-row">
          <label class="phz-sc-field-label">Session Behavior</label>
          <select class="phz-sc-select" .value=${this._newSession}
                  @change=${(e: Event) => this._newSession = (e.target as HTMLSelectElement).value as SessionBehavior}>
            <option value="reset">Reset</option>
            <option value="persist">Persist</option>
          </select>
        </div>
        <div style="display:flex;gap:8px">
          <button class="phz-sc-btn phz-sc-btn--primary" @click=${this._createDefinition}>Create</button>
          <button class="phz-sc-btn" @click=${() => this._showNewForm = false}>Cancel</button>
        </div>
      </div>
    `;
  }

  private _renderBindings() {
    const artBindings = (this.bindings ?? [])
      .filter(b => !this.artefactId || b.artefactId === this.artefactId)
      .sort((a, b) => a.order - b.order);

    return html`
      <div class="phz-fda-list">
        ${artBindings.length === 0 ? html`<div class="phz-fda-empty">No bindings configured</div>` : nothing}
        ${artBindings.map((binding, idx) => {
          const def = (this.definitions ?? []).find(d => d.id === binding.filterDefinitionId);
          return html`
            <div class="phz-fda-binding-card">
              <span class="phz-fda-binding-order">${idx + 1}</span>
              <div class="phz-fda-binding-info">
                <div class="phz-fda-binding-name">${binding.labelOverride || def?.label || binding.filterDefinitionId}</div>
                <div class="phz-fda-binding-override">
                  ${!binding.visible ? 'Hidden' : 'Visible'}
                  ${binding.requiredOverride ? ' · Required' : ''}
                </div>
              </div>
              <button class="phz-sc-btn" style="color:#DC2626;font-size:11px"
                      @click=${() => this._dispatchEvent('binding-remove', { filterDefinitionId: binding.filterDefinitionId, artefactId: binding.artefactId })}>
                Remove
              </button>
            </div>
          `;
        })}
      </div>
    `;
  }

  private _commitLabelEdit(defId: string) {
    const label = this._editingLabel.trim().slice(0, 200);
    if (label) {
      this._dispatchEvent('definition-update', { id: defId, patch: { label } });
    }
    this._editingId = null;
  }

  private _createDefinition() {
    if (!this._newLabel.trim()) return;
    const now = Date.now();
    const def: FilterDefinition = {
      id: filterDefinitionId(this._newLabel.toLowerCase().replace(/\s+/g, '_')),
      label: this._newLabel,
      type: this._newType,
      sessionBehavior: this._newSession,
      createdAt: now,
      updatedAt: now,
    };
    this._dispatchEvent('definition-create', { definition: def });
    this._newLabel = '';
    this._newType = 'single_select';
    this._newSession = 'reset';
    this._showNewForm = false;
  }

  private _dispatchEvent(name: string, detail: Record<string, unknown>) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }
}
