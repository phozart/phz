/**
 * @phozart/phz-engine-admin — Global Filter Bar
 *
 * Horizontal bar with per-filter dropdowns, multi-selects, date ranges, and text searches.
 * Auto-populates filter options from unique data values.
 */

import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../../safe-custom-element.js';
import { engineAdminStyles } from '../shared-styles.js';
import type { GlobalFilter, GlobalFilterType } from '@phozart/phz-engine';

interface FieldInfo {
  name: string;
  type: string;
}

@safeCustomElement('phz-global-filter-bar')
export class PhzGlobalFilterBar extends LitElement {
  static styles = [
    engineAdminStyles,
    css`
      :host { display: block; font-family: 'Inter', system-ui, -apple-system, sans-serif; }

      .filter-bar {
        display: flex; align-items: center; gap: 8px; padding: 8px 16px;
        background: #FAFAF9; border-bottom: 1px solid #E7E5E4;
        overflow-x: auto; flex-wrap: wrap;
      }

      .filter-bar-label {
        font-size: 10px; font-weight: 700; color: #A8A29E; text-transform: uppercase;
        letter-spacing: 0.06em; white-space: nowrap; flex-shrink: 0;
      }

      .filter-item {
        display: flex; align-items: center; gap: 4px;
        background: white; border: 1px solid #D6D3D1; border-radius: 6px;
        padding: 3px 8px; font-size: 12px; position: relative;
      }
      .filter-item--active { border-color: #3B82F6; background: #EFF6FF; }

      .filter-label {
        font-size: 11px; font-weight: 600; color: #44403C; white-space: nowrap;
      }

      .filter-control select,
      .filter-control input {
        padding: 3px 6px; border: 1px solid #D6D3D1; border-radius: 4px;
        font-size: 11px; font-family: inherit; background: white; min-width: 100px;
      }
      .filter-control select:focus,
      .filter-control input:focus { outline: none; border-color: #3B82F6; }

      .filter-remove {
        width: 18px; height: 18px; border-radius: 3px; border: none;
        background: none; color: #A8A29E; cursor: pointer; font-size: 14px;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .filter-remove:hover { background: #FEF2F2; color: #DC2626; }

      .filter-add {
        display: flex; align-items: center; gap: 4px; padding: 4px 10px;
        border: 1px dashed #D6D3D1; border-radius: 6px; background: white;
        font-size: 11px; font-weight: 600; color: #3B82F6; cursor: pointer;
        font-family: inherit; transition: all 0.15s; white-space: nowrap;
      }
      .filter-add:hover { border-color: #3B82F6; background: #EFF6FF; }

      .clear-all {
        padding: 4px 10px; border: 1px solid #D6D3D1; border-radius: 6px;
        background: white; font-size: 11px; font-weight: 600; color: #78716C;
        cursor: pointer; font-family: inherit; white-space: nowrap;
      }
      .clear-all:hover { background: #FEF2F2; color: #DC2626; border-color: #FCA5A5; }

      .add-picker {
        background: white; border: 1px solid #D6D3D1; border-radius: 6px;
        padding: 8px; display: flex; flex-direction: column; gap: 4px;
        min-width: 140px;
      }
      .add-picker select {
        padding: 5px 8px; border: 1px solid #D6D3D1; border-radius: 4px;
        font-size: 12px; font-family: inherit; background: white;
      }

      .multi-select-list {
        display: flex; flex-direction: column; gap: 2px;
        max-height: 120px; overflow-y: auto;
        border: 1px solid #D6D3D1; border-radius: 4px;
        padding: 4px;
      }
      .multi-select-item {
        display: flex; align-items: center; gap: 4px;
        font-size: 11px; padding: 2px 4px; cursor: pointer;
      }
      .multi-select-item:hover { background: #F5F5F4; border-radius: 3px; }
      .multi-select-item input { accent-color: #3B82F6; }
    `,
  ];

  @property({ type: Array }) filters: GlobalFilter[] = [];
  @property({ type: Array }) data: Record<string, unknown>[] = [];
  @property({ type: Array }) fields: FieldInfo[] = [];

  @state() private activeValues: Record<string, unknown> = {};
  @state() private showAddPicker = false;
  @state() private expandedMultiSelect?: string;

  private getUniqueValues(fieldKey: string): string[] {
    const seen = new Set<string>();
    for (const row of this.data) {
      const val = row[fieldKey];
      if (val !== null && val !== undefined) seen.add(String(val));
    }
    return Array.from(seen).sort();
  }

  private detectFilterType(fieldKey: string): GlobalFilterType {
    if (!this.data.length) return 'text-search';
    const sample = this.data[0][fieldKey];
    if (typeof sample === 'number') return 'number-range';
    const uniques = this.getUniqueValues(fieldKey);
    if (uniques.length <= 20) return 'select';
    return 'text-search';
  }

  private handleFilterChange(filterId: string, value: unknown) {
    this.activeValues = { ...this.activeValues, [filterId]: value };
    this.emitChange();
  }

  private handleMultiSelectChange(filterId: string, option: string, checked: boolean) {
    const current = (this.activeValues[filterId] as string[]) ?? [];
    const updated = checked ? [...current, option] : current.filter(v => v !== option);
    this.activeValues = { ...this.activeValues, [filterId]: updated.length > 0 ? updated : undefined };
    this.emitChange();
  }

  private addFilter(fieldKey: string) {
    const filterType = this.detectFilterType(fieldKey);
    const field = this.fields.find(f => f.name === fieldKey);
    const newFilter: GlobalFilter = {
      id: `gf-${Date.now()}`,
      label: field?.name ?? fieldKey,
      fieldKey,
      filterType,
    };
    this.filters = [...this.filters, newFilter];
    this.showAddPicker = false;
    this.emitChange();
  }

