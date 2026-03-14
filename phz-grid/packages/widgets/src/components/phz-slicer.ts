/**
 * @phozart/widgets — Slicer
 *
 * Interactive filter slicer for dashboards. Supports multi-select (checkboxes),
 * single-select (radio buttons), range (min/max inputs), and chips layouts.
 * Emits `slicer-change` CustomEvent with `{ field, values }` detail.
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { widgetBaseStyles } from '../shared-styles.js';

export interface SlicerItem {
  value: unknown;
  label: string;
  count?: number;
}

/** Detail payload emitted by the `slicer-change` event. */
export interface SlicerChangeDetail {
  field: string;
  values: unknown[];
}

// --- Pure helper functions (exported for testing) ---

/** Filter items whose label contains the search term (case-insensitive). */
export function filterItems(items: SlicerItem[], search: string): SlicerItem[] {
  if (!search) return items;
  const lower = search.toLowerCase();
  return items.filter(item => item.label.toLowerCase().includes(lower));
}

/** Toggle a value in a multi-select array: add if absent, remove if present. */
export function toggleMultiValue(current: unknown[], value: unknown): unknown[] {
  const idx = current.indexOf(value);
  if (idx >= 0) {
    return [...current.slice(0, idx), ...current.slice(idx + 1)];
  }
  return [...current, value];
}

/** Select all item values. */
export function selectAll(items: SlicerItem[]): unknown[] {
  return items.map(item => item.value);
}

/** Clear all selections. */
export function selectNone(): unknown[] {
  return [];
}

/** Clamp a range value between min and max of available numeric items. */
export function clampRange(
  value: number,
  items: SlicerItem[],
  bound: 'min' | 'max',
): number {
  const nums = items
    .map(i => Number(i.value))
    .filter(n => !Number.isNaN(n));
  if (nums.length === 0) return value;
  const lo = Math.min(...nums);
  const hi = Math.max(...nums);
  if (bound === 'min') return Math.max(lo, Math.min(value, hi));
  return Math.min(hi, Math.max(value, lo));
}

/** Build the range values array [min, max] from current selection or item bounds. */
export function buildRangeValues(
  selectedValues: unknown[],
  items: SlicerItem[],
): [number, number] {
  const nums = items
    .map(i => Number(i.value))
    .filter(n => !Number.isNaN(n));
  const lo = nums.length > 0 ? Math.min(...nums) : 0;
  const hi = nums.length > 0 ? Math.max(...nums) : 0;

  if (
    selectedValues.length === 2 &&
    typeof selectedValues[0] === 'number' &&
    typeof selectedValues[1] === 'number'
  ) {
    return [selectedValues[0], selectedValues[1]];
  }
  return [lo, hi];
}

