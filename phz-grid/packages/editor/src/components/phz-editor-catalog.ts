/**
 * @phozart/phz-editor — <phz-editor-catalog> (B-2.04)
 *
 * Catalog screen component for the editor. Displays artifacts
 * with search, filtering, sorting, and creation actions.
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { CatalogItem, CatalogState } from '../screens/catalog-state.js';
import {
  createCatalogState,
  searchCatalog,
  filterCatalogByType,
  sortCatalog,
  openCreateDialog,
  closeCreateDialog,
} from '../screens/catalog-state.js';
import type { ArtifactType } from '@phozart/phz-shared/artifacts';

@customElement('phz-editor-catalog')
export class PhzEditorCatalog extends LitElement {
  static override styles = css`
    :host { display: block; }
    .catalog-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }
    .catalog-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }
    .catalog-card {
      border: 1px solid var(--phz-border, #e5e7eb);
      border-radius: 8px;
      padding: 16px;
      cursor: pointer;
      transition: box-shadow 0.15s;
    }
    .catalog-card:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .card-title {
      font-weight: 600;
      margin-bottom: 4px;
    }
    .card-meta {
      font-size: 12px;
      color: var(--phz-text-secondary, #6b7280);
    }
    input[type="search"] {
      flex: 1;
      padding: 6px 12px;
      border: 1px solid var(--phz-border, #e5e7eb);
      border-radius: 4px;
      font-size: 14px;
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

  @property({ type: Array }) items: CatalogItem[] = [];

  @state() private _state: CatalogState = createCatalogState();

  override willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (changed.has('items')) {
      this._state = createCatalogState(this.items);
    }
  }

  /** Get the current catalog state. */
  getState(): CatalogState {
    return this._state;
  }

  private _onSearch(e: Event): void {
    const input = e.target as HTMLInputElement;
    this._state = searchCatalog(this._state, input.value);
  }

  private _onTypeFilter(type: ArtifactType | null): void {
    this._state = filterCatalogByType(this._state, type);
  }

  private _onCardClick(item: CatalogItem): void {
    this.dispatchEvent(new CustomEvent('artifact-select', {
      detail: { id: item.id, type: item.type },
      bubbles: true,
      composed: true,
    }));
  }

  private _onCreate(type: ArtifactType): void {
    this._state = openCreateDialog(this._state, type);
    this.dispatchEvent(new CustomEvent('create-artifact', {
      detail: { type },
      bubbles: true,
      composed: true,
    }));
  }

  override render() {
    return html`
      <div class="catalog-header">
        <input
          type="search"
          placeholder="Search artifacts..."
          .value=${this._state.searchQuery}
          @input=${this._onSearch}
          aria-label="Search artifacts"
        />
        <button @click=${() => this._onCreate('dashboard')}>New Dashboard</button>
        <button @click=${() => this._onCreate('report')}>New Report</button>
      </div>

      ${this._state.loading
        ? html`<div role="status" aria-label="Loading">Loading...</div>`
        : nothing}

      <div class="catalog-grid" role="list">
        ${this._state.filteredItems.map(item => html`
          <div
            class="catalog-card"
            role="listitem"
            tabindex="0"
            @click=${() => this._onCardClick(item)}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') this._onCardClick(item);
            }}
          >
            <div class="card-title">${item.name}</div>
            <div class="card-meta">${item.type} &middot; ${item.visibility}</div>
            ${item.description
              ? html`<div class="card-meta">${item.description}</div>`
              : nothing}
          </div>
        `)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-editor-catalog': PhzEditorCatalog;
  }
}
