/**
 * @phozart/phz-editor — <phz-editor-shell> (B-2.02)
 *
 * Top-level Web Component for the editor shell. Manages screen
 * routing, toolbar, breadcrumbs, and delegates to child screen
 * components. All logic lives in the headless state machine;
 * this component is a thin Lit rendering layer.
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { EditorShellState, EditorScreen } from '../editor-state.js';
import {
  createEditorShellState,
  navigateTo,
  navigateBack,
  navigateForward,
  toggleEditMode,
  canGoBack,
  canGoForward,
} from '../editor-state.js';
import { buildBreadcrumbs } from '../editor-navigation.js';

@customElement('phz-editor-shell')
export class PhzEditorShell extends LitElement {
  static override styles = css`
    :host {
      display: block;
      min-height: 100vh;
      font-family: var(--phz-font-family, system-ui, -apple-system, sans-serif);
    }
    .shell-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-bottom: 1px solid var(--phz-border, #e5e7eb);
      background: var(--phz-surface, #ffffff);
    }
    .breadcrumbs {
      display: flex;
      align-items: center;
      gap: 4px;
      flex: 1;
      font-size: 14px;
    }
    .breadcrumb-separator {
      color: var(--phz-text-secondary, #6b7280);
    }
    .breadcrumb-active {
      font-weight: 600;
    }
    .shell-content {
      padding: 16px;
    }
    button {
      cursor: pointer;
      border: 1px solid var(--phz-border, #e5e7eb);
      background: var(--phz-surface, #ffffff);
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 13px;
    }
    button:disabled {
      opacity: 0.5;
      cursor: default;
    }
  `;

  @property({ type: String }) theme = 'auto';
  @property({ type: String }) locale = 'en';

  @state() private _state: EditorShellState = createEditorShellState();

  /** Navigate to a screen. Dispatches a screen-change event. */
  navigate(screen: EditorScreen, artifactId?: string, artifactType?: string): void {
    this._state = navigateTo(this._state, screen, artifactId, artifactType);
    this._dispatchScreenChange();
  }

  /** Go back in navigation history. */
  goBack(): void {
    this._state = navigateBack(this._state);
    this._dispatchScreenChange();
  }

  /** Go forward in navigation history. */
  goForward(): void {
    this._state = navigateForward(this._state);
    this._dispatchScreenChange();
  }

  /** Toggle editing mode. */
  toggleEdit(): void {
    this._state = toggleEditMode(this._state);
    this.dispatchEvent(new CustomEvent('edit-mode-change', {
      detail: { editMode: this._state.editMode },
      bubbles: true,
      composed: true,
    }));
  }

  /** Get the current shell state. */
  getState(): EditorShellState {
    return this._state;
  }

  private _dispatchScreenChange(): void {
    this.dispatchEvent(new CustomEvent('screen-change', {
      detail: {
        screen: this._state.currentScreen,
        artifactId: this._state.activeArtifactId,
        artifactType: this._state.activeArtifactType,
      },
      bubbles: true,
      composed: true,
    }));
  }

  override render() {
    const crumbs = buildBreadcrumbs(
      this._state.navigationHistory,
      this._state.historyIndex,
    );

    return html`
      <div class="shell-header">
        <button
          @click=${this.goBack}
          ?disabled=${!canGoBack(this._state)}
          aria-label="Go back"
        >&#8592;</button>
        <button
          @click=${this.goForward}
          ?disabled=${!canGoForward(this._state)}
          aria-label="Go forward"
        >&#8594;</button>

        <nav class="breadcrumbs" aria-label="Breadcrumbs">
          ${crumbs.map((crumb, i) => html`
            ${i > 0 ? html`<span class="breadcrumb-separator" aria-hidden="true">/</span>` : nothing}
            <span
              class=${crumb.active ? 'breadcrumb-active' : ''}
              role=${crumb.active ? 'text' : 'link'}
              @click=${crumb.active ? nothing : () => this.navigate(crumb.screen, crumb.artifactId)}
            >${crumb.label}</span>
          `)}
        </nav>

        ${this._state.currentScreen === 'dashboard-view' || this._state.currentScreen === 'report'
          ? html`<button @click=${this.toggleEdit}>
              ${this._state.editMode ? 'View' : 'Edit'}
            </button>`
          : nothing}

        ${this._state.unsavedChanges
          ? html`<span aria-live="polite">Unsaved changes</span>`
          : nothing}
      </div>

      <div class="shell-content">
        <slot name=${this._state.currentScreen}></slot>
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-editor-shell': PhzEditorShell;
  }
}
