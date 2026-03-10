/**
 * @phozart/phz-editor — <phz-measure-palette> (B-2.07)
 *
 * Measure registry palette component. Displays measures and KPIs
 * with search, category filtering, and drag-to-widget support.
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { MeasureDefinition, KPIDefinition } from '@phozart/phz-shared/adapters';
import type { MeasurePaletteState } from '../authoring/measure-palette-state.js';
import {
  createMeasurePaletteState,
  searchMeasures,
  filterByCategory,
  setActiveTab,
  selectPaletteItem,
} from '../authoring/measure-palette-state.js';

@customElement('phz-measure-palette')
export class PhzMeasurePalette extends LitElement {
  static override styles = css`
    :host { display: block; }
    .palette-header {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 12px;
    }
    .tabs {
      display: flex;
      gap: 4px;
    }
    .tab {
      padding: 6px 12px;
      border: 1px solid var(--phz-border, #e5e7eb);
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      background: var(--phz-surface, #ffffff);
    }
    .tab[data-active] {
      background: var(--phz-primary, #3b82f6);
      color: white;
      border-color: var(--phz-primary, #3b82f6);
    }
    input[type="search"] {
      width: 100%;
      padding: 6px 12px;
      border: 1px solid var(--phz-border, #e5e7eb);
      border-radius: 4px;
      font-size: 14px;
      box-sizing: border-box;
    }
    .item-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .palette-item {
      padding: 8px;
      border: 1px solid var(--phz-border, #e5e7eb);
      border-radius: 4px;
      cursor: grab;
      font-size: 13px;
    }
    .palette-item:hover {
      background: var(--phz-surface-hover, #f3f4f6);
    }
    .palette-item[data-selected] {
      outline: 2px solid var(--phz-primary, #3b82f6);
    }
    .item-name { font-weight: 600; }
    .item-meta {
      font-size: 11px;
      color: var(--phz-text-secondary, #6b7280);
    }
  `;

  @property({ type: Array }) measures: MeasureDefinition[] = [];
  @property({ type: Array }) kpis: KPIDefinition[] = [];

  @state() private _state: MeasurePaletteState = createMeasurePaletteState([], []);

  override willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (changed.has('measures') || changed.has('kpis')) {
      this._state = createMeasurePaletteState(this.measures, this.kpis);
    }
  }

  /** Get the current palette state. */
  getState(): MeasurePaletteState {
    return this._state;
  }

  private _onSearch(e: Event): void {
    const input = e.target as HTMLInputElement;
    this._state = searchMeasures(this._state, input.value);
  }

  private _onTabChange(tab: 'measures' | 'kpis'): void {
    this._state = setActiveTab(this._state, tab);
  }

  private _onItemClick(id: string, type: 'measure' | 'kpi'): void {
    this._state = selectPaletteItem(this._state, id, type);
    this.dispatchEvent(new CustomEvent('item-select', {
      detail: { id, type },
      bubbles: true,
      composed: true,
    }));
  }

  override render() {
    const items = this._state.activeTab === 'measures'
      ? this._state.filteredMeasures
      : this._state.filteredKPIs;

    return html`
      <div class="palette-header">
        <div class="tabs" role="tablist">
          <button
            class="tab"
            role="tab"
            ?data-active=${this._state.activeTab === 'measures'}
            aria-selected=${this._state.activeTab === 'measures'}
            @click=${() => this._onTabChange('measures')}
          >Measures (${this._state.filteredMeasures.length})</button>
          <button
            class="tab"
            role="tab"
            ?data-active=${this._state.activeTab === 'kpis'}
            aria-selected=${this._state.activeTab === 'kpis'}
            @click=${() => this._onTabChange('kpis')}
          >KPIs (${this._state.filteredKPIs.length})</button>
        </div>
        <input
          type="search"
          placeholder="Search..."
          .value=${this._state.searchQuery}
          @input=${this._onSearch}
          aria-label="Search measures and KPIs"
        />
      </div>

      <div class="item-list" role="listbox" aria-label=${this._state.activeTab}>
        ${(items as Array<MeasureDefinition | KPIDefinition>).map(item => html`
          <div
            class="palette-item"
            role="option"
            tabindex="0"
            ?data-selected=${this._state.selectedItemId === item.id}
            aria-selected=${this._state.selectedItemId === item.id}
            @click=${() => this._onItemClick(item.id, this._state.activeTab === 'measures' ? 'measure' : 'kpi')}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                this._onItemClick(item.id, this._state.activeTab === 'measures' ? 'measure' : 'kpi');
              }
            }}
            draggable="true"
            @dragstart=${(e: DragEvent) => {
              e.dataTransfer?.setData('application/json', JSON.stringify({
                id: item.id,
                type: this._state.activeTab === 'measures' ? 'measure' : 'kpi',
              }));
            }}
          >
            <div class="item-name">${item.name}</div>
            ${item.description
              ? html`<div class="item-meta">${item.description}</div>`
              : nothing}
          </div>
        `)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-measure-palette': PhzMeasurePalette;
  }
}
