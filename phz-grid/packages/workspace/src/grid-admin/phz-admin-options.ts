/**
 * @phozart/grid-admin — Grid Options Panel
 *
 * Display/Behavior/Features/Pagination grouped toggles.
 */

import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import { adminBaseStyles } from './shared-styles.js';

interface GridOptions {
  showToolbar: boolean;
  showPagination: boolean;
  showCheckboxes: boolean;
  rowBanding: boolean;
  autoSizeColumns: boolean;
  virtualization: boolean;
  scrollMode: string;
  virtualScrollThreshold: number;
  fetchPageSize: number;
  prefetchPages: number;
  editMode: string;
  selectionMode: string;
  pageSize: number;
  showRowActions: boolean;
  showSelectionActions: boolean;
  showEditActions: boolean;
  showCopyActions: boolean;
}

/**
 * @deprecated Use `<phz-admin-table-settings>` instead. This component will be removed in a future version.
 */
@safeCustomElement('phz-admin-options')
export class PhzAdminOptions extends LitElement {
  static styles = [adminBaseStyles];

  override connectedCallback(): void {
    super.connectedCallback();
    console.warn(
      '[phz-grid-admin] <phz-admin-options> is deprecated. Use <phz-admin-table-settings> instead.',
    );
  }

  @property({ type: Object }) options: GridOptions = {
    showToolbar: true,
    showPagination: true,
    showCheckboxes: false,
    rowBanding: true,
    autoSizeColumns: true,
    virtualization: true,
    scrollMode: 'paginate',
    virtualScrollThreshold: 0,
    fetchPageSize: 100,
    prefetchPages: 2,
    editMode: 'none',
    selectionMode: 'single',
    pageSize: 50,
    showRowActions: false,
    showSelectionActions: true,
    showEditActions: true,
    showCopyActions: true,
  };

  private emitChange(key: string, value: unknown) {
    this.dispatchEvent(new CustomEvent('options-change', {
      bubbles: true, composed: true,
      detail: { key, value },
    }));
  }

  private renderToggle(key: keyof GridOptions, label: string) {
    return html`
      <label class="phz-admin-checkbox">
        <input type="checkbox" ?checked=${this.options[key] as boolean}
               @change=${(e: Event) => this.emitChange(key, (e.target as HTMLInputElement).checked)}>
        ${label}
      </label>
    `;
  }

  render() {
    return html`
      <div>
        <div class="phz-admin-section">
          <h4 class="phz-admin-section-title">Display</h4>
          ${this.renderToggle('showToolbar', 'Show Toolbar')}
          ${this.renderToggle('showPagination', 'Show Pagination')}
          ${this.renderToggle('showCheckboxes', 'Show Row Checkboxes')}
          ${this.renderToggle('rowBanding', 'Row Banding')}
        </div>

        <div class="phz-admin-section">
          <h4 class="phz-admin-section-title">Actions</h4>
          ${this.renderToggle('showRowActions', 'Show Row Actions')}
          ${this.renderToggle('showSelectionActions', 'Show Selection Bar')}
          ${this.renderToggle('showEditActions', 'Show Edit Actions')}
          ${this.renderToggle('showCopyActions', 'Show Copy Actions')}
        </div>

        <div class="phz-admin-section">
          <h4 class="phz-admin-section-title">Behavior</h4>
          ${this.renderToggle('autoSizeColumns', 'Auto-size Columns')}

          <div class="phz-admin-field">
            <label class="phz-admin-label">Scroll Mode</label>
            <select class="phz-admin-select" .value=${this.options.scrollMode || 'paginate'}
                    @change=${(e: Event) => this.emitChange('scrollMode', (e.target as HTMLSelectElement).value)}>
              <option value="paginate">Paginate</option>
              <option value="virtual">Virtual Scroll</option>
            </select>
          </div>

          <div class="phz-admin-field">
            <label class="phz-admin-label">Auto-switch Threshold</label>
            <input type="number" class="phz-admin-input" min="0" step="100"
                   placeholder="0 = disabled"
                   .value=${String(this.options.virtualScrollThreshold || 0)}
                   @change=${(e: Event) => this.emitChange('virtualScrollThreshold', Number((e.target as HTMLInputElement).value))}>
          </div>

          <div class="phz-admin-field">
            <label class="phz-admin-label">Selection Mode</label>
            <select class="phz-admin-select" .value=${this.options.selectionMode}
                    @change=${(e: Event) => this.emitChange('selectionMode', (e.target as HTMLSelectElement).value)}>
              <option value="none">None</option>
              <option value="single">Single</option>
              <option value="multi">Multi</option>
              <option value="range">Range</option>
            </select>
          </div>

          <div class="phz-admin-field">
            <label class="phz-admin-label">Edit Mode</label>
            <select class="phz-admin-select" .value=${this.options.editMode}
                    @change=${(e: Event) => this.emitChange('editMode', (e.target as HTMLSelectElement).value)}>
              <option value="none">Disabled</option>
              <option value="cell">Cell Edit</option>
              <option value="row">Row Edit</option>
            </select>
          </div>
        </div>

        <div class="phz-admin-section">
          <h4 class="phz-admin-section-title">Pagination</h4>
          <div class="phz-admin-field">
            <label class="phz-admin-label">Page Size</label>
            <select class="phz-admin-select" .value=${String(this.options.pageSize)}
                    @change=${(e: Event) => this.emitChange('pageSize', Number((e.target as HTMLSelectElement).value))}>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="250">250</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'phz-admin-options': PhzAdminOptions; }
}