  private removeFilter(filterId: string) {
    this.filters = this.filters.filter(f => f.id !== filterId);
    const { [filterId]: _, ...rest } = this.activeValues;
    this.activeValues = rest;
    this.emitChange();
  }

  private clearAll() {
    this.activeValues = {};
    this.emitChange();
  }

  private emitChange() {
    this.dispatchEvent(new CustomEvent('filter-change', {
      bubbles: true, composed: true,
      detail: {
        filters: [...this.filters],
        activeValues: { ...this.activeValues },
      },
    }));
  }

  private renderFilterControl(filter: GlobalFilter) {
    const value = this.activeValues[filter.id];
    const uniqueValues = this.getUniqueValues(filter.fieldKey);
    const hasValue = value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0);

    switch (filter.filterType) {
      case 'select':
        return html`
          <div class="filter-control">
            <select .value=${(value as string) ?? ''} @change=${(e: Event) => this.handleFilterChange(filter.id, (e.target as HTMLSelectElement).value || undefined)}>
              <option value="">All</option>
              ${uniqueValues.map(v => html`<option value=${v} ?selected=${value === v}>${v}</option>`)}
            </select>
          </div>
        `;
      case 'multi-select':
        return html`
          <div class="filter-control">
            <button style="font-size:11px;padding:3px 8px;border:1px solid #D6D3D1;border-radius:4px;background:white;cursor:pointer;font-family:inherit;"
                    @click=${() => { this.expandedMultiSelect = this.expandedMultiSelect === filter.id ? undefined : filter.id; }}>
              ${Array.isArray(value) && value.length > 0 ? `${value.length} selected` : 'Select...'}
            </button>
            ${this.expandedMultiSelect === filter.id ? html`
              <div class="multi-select-list" style="position:absolute;top:100%;left:0;z-index:10;background:white;">
                ${uniqueValues.map(v => html`
                  <label class="multi-select-item">
                    <input type="checkbox" ?checked=${Array.isArray(value) && value.includes(v)}
                           @change=${(e: Event) => this.handleMultiSelectChange(filter.id, v, (e.target as HTMLInputElement).checked)}>
                    ${v}
                  </label>
                `)}
              </div>
            ` : nothing}
          </div>
        `;
      case 'text-search':
        return html`
          <div class="filter-control">
            <input type="text" placeholder="Search..." .value=${(value as string) ?? ''}
                   @input=${(e: Event) => this.handleFilterChange(filter.id, (e.target as HTMLInputElement).value || undefined)}>
          </div>
        `;
      case 'number-range':
        return html`
          <div class="filter-control" style="display:flex;gap:4px;">
            <input type="number" placeholder="Min" style="width:60px;"
                   .value=${String((value as any)?.min ?? '')}
                   @input=${(e: Event) => {
                     const min = parseFloat((e.target as HTMLInputElement).value);
                     const current = (value as any) ?? {};
                     this.handleFilterChange(filter.id, { ...current, min: isNaN(min) ? undefined : min });
                   }}>
            <input type="number" placeholder="Max" style="width:60px;"
                   .value=${String((value as any)?.max ?? '')}
                   @input=${(e: Event) => {
                     const max = parseFloat((e.target as HTMLInputElement).value);
                     const current = (value as any) ?? {};
                     this.handleFilterChange(filter.id, { ...current, max: isNaN(max) ? undefined : max });
                   }}>
          </div>
        `;
      case 'date-range':
        return html`
          <div class="filter-control" style="display:flex;gap:4px;">
            <input type="date" .value=${String((value as any)?.from ?? '')}
                   @input=${(e: Event) => {
                     const current = (value as any) ?? {};
                     this.handleFilterChange(filter.id, { ...current, from: (e.target as HTMLInputElement).value || undefined });
                   }}>
            <input type="date" .value=${String((value as any)?.to ?? '')}
                   @input=${(e: Event) => {
                     const current = (value as any) ?? {};
                     this.handleFilterChange(filter.id, { ...current, to: (e.target as HTMLInputElement).value || undefined });
                   }}>
          </div>
        `;
      default:
        return nothing;
    }
  }

  render() {
    const usedFields = new Set(this.filters.map(f => f.fieldKey));
    const availableFields = this.fields.filter(f => !usedFields.has(f.name));
    const hasActiveValues = Object.values(this.activeValues).some(v => v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0));

    return html`
      <div class="filter-bar" role="toolbar" aria-label="Global filters">
        <span class="filter-bar-label">Filters</span>

        ${this.filters.map(f => {
          const hasValue = this.activeValues[f.id] !== undefined && this.activeValues[f.id] !== '';
          return html`
            <div class="filter-item ${hasValue ? 'filter-item--active' : ''}">
              <span class="filter-label">${f.label}</span>
              ${this.renderFilterControl(f)}
              <button class="filter-remove" @click=${() => this.removeFilter(f.id)} title="Remove filter">&times;</button>
            </div>
          `;
        })}

        ${this.showAddPicker ? html`
          <div class="add-picker">
            <select @change=${(e: Event) => {
              const val = (e.target as HTMLSelectElement).value;
              if (val) this.addFilter(val);
            }}>
              <option value="">Pick field...</option>
              ${availableFields.map(f => html`<option value=${f.name}>${f.name} (${f.type})</option>`)}
            </select>
          </div>
        ` : html`
          <button class="filter-add" @click=${() => { this.showAddPicker = true; }} ?disabled=${availableFields.length === 0}>
            + Add Filter
          </button>
        `}

        ${hasActiveValues ? html`
          <button class="clear-all" @click=${this.clearAll}>Clear All</button>
        ` : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'phz-global-filter-bar': PhzGlobalFilterBar; }
}
