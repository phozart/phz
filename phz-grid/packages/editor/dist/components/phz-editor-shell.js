/**
 * @phozart/editor — <phz-editor-shell> (B-2.02)
 *
 * Top-level Web Component for the editor shell. Manages screen
 * routing, toolbar, breadcrumbs, and delegates to child screen
 * components. All logic lives in the headless state machine;
 * this component is a thin Lit rendering layer.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createEditorShellState, navigateTo, navigateBack, navigateForward, toggleEditMode, canGoBack, canGoForward, } from '../editor-state.js';
import { buildBreadcrumbs } from '../editor-navigation.js';
let PhzEditorShell = class PhzEditorShell extends LitElement {
    constructor() {
        super(...arguments);
        this.theme = 'auto';
        this.locale = 'en';
        this._state = createEditorShellState();
    }
    static { this.styles = css `
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
  `; }
    /** Navigate to a screen. Dispatches a screen-change event. */
    navigate(screen, artifactId, artifactType) {
        this._state = navigateTo(this._state, screen, artifactId, artifactType);
        this._dispatchScreenChange();
    }
    /** Go back in navigation history. */
    goBack() {
        this._state = navigateBack(this._state);
        this._dispatchScreenChange();
    }
    /** Go forward in navigation history. */
    goForward() {
        this._state = navigateForward(this._state);
        this._dispatchScreenChange();
    }
    /** Toggle editing mode. */
    toggleEdit() {
        this._state = toggleEditMode(this._state);
        this.dispatchEvent(new CustomEvent('edit-mode-change', {
            detail: { editMode: this._state.editMode },
            bubbles: true,
            composed: true,
        }));
    }
    /** Get the current shell state. */
    getState() {
        return this._state;
    }
    _dispatchScreenChange() {
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
    render() {
        const crumbs = buildBreadcrumbs(this._state.navigationHistory, this._state.historyIndex);
        return html `
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
          ${crumbs.map((crumb, i) => html `
            ${i > 0 ? html `<span class="breadcrumb-separator" aria-hidden="true">/</span>` : nothing}
            <span
              class=${crumb.active ? 'breadcrumb-active' : ''}
              role=${crumb.active ? 'text' : 'link'}
              @click=${crumb.active ? nothing : () => this.navigate(crumb.screen, crumb.artifactId)}
            >${crumb.label}</span>
          `)}
        </nav>

        ${this._state.currentScreen === 'dashboard-view' || this._state.currentScreen === 'report'
            ? html `<button @click=${this.toggleEdit}>
              ${this._state.editMode ? 'View' : 'Edit'}
            </button>`
            : nothing}

        ${this._state.unsavedChanges
            ? html `<span aria-live="polite">Unsaved changes</span>`
            : nothing}
      </div>

      <div class="shell-content">
        <slot name=${this._state.currentScreen}></slot>
        <slot></slot>
      </div>
    `;
    }
};
__decorate([
    property({ type: String })
], PhzEditorShell.prototype, "theme", void 0);
__decorate([
    property({ type: String })
], PhzEditorShell.prototype, "locale", void 0);
__decorate([
    state()
], PhzEditorShell.prototype, "_state", void 0);
PhzEditorShell = __decorate([
    customElement('phz-editor-shell')
], PhzEditorShell);
export { PhzEditorShell };
//# sourceMappingURL=phz-editor-shell.js.map