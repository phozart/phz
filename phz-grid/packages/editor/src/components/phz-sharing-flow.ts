/**
 * @phozart/editor — <phz-sharing-flow> (B-2.11)
 *
 * Sharing workflow component. Manages visibility transitions
 * and share target selection.
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { ArtifactVisibility } from '@phozart/shared/artifacts';
import type { SharingFlowState } from '../authoring/sharing-state.js';
import {
  createSharingFlowState,
  setTargetVisibility,
  canSaveSharing,
} from '../authoring/sharing-state.js';

@customElement('phz-sharing-flow')
export class PhzSharingFlow extends LitElement {
  static override styles = css`
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
  `;

  @property({ type: String }) artifactId = '';
  @property({ type: String }) visibility: ArtifactVisibility = 'personal';
  @property({ type: Boolean }) canPublish = false;

  @state() private _state: SharingFlowState = createSharingFlowState('', 'personal');

  override willUpdate(changed: Map<PropertyKey, unknown>): void {
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
  getState(): SharingFlowState {
    return this._state;
  }

  private _setVisibility(vis: ArtifactVisibility): void {
    this._state = setTargetVisibility(this._state, vis);
  }

  private _onSave(): void {
    if (!canSaveSharing(this._state)) return;
    this.dispatchEvent(new CustomEvent('share-save', {
      detail: {
        visibility: this._state.targetVisibility,
        shareTargets: this._state.shareTargets,
      },
      bubbles: true,
      composed: true,
    }));
  }

  override render() {
    const visOptions: ArtifactVisibility[] = ['personal', 'shared', 'published'];

    return html`
      <div class="sharing-section">
        <div class="section-label">Visibility</div>
        <div class="visibility-options" role="radiogroup" aria-label="Artifact visibility">
          ${visOptions.map(vis => html`
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
        ? html`
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
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-sharing-flow': PhzSharingFlow;
  }
}
