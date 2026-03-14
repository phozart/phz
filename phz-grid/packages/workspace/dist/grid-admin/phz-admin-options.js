/**
 * @phozart/grid-admin — Grid Options Panel
 *
 * Display/Behavior/Features/Pagination grouped toggles.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html } from 'lit';
import { property } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import { adminBaseStyles } from './shared-styles.js';
/**
 * @deprecated Use `<phz-admin-table-settings>` instead. This component will be removed in a future version.
 */
let PhzAdminOptions = class PhzAdminOptions extends LitElement {
    constructor() {
        super(...arguments);
        this.options = {
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
    }
    static { this.styles = [adminBaseStyles]; }
    connectedCallback() {
        super.connectedCallback();
        console.warn('[phz-grid-admin] <phz-admin-options> is deprecated. Use <phz-admin-table-settings> instead.');
    }
    emitChange(key, value) {
        this.dispatchEvent(new CustomEvent('options-change', {
            bubbles: true, composed: true,
            detail: { key, value },
        }));
    }
    renderToggle(key, label) {
        return html `
      <label class="phz-admin-checkbox">
        <input type="checkbox" ?checked=${this.options[key]}
               @change=${(e) => this.emitChange(key, e.target.checked)}>
        ${label}
      </label>
    `;
    }
    render() {
        return html `
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
                    @change=${(e) => this.emitChange('scrollMode', e.target.value)}>
              <option value="paginate">Paginate</option>
              <option value="virtual">Virtual Scroll</option>
            </select>
          </div>

          <div class="phz-admin-field">
            <label class="phz-admin-label">Auto-switch Threshold</label>
            <input type="number" class="phz-admin-input" min="0" step="100"
                   placeholder="0 = disabled"
                   .value=${String(this.options.virtualScrollThreshold || 0)}
                   @change=${(e) => this.emitChange('virtualScrollThreshold', Number(e.target.value))}>
          </div>

          <div class="phz-admin-field">
            <label class="phz-admin-label">Selection Mode</label>
            <select class="phz-admin-select" .value=${this.options.selectionMode}
                    @change=${(e) => this.emitChange('selectionMode', e.target.value)}>
              <option value="none">None</option>
              <option value="single">Single</option>
              <option value="multi">Multi</option>
              <option value="range">Range</option>
            </select>
          </div>

          <div class="phz-admin-field">
            <label class="phz-admin-label">Edit Mode</label>
            <select class="phz-admin-select" .value=${this.options.editMode}
                    @change=${(e) => this.emitChange('editMode', e.target.value)}>
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
                    @change=${(e) => this.emitChange('pageSize', Number(e.target.value))}>
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
};
__decorate([
    property({ type: Object })
], PhzAdminOptions.prototype, "options", void 0);
PhzAdminOptions = __decorate([
    safeCustomElement('phz-admin-options')
], PhzAdminOptions);
export { PhzAdminOptions };
//# sourceMappingURL=phz-admin-options.js.map