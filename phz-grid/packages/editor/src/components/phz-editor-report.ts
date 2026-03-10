/**
 * @phozart/phz-editor — <phz-editor-report> (B-2.09)
 *
 * Report editing component. Provides column configuration,
 * filter management, sort setup, and preview mode.
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { ReportEditState } from '../screens/report-state.js';
import {
  createReportEditState,
  toggleReportPreview,
  setReportTitle,
} from '../screens/report-state.js';

@customElement('phz-editor-report')
export class PhzEditorReport extends LitElement {
  static override styles = css`
    :host { display: block; }
    .report-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }
    .report-title {
      font-size: 18px;
      font-weight: 600;
      border: none;
      background: transparent;
      flex: 1;
      padding: 4px;
    }
    .report-title:focus {
      outline: 2px solid var(--phz-primary, #3b82f6);
      border-radius: 4px;
    }
    .report-body {
      border: 1px solid var(--phz-border, #e5e7eb);
      border-radius: 8px;
      min-height: 300px;
      padding: 16px;
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

  @property({ type: String }) reportId = '';
  @property({ type: Boolean }) editMode = false;

  @state() private _state: ReportEditState = createReportEditState('');

  override willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (changed.has('reportId')) {
      this._state = createReportEditState(this.reportId);
    }
  }

  /** Get the current report state. */
  getState(): ReportEditState {
    return this._state;
  }

  private _onTitleChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    this._state = setReportTitle(this._state, input.value);
  }

  private _onTogglePreview(): void {
    this._state = toggleReportPreview(this._state);
    this.dispatchEvent(new CustomEvent('preview-toggle', {
      detail: { previewMode: this._state.previewMode },
      bubbles: true,
      composed: true,
    }));
  }

  override render() {
    return html`
      <div class="report-header">
        ${this.editMode
          ? html`<input
              class="report-title"
              type="text"
              .value=${this._state.title}
              @input=${this._onTitleChange}
              placeholder="Report title"
              aria-label="Report title"
            />`
          : html`<h2 class="report-title">${this._state.title || 'Untitled Report'}</h2>`}
        <button @click=${this._onTogglePreview}>
          ${this._state.previewMode ? 'Edit' : 'Preview'}
        </button>
      </div>

      <div class="report-body" role="region" aria-label="Report content">
        <slot name="columns"></slot>
        <slot name="filters"></slot>
        <slot name="preview"></slot>
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-editor-report': PhzEditorReport;
  }
}
