/**
 * @phozart/editor — <phz-sharing-flow> (B-2.11)
 *
 * Sharing workflow component. Manages visibility transitions
 * and share target selection.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createSharingFlowState, setTargetVisibility, canSaveSharing, } from '../authoring/sharing-state.js';
let PhzSharingFlow = class PhzSharingFlow extends LitElement {
    constructor() {
        super(...arguments);
        this.artifactId = '';
        this.visibility = 'personal';
        this.canPublish = false;
        this._state = createSharingFlowState('', 'personal');
    }
    static { this.styles = css `
    :host { display: block; }
    .sharing-section {
      margin-bottom: 16px;
    }
    .section-label {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .visibility-options {
      display: flex;
      gap: 8px;
    }
    .vis-option {
      padding: 8px 16px;
      border: 1px solid var(--phz-border, #e5e7eb);
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
    }
    .vis-option[data-selected] {
      background: var(--phz-primary, #3b82f6);
      color: white;
      border-color: var(--phz-primary, #3b82f6);
    }
    .vis-option:disabled {
      opacity: 0.5;
      cursor: default;
    }
    .share-targets {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 16px;
    }
    button {
      cursor: pointer;
      border: 1px solid var(--phz-border, #e5e7eb);
      background: var(--phz-surface, #ffffff);
      border-radius: 4px;
      padding: 6px 12px;
      font-size: 13px;
    }
  `; }
    willUpdate(changed) {
        if (changed.has('artifactId') || changed.has('visibility')) {
            this._state = createSharingFlowState(this.artifactId, this.visibility, {
                canPublish: this.canPublish,
            });
        }
        if (changed.has('canPublish')) {
            this._state = { ...this._state, canPublish: this.canPublish };
        }
    }
    /** Get the current sharing state. */
    getState() {
        return this._state;
    }
    _setVisibility(vis) {
        this._state = setTargetVisibility(this._state, vis);
    }
    _onSave() {
        if (!canSaveSharing(this._state))
            return;
        this.dispatchEvent(new CustomEvent('share-save', {
            detail: {
                visibility: this._state.targetVisibility,
                shareTargets: this._state.shareTargets,
            },
            bubbles: true,
            composed: true,
        }));
    }
    render() {
        const visOptions = ['personal', 'shared', 'published'];
        return html `
      <div class="sharing-section">
        <div class="section-label">Visibility</div>
        <div class="visibility-options" role="radiogroup" aria-label="Artifact visibility">
          ${visOptions.map(vis => html `
            <button
              class="vis-option"
              role="radio"
              ?data-selected=${this._state.targetVisibility === vis}
              aria-checked=${this._state.targetVisibility === vis}
              ?disabled=${vis === 'published' && !this._state.canPublish}
              @click=${() => this._setVisibility(vis)}
            >${vis}</button>
          `)}
        </div>
      </div>

      ${this._state.targetVisibility === 'shared'
            ? html `
          <div class="sharing-section">
            <div class="section-label">Share with</div>
            <div class="share-targets">
              <slot name="targets"></slot>
            </div>
          </div>`
            : nothing}

      <div class="footer">
        <button
          @click=${this._onSave}
          ?disabled=${!canSaveSharing(this._state)}
        >${this._state.saving ? 'Saving...' : 'Save'}</button>
      </div>
    `;
    }
};
__decorate([
    property({ type: String })
], PhzSharingFlow.prototype, "artifactId", void 0);
__decorate([
    property({ type: String })
], PhzSharingFlow.prototype, "visibility", void 0);
__decorate([
    property({ type: Boolean })
], PhzSharingFlow.prototype, "canPublish", void 0);
__decorate([
    state()
], PhzSharingFlow.prototype, "_state", void 0);
PhzSharingFlow = __decorate([
    customElement('phz-sharing-flow')
], PhzSharingFlow);
export { PhzSharingFlow };
//# sourceMappingURL=phz-sharing-flow.js.map