@customElement('phz-slicer')
export class PhzSlicer extends LitElement {
  static styles = [
    widgetBaseStyles,
    css`
      :host {
        display: block;
        container-type: inline-size;
      }

      .slicer {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .slicer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .slicer-actions {
        display: flex;
        gap: 4px;
      }

      .slicer-actions button {
        padding: 2px 8px;
        border: 1px solid var(--phz-w-border, #D6D3D1);
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        background: var(--phz-w-bg, #FFFFFF);
        color: var(--phz-w-text-secondary, #44403C);
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .slicer-actions button:hover {
        background: var(--phz-w-surface, #FAFAF9);
        border-color: var(--phz-w-text-muted, #A8A29E);
      }

      .slicer-actions button:focus-visible {
        outline: 2px solid #3B82F6;
        outline-offset: 2px;
      }

      .slicer-search {
        padding: 6px 10px;
        border: 1px solid var(--phz-w-border, #E7E5E4);
        border-radius: 6px;
        font-size: 13px;
        font-family: inherit;
        background: var(--phz-w-bg, #FFFFFF);
        color: var(--phz-w-text, #1C1917);
        width: 100%;
        transition: border-color 0.15s ease;
      }

      .slicer-search:focus {
        outline: none;
        border-color: #3B82F6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
      }

      .slicer-search::placeholder {
        color: var(--phz-w-text-muted, #A8A29E);
      }

      /* Vertical list layout */
      .slicer-list--vertical {
        display: flex;
        flex-direction: column;
        gap: 2px;
        max-height: 240px;
        overflow-y: auto;
      }

      /* Horizontal list layout */
      .slicer-list--horizontal {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      /* Chips layout */
      .slicer-list--chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      /* List item (checkbox / radio row) */
      .slicer-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 13px;
        color: var(--phz-w-text, #1C1917);
        cursor: pointer;
        transition: background 0.1s ease;
        user-select: none;
      }

      .slicer-item:hover {
        background: var(--phz-w-surface, #FAFAF9);
      }

      .slicer-item input[type="checkbox"],
      .slicer-item input[type="radio"] {
        accent-color: #3B82F6;
        margin: 0;
        cursor: pointer;
      }

      .slicer-item__label {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .slicer-item__count {
        font-size: 11px;
        color: var(--phz-w-text-muted, #78716C);
        background: var(--phz-w-surface, #F5F5F4);
        padding: 1px 6px;
        border-radius: 8px;
        font-weight: 500;
      }

      /* Chip toggle buttons */
      .slicer-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 12px;
        border: 1px solid var(--phz-w-border, #E7E5E4);
        border-radius: 16px;
        font-size: 13px;
        font-weight: 500;
        background: var(--phz-w-bg, #FFFFFF);
        color: var(--phz-w-text, #1C1917);
        cursor: pointer;
        transition: all 0.15s ease;
        user-select: none;
      }

      .slicer-chip:hover {
        border-color: #3B82F6;
      }

      .slicer-chip:focus-visible {
        outline: 2px solid #3B82F6;
        outline-offset: 2px;
      }

      .slicer-chip--selected {
        background: #3B82F6;
        color: #FFFFFF;
        border-color: #3B82F6;
      }

      .slicer-chip--selected:hover {
        background: #2563EB;
        border-color: #2563EB;
      }

      .slicer-chip__count {
        font-size: 11px;
        opacity: 0.8;
      }

      /* Range mode */
      .slicer-range {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .slicer-range__input {
        flex: 1;
        padding: 6px 10px;
        border: 1px solid var(--phz-w-border, #E7E5E4);
        border-radius: 6px;
        font-size: 13px;
        font-family: inherit;
        background: var(--phz-w-bg, #FFFFFF);
        color: var(--phz-w-text, #1C1917);
        width: 80px;
        min-width: 0;
      }

      .slicer-range__input:focus {
        outline: none;
        border-color: #3B82F6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
      }

      .slicer-range__sep {
        font-size: 13px;
        color: var(--phz-w-text-muted, #78716C);
        white-space: nowrap;
      }

      .slicer-empty {
        font-size: 13px;
        color: var(--phz-w-text-muted, #78716C);
        padding: 8px;
        text-align: center;
      }
    `,
  ];

  @property({ type: String }) field: string = '';
  @property({ type: String }) label: string = '';
  @property({ type: Array }) items: SlicerItem[] = [];
  @property({ type: Array }) selectedValues: unknown[] = [];
  @property({ type: String }) mode: 'multi' | 'single' | 'range' = 'multi';
  @property({ type: Boolean }) showSearch: boolean = false;
  @property({ type: Boolean }) showCounts: boolean = false;
  @property({ type: String }) layout: 'vertical' | 'horizontal' | 'chips' = 'vertical';

  @state() private searchTerm: string = '';

  private get filteredItems(): SlicerItem[] {
    return filterItems(this.items, this.searchTerm);
  }

  private emitChange(values: unknown[]): void {
    this.dispatchEvent(
      new CustomEvent<SlicerChangeDetail>('slicer-change', {
        detail: { field: this.field, values },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleMultiToggle(value: unknown): void {
    const next = toggleMultiValue(this.selectedValues, value);
    this.emitChange(next);
  }

  private handleSingleSelect(value: unknown): void {
    this.emitChange([value]);
  }

  private handleSelectAll(): void {
    this.emitChange(selectAll(this.items));
  }

  private handleSelectNone(): void {
    this.emitChange(selectNone());
  }

  private handleRangeChange(bound: 'min' | 'max', raw: string): void {
    const num = Number(raw);
    if (Number.isNaN(num)) return;
    const clamped = clampRange(num, this.items, bound);
    const [curMin, curMax] = buildRangeValues(this.selectedValues, this.items);
    if (bound === 'min') {
      this.emitChange([Math.min(clamped, curMax), curMax]);
    } else {
      this.emitChange([curMin, Math.max(clamped, curMin)]);
    }
  }

  private handleSearchInput(e: Event): void {
    this.searchTerm = (e.target as HTMLInputElement).value;
  }

  private handleChipToggle(value: unknown): void {
    if (this.mode === 'single') {
      this.handleSingleSelect(value);
    } else {
      this.handleMultiToggle(value);
    }
  }

  private isSelected(value: unknown): boolean {
    return this.selectedValues.includes(value);
  }

  private renderSearch() {
    if (!this.showSearch) return nothing;
    return html`
      <input
        class="slicer-search"
        type="text"
        placeholder="Search..."
        .value=${this.searchTerm}
        @input=${this.handleSearchInput}
        aria-label="Filter slicer items"
      />
    `;
  }

  private renderCount(item: SlicerItem) {
    if (!this.showCounts || item.count === undefined) return nothing;
    return html`<span class="slicer-item__count">${item.count}</span>`;
  }

  private renderChipCount(item: SlicerItem) {
    if (!this.showCounts || item.count === undefined) return nothing;
    return html`<span class="slicer-chip__count">(${item.count})</span>`;
  }

  private renderMultiList() {
    const visibleItems = this.filteredItems;
    if (visibleItems.length === 0) {
      return html`<div class="slicer-empty">No matching items</div>`;
    }
    return html`
      <div class="slicer-list--${this.layout}" role="group" aria-label="${this.label || this.field}">
        ${visibleItems.map(
          item => html`
            <label class="slicer-item">
              <input
                type="checkbox"
                .checked=${this.isSelected(item.value)}
                @change=${() => this.handleMultiToggle(item.value)}
              />
              <span class="slicer-item__label">${item.label}</span>
              ${this.renderCount(item)}
            </label>
          `,
        )}
      </div>
    `;
  }

  private renderSingleList() {
    const visibleItems = this.filteredItems;
    if (visibleItems.length === 0) {
      return html`<div class="slicer-empty">No matching items</div>`;
    }
    return html`
      <div class="slicer-list--${this.layout}" role="radiogroup" aria-label="${this.label || this.field}">
        ${visibleItems.map(
          item => html`
            <label class="slicer-item">
              <input
                type="radio"
                name="${this.field}-slicer"
                .checked=${this.isSelected(item.value)}
                @change=${() => this.handleSingleSelect(item.value)}
              />
              <span class="slicer-item__label">${item.label}</span>
              ${this.renderCount(item)}
            </label>
          `,
        )}
      </div>
    `;
  }

  private renderChips() {
    const visibleItems = this.filteredItems;
    if (visibleItems.length === 0) {
      return html`<div class="slicer-empty">No matching items</div>`;
    }
    return html`
      <div class="slicer-list--chips" role="group" aria-label="${this.label || this.field}">
        ${visibleItems.map(
          item => html`
            <button
              class="slicer-chip ${this.isSelected(item.value) ? 'slicer-chip--selected' : ''}"
              @click=${() => this.handleChipToggle(item.value)}
              aria-pressed=${this.isSelected(item.value) ? 'true' : 'false'}
            >
              ${item.label}
              ${this.renderChipCount(item)}
            </button>
          `,
        )}
      </div>
    `;
  }

  private renderRange() {
    const [curMin, curMax] = buildRangeValues(this.selectedValues, this.items);
    return html`
      <div class="slicer-range" role="group" aria-label="${this.label || this.field} range">
        <input
          class="slicer-range__input"
          type="number"
          .value=${String(curMin)}
          @change=${(e: Event) => this.handleRangeChange('min', (e.target as HTMLInputElement).value)}
          aria-label="Minimum value"
        />
        <span class="slicer-range__sep">to</span>
        <input
          class="slicer-range__input"
          type="number"
          .value=${String(curMax)}
          @change=${(e: Event) => this.handleRangeChange('max', (e.target as HTMLInputElement).value)}
          aria-label="Maximum value"
        />
      </div>
    `;
  }

  private renderActions() {
    if (this.mode !== 'multi') return nothing;
    return html`
      <div class="slicer-actions">
        <button @click=${this.handleSelectAll} aria-label="Select all">All</button>
        <button @click=${this.handleSelectNone} aria-label="Clear selection">None</button>
      </div>
    `;
  }

  private renderBody() {
    if (this.layout === 'chips' && this.mode !== 'range') {
      return this.renderChips();
    }
    switch (this.mode) {
      case 'single':
        return this.renderSingleList();
      case 'range':
        return this.renderRange();
      case 'multi':
      default:
        return this.renderMultiList();
    }
  }

  render() {
    return html`
      <div class="phz-w-card slicer" role="region" aria-label="${this.label || this.field} slicer">
        <div class="slicer-header">
          <h3 class="phz-w-title">${this.label || this.field}</h3>
          ${this.renderActions()}
        </div>
        ${this.renderSearch()}
        ${this.renderBody()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-slicer': PhzSlicer;
  }
}
