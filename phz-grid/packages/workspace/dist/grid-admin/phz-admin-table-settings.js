/**
 * @phozart/grid-admin — Table Settings Component
 *
 * 6 collapsible sections to configure all aspects of the grid's appearance
 * and behavior. Emits `table-settings-change` events with { section, key, value }.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import { adminBaseStyles } from './shared-styles.js';
import { DEFAULT_TABLE_SETTINGS } from '@phozart/engine';
export { DEFAULT_TABLE_SETTINGS };
const FONT_OPTIONS = [
    { value: 'inherit', label: 'System Default' },
    { value: "'Inter', sans-serif", label: 'Inter' },
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: "'Courier New', monospace", label: 'Courier' },
];
const PAGE_SIZES = [10, 20, 25, 50, 100, 250];
let PhzAdminTableSettings = class PhzAdminTableSettings extends LitElement {
    constructor() {
        super(...arguments);
        this.settings = { ...DEFAULT_TABLE_SETTINGS };
        this.columnFields = [];
        this.columnTypes = {};
        this._activeTab = 'layout';
    }
    static { this.styles = [
        adminBaseStyles,
        css `
      :host { display: block; }

      /* ── Tab switcher ── */
      .tab-switcher {
        display: flex;
        background: #F5F5F4;
        border-radius: 10px;
        padding: 3px;
        margin-bottom: 12px;
        gap: 2px;
      }
      .tab-switcher button {
        flex: 1;
        padding: 7px 8px;
        font-size: 12px;
        font-weight: 600;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        background: transparent;
        color: #78716C;
        font-family: inherit;
        transition: all 0.15s ease;
        min-height: 34px;
      }
      .tab-switcher button:hover { color: #44403C; }
      .tab-switcher button.active {
        background: white;
        color: #1C1917;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      }

      /* ── Category headings (hidden — replaced by tabs) ── */
      .settings-category {
        margin-bottom: 8px;
      }

      /* ── Section cards ── */
      details.settings-section {
        background: #FAFAF9;
        border-radius: 12px;
        padding: 4px 12px;
        margin-bottom: 8px;
        box-shadow: var(--phz-admin-shadow-sm);
        transition: box-shadow 0.15s ease;
      }
      details.settings-section[open] {
        box-shadow: var(--phz-admin-shadow-md);
      }
      details.settings-section summary {
        padding: 10px 0;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        color: #44403C;
        list-style: none;
        display: flex;
        align-items: center;
        gap: 6px;
        user-select: none;
        min-height: 44px;
      }
      details.settings-section summary::-webkit-details-marker { display: none; }
      details.settings-section summary::before {
        content: '\\25B6';
        font-size: 8px;
        transition: transform 0.15s;
        color: #A8A29E;
      }
      details.settings-section[open] summary::before { transform: rotate(90deg); }
      details.settings-section[open] summary { color: #3B82F6; }

      .settings-content {
        padding: 0 0 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .setting-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .setting-row label {
        font-size: 12px;
        font-weight: 600;
        color: #44403C;
        min-width: 100px;
        flex-shrink: 0;
      }
      .setting-row select,
      .setting-row input[type="text"],
      .setting-row input[type="number"] {
        padding: 6px 10px;
        border: 1px solid #D6D3D1;
        border-radius: 8px;
        font-size: 12px;
        background: white;
        color: #1C1917;
        flex: 1;
        min-width: 0;
      }
      .setting-row input[type="number"] { width: 80px; min-width: 80px; flex: 0; }
      .setting-row input[type="color"] {
        width: 32px;
        height: 28px;
        border: 1px solid #D6D3D1;
        border-radius: 8px;
        padding: 1px;
        cursor: pointer;
        flex-shrink: 0;
      }

      /* Toggle */
      .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        min-height: 44px;
      }
      .toggle-row label {
        font-size: 12px;
        font-weight: 600;
        color: #44403C;
      }

      /* Button group */
      .btn-group {
        display: flex;
        border-radius: 8px;
        overflow: hidden;
        flex: 1;
        box-shadow: var(--phz-admin-shadow-sm);
      }
      .btn-group button {
        flex: 1;
        padding: 8px 12px;
        font-size: 12px;
        font-weight: 500;
        border: 1px solid #D6D3D1;
        cursor: pointer;
        background: white;
        color: #78716C;
        transition: all 0.1s;
        font-family: inherit;
        min-height: 36px;
      }
      .btn-group button:not(:first-child) { border-left: none; }
      .btn-group button:first-child { border-radius: 8px 0 0 8px; }
      .btn-group button:last-child { border-radius: 0 8px 8px 0; }
      .btn-group button:hover { background: #F5F5F4; }
      .btn-group button.active { background: #1C1917; color: white; border-color: #1C1917; }

      /* Format buttons (B, I, U) */
      .format-btn-group {
        display: flex;
        gap: 4px;
      }
      .format-btn {
        width: 36px;
        height: 36px;
        border: 1px solid #D6D3D1;
        border-radius: 8px;
        background: white;
        color: #78716C;
        cursor: pointer;
        font-size: 13px;
        font-weight: 700;
        font-family: inherit;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: var(--phz-admin-shadow-sm);
        transition: all 0.15s;
      }
      .format-btn:hover { background: #F5F5F4; transform: translateY(-1px); box-shadow: var(--phz-admin-shadow-md); }
      .format-btn.active { background: #1C1917; color: white; border-color: #1C1917; }

      /* Color row */
      .color-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .color-row label {
        font-size: 12px;
        font-weight: 600;
        color: #44403C;
        min-width: 100px;
        flex-shrink: 0;
      }
      .color-pair {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .color-pair span {
        font-size: 12px;
        color: #78716C;
      }

      /* Column group editor */
      .group-editor { display: flex; flex-direction: column; gap: 8px; }
      .group-entry {
        border-radius: 12px;
        padding: 10px 12px;
        background: white;
        box-shadow: var(--phz-admin-shadow-sm);
      }
      .group-entry-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      .group-entry-header input {
        flex: 1;
        padding: 6px 10px;
        border: 1px solid #D6D3D1;
        border-radius: 8px;
        font-size: 12px;
      }
      .group-entry-header button {
        background: none;
        border: none;
        color: #A8A29E;
        cursor: pointer;
        font-size: 14px;
        padding: 4px;
        min-width: 36px;
        min-height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .group-entry-header button:hover { color: #DC2626; }
      .group-children {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .group-child-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 6px 12px;
        font-size: 12px;
        border-radius: 8px;
        cursor: pointer;
        border: 1px solid #D6D3D1;
        background: white;
        color: #44403C;
        box-shadow: var(--phz-admin-shadow-sm);
        transition: all 0.15s;
        font-family: inherit;
      }
      .group-child-chip:hover { border-color: #3B82F6; transform: translateY(-1px); box-shadow: var(--phz-admin-shadow-md); }
      .group-child-chip.selected { background: #EFF6FF; color: #3B82F6; border-color: #3B82F6; }
      .add-group-btn {
        font-size: 12px;
        padding: 6px 14px;
        border: 1px dashed #D6D3D1;
        border-radius: 8px;
        background: white;
        color: #78716C;
        cursor: pointer;
        font-family: inherit;
        align-self: flex-start;
        transition: all 0.15s;
      }
      .add-group-btn:hover { border-color: #3B82F6; color: #3B82F6; }

      .action-btn {
        padding: 8px 16px;
        border: 1px solid #D6D3D1;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        background: white;
        color: #44403C;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.15s;
      }
      .action-btn:hover { background: #F5F5F4; border-color: #3B82F6; color: #3B82F6; }

      .disabled { opacity: 0.4; pointer-events: none; }
    `,
    ]; }
    /** Merge incoming settings with defaults so the UI always has valid values. */
    get s() {
        return { ...DEFAULT_TABLE_SETTINGS, ...this.settings };
    }
    emit(section, key, value) {
        this.dispatchEvent(new CustomEvent('table-settings-change', {
            bubbles: true,
            composed: true,
            detail: { section, key, value },
        }));
    }
    renderToggle(label, section, key, disabled = false) {
        const checked = !!this.s[key];
        return html `
      <div class="toggle-row ${disabled ? 'disabled' : ''}">
        <label>${label}</label>
        <label class="phz-admin-toggle">
          <input type="checkbox" .checked=${checked} ?disabled=${disabled}
            @change=${(e) => this.emit(section, key, e.target.checked)}>
          <span class="phz-admin-toggle-slider"></span>
        </label>
      </div>
    `;
    }
    renderBtnGroup(section, key, options) {
        const current = this.s[key];
        return html `
      <div class="btn-group">
        ${options.map(o => html `
          <button class="${current === o.value ? 'active' : ''}"
            @click=${() => this.emit(section, key, o.value)}>${o.label}</button>
        `)}
      </div>
    `;
    }
    // ── Section 1: Container ──
    renderContainerSection() {
        return html `
      <details class="settings-section" open>
        <summary>Container</summary>
        <div class="settings-content">
          <div class="setting-row">
            <label>Shadow</label>
            ${this.renderBtnGroup('container', 'containerShadow', [
            { value: 'none', label: 'None' },
            { value: 'sm', label: 'S' },
            { value: 'md', label: 'M' },
            { value: 'lg', label: 'L' },
        ])}
          </div>
          <div class="setting-row">
            <label>Border Radius</label>
            <input type="range" min="0" max="24" step="1"
              .value=${String(this.s.containerRadius ?? 8)}
              style="flex:1;accent-color:#3B82F6"
              @input=${(e) => this.emit('container', 'containerRadius', Number(e.target.value))}>
            <input type="number" min="0" max="24"
              .value=${String(this.s.containerRadius ?? 8)}
              style="width:56px;flex:0"
              @change=${(e) => this.emit('container', 'containerRadius', Number(e.target.value))}>
            <span style="font-size:12px;color:#78716C">px</span>
          </div>
        </div>
      </details>
    `;
    }
    // ── Section 2: Title Bar ──
    renderTitleBarSection() {
        return html `
      <details class="settings-section">
        <summary>Title Bar</summary>
        <div class="settings-content">
          ${this.renderToggle('Show Title Bar', 'titleBar', 'showTitleBar')}
          <div class="setting-row">
            <label>Title</label>
            <input type="text" .value=${this.s.titleText}
              placeholder="Grid title..."
              @input=${(e) => this.emit('titleBar', 'titleText', e.target.value)}>
          </div>
          <div class="setting-row">
            <label>Subtitle</label>
            <input type="text" .value=${this.s.subtitleText}
              placeholder="Subtitle..."
              @input=${(e) => this.emit('titleBar', 'subtitleText', e.target.value)}>
          </div>
          <div class="setting-row">
            <label>Font Family</label>
            <select .value=${this.s.titleFontFamily}
              @change=${(e) => this.emit('titleBar', 'titleFontFamily', e.target.value)}>
              ${FONT_OPTIONS.map(f => html `<option value=${f.value} ?selected=${f.value === this.s.titleFontFamily}>${f.label}</option>`)}
            </select>
          </div>
          <div class="setting-row">
            <label>Title Size</label>
            <input type="number" .value=${String(this.s.titleFontSize)} min="10" max="32"
              @change=${(e) => this.emit('titleBar', 'titleFontSize', Number(e.target.value))}>
            <span style="font-size:12px;color:#78716C">px</span>
          </div>
          <div class="setting-row">
            <label>Subtitle Size</label>
            <input type="number" .value=${String(this.s.subtitleFontSize)} min="10" max="24"
              @change=${(e) => this.emit('titleBar', 'subtitleFontSize', Number(e.target.value))}>
            <span style="font-size:12px;color:#78716C">px</span>
          </div>
          <div class="setting-row">
            <label>Background</label>
            <input type="color" .value=${this.s.titleBarBg || '#1C1917'}
              @input=${(e) => this.emit('titleBar', 'titleBarBg', e.target.value)}>
            <input type="text" .value=${this.s.titleBarBg || ''} style="width:80px;flex:0"
              placeholder="#RRGGBB"
              @change=${(e) => this.emit('titleBar', 'titleBarBg', e.target.value)}>
          </div>
          <div class="setting-row">
            <label>Text Color</label>
            <input type="color" .value=${this.s.titleBarText || '#FEFDFB'}
              @input=${(e) => this.emit('titleBar', 'titleBarText', e.target.value)}>
            <input type="text" .value=${this.s.titleBarText || ''} style="width:80px;flex:0"
              placeholder="#RRGGBB"
              @change=${(e) => this.emit('titleBar', 'titleBarText', e.target.value)}>
          </div>
          <div class="setting-row">
            <label>Icon</label>
            <input type="text" .value=${this.s.titleIcon}
              placeholder="Emoji or text"
              style="width:60px;flex:0"
              @input=${(e) => this.emit('titleBar', 'titleIcon', e.target.value)}>
          </div>
        </div>
      </details>
    `;
    }
    // ── Section 3: Toolbar ──
    renderToolbarSection() {
        const disabled = !this.s.showToolbar;
        return html `
      <details class="settings-section">
        <summary>Toolbar</summary>
        <div class="settings-content">
          ${this.renderToggle('Show Toolbar', 'toolbar', 'showToolbar')}
          <div class="${disabled ? 'disabled' : ''}" style="display:flex;flex-direction:column;gap:8px">
            ${this.renderToggle('Search', 'toolbar', 'showSearch', disabled)}
            ${this.renderToggle('Density Toggle', 'toolbar', 'showDensityToggle', disabled)}
            ${this.renderToggle('Column Editor', 'toolbar', 'showColumnEditor', disabled)}
            ${this.renderToggle('CSV Export', 'toolbar', 'showCsvExport', disabled)}
            ${this.renderToggle('Excel Export', 'toolbar', 'showExcelExport', disabled)}
            ${this.renderToggle('Generate Dashboard', 'toolbar', 'showGenerateDashboard', disabled)}
          </div>
        </div>
      </details>
    `;
    }
    // ── Section 4: Grid Options ──
    renderGridOptionsSection() {
        const isPaginate = this.s.loadingMode === 'paginate';
        const sortEnabled = this.s.allowSorting;
        return html `
      <details class="settings-section">
        <summary>Grid Options</summary>
        <div class="settings-content">
          <div class="setting-row">
            <label>Density</label>
            ${this.renderBtnGroup('gridOptions', 'density', [
            { value: 'comfortable', label: 'Comfortable' },
            { value: 'compact', label: 'Compact' },
            { value: 'dense', label: 'Dense' },
        ])}
          </div>
          <div class="setting-row">
            <label>Loading Mode</label>
            ${this.renderBtnGroup('gridOptions', 'loadingMode', [
            { value: 'paginate', label: 'Paginate' },
            { value: 'lazy', label: 'Scroll' },
        ])}
          </div>
          ${isPaginate ? html `
            <div class="setting-row">
              <label>Page Size</label>
              <select .value=${String(this.s.pageSize)}
                @change=${(e) => this.emit('gridOptions', 'pageSize', Number(e.target.value))}>
                ${PAGE_SIZES.map(s => html `<option value=${String(s)} ?selected=${s === this.s.pageSize}>${s}</option>`)}
              </select>
            </div>
          ` : nothing}
          ${this.renderToggle('Header Wrapping', 'gridOptions', 'headerWrapping')}
          ${this.renderToggle('Column Groups', 'gridOptions', 'showColumnGroups')}
          ${this.s.showColumnGroups ? this.renderColumnGroupEditor() : nothing}
          ${this.renderToggle('Allow Filtering', 'gridOptions', 'allowFiltering')}
          ${this.renderToggle('Allow Sorting', 'gridOptions', 'allowSorting')}
          ${sortEnabled ? html `
            <div class="setting-row">
              <label>Default Sort</label>
              <select .value=${this.s.defaultSortField}
                @change=${(e) => this.emit('gridOptions', 'defaultSortField', e.target.value)}>
                <option value="">None</option>
                ${(this.columnFields ?? []).map(f => html `<option value=${f} ?selected=${f === this.s.defaultSortField}>${f}</option>`)}
              </select>
              <select .value=${this.s.defaultSortDirection}
                @change=${(e) => this.emit('gridOptions', 'defaultSortDirection', e.target.value)}>
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
            </div>
          ` : nothing}
          ${this.renderToggle('Row Banding', 'gridOptions', 'rowBanding')}
          ${this.renderToggle('Auto-size Columns', 'gridOptions', 'autoSizeColumns')}
          <div class="setting-row">
            <label></label>
            <button class="action-btn"
              @click=${() => this.emit('gridOptions', 'autoSizeNow', true)}>
              Auto-size Now
            </button>
          </div>
        </div>
      </details>
    `;
    }
    // ── Section 5: Row Grouping ──
    /**
     * Build a field-to-level lookup from groupByLevels.
     * Returns Map<field, levelNumber (1-based)>.
     */
    _getFieldLevelMap() {
        const levels = this.s.groupByLevels || [];
        const map = new Map();
        for (let lvl = 0; lvl < levels.length; lvl++) {
            for (const f of levels[lvl]) {
                map.set(f, lvl + 1);
            }
        }
        return map;
    }
    /**
     * Rebuild groupByLevels from the field-level map and emit both groupByLevels and groupByFields.
     */
    _emitGroupLevels(fieldLevelMap) {
        // Find max level
        let maxLevel = 0;
        for (const lvl of fieldLevelMap.values()) {
            if (lvl > maxLevel)
                maxLevel = lvl;
        }
        // Build levels array preserving insertion order
        const levels = [];
        for (let i = 0; i < maxLevel; i++)
            levels.push([]);
        for (const [field, lvl] of fieldLevelMap) {
            levels[lvl - 1].push(field);
        }
        // Remove empty trailing levels
        while (levels.length > 0 && levels[levels.length - 1].length === 0)
            levels.pop();
        // Flatten for groupByFields (backward compat)
        const flat = levels.flat();
        this.emit('gridOptions', 'groupByFields', flat);
        this.emit('gridOptions', 'groupByLevels', levels);
    }
    renderRowGroupingSection() {
        const groupFields = this.s.groupByFields || [];
        const fieldLevelMap = this._getFieldLevelMap();
        // If groupByLevels is empty but groupByFields has values, treat each field as its own level
        if (fieldLevelMap.size === 0 && groupFields.length > 0) {
            for (let i = 0; i < groupFields.length; i++) {
                fieldLevelMap.set(groupFields[i], i + 1);
            }
        }
        const maxLevel = [...fieldLevelMap.values()].reduce((m, v) => v > m ? v : m, 0);
        return html `
      <details class="settings-section" ?open=${groupFields.length > 0}>
        <summary>Row Grouping${groupFields.length > 0 ? html ` <span style="font-size:12px;color:#3B82F6;margin-left:4px;">(${groupFields.length})</span>` : nothing}</summary>
        <div class="settings-content">
          <p style="font-size:12px; color:#78716C; margin:0 0 8px;">Select fields to group rows. Click the level badge to change level — fields at the same level create composite groups on one row.</p>
          <div class="group-children">
            ${(this.columnFields ?? []).map(f => {
            const level = fieldLevelMap.get(f);
            const selected = level !== undefined;
            return html `
                <button class="group-child-chip ${selected ? 'selected' : ''}"
                  @click=${() => {
                const map = new Map(fieldLevelMap);
                if (selected) {
                    map.delete(f);
                }
                else {
                    map.set(f, Math.max(1, maxLevel));
                }
                this._emitGroupLevels(map);
            }}>
                  ${selected ? html `
                    <span style="
                      display:inline-flex; align-items:center; justify-content:center;
                      width:16px; height:16px; border-radius:50%;
                      background:#3B82F6; color:#fff; font-size:9px; font-weight:700;
                      margin-right:4px; cursor:pointer; flex-shrink:0;
                    " title="Level ${level} — click to change"
                      @click=${(e) => {
                e.stopPropagation();
                const map = new Map(fieldLevelMap);
                const currentLvl = map.get(f) || 1;
                const nextLvl = currentLvl >= 3 ? 1 : currentLvl + 1;
                map.set(f, nextLvl);
                this._emitGroupLevels(map);
            }}>${level}</span>
                  ` : nothing}${f}
                </button>
              `;
        })}
          </div>
          ${groupFields.length > 0 ? html `
            <div style="margin-top:4px; font-size:10px; color:#A8A29E;">
              Same level = one row. Click badge to cycle 1\u21922\u21923\u21921
            </div>
            <button class="action-btn" style="margin-top:6px;"
              @click=${() => {
            this.emit('gridOptions', 'groupByFields', []);
            this.emit('gridOptions', 'groupByLevels', []);
        }}>
              Clear All
            </button>
            <div style="margin-top:10px; border-top:1px solid #E7E5E4; padding-top:8px;">
              ${this.renderToggle('Show Group Totals', 'gridOptions', 'groupTotals')}
              ${this.s.groupTotals ? html `
                <div class="setting-row" style="margin-top:6px;">
                  <label>Default Function</label>
                  <select .value=${this.s.groupTotalsFn || 'sum'}
                    @change=${(e) => this.emit('gridOptions', 'groupTotalsFn', e.target.value)}>
                    <option value="sum">Sum</option>
                    <option value="avg">Average</option>
                    <option value="count">Count</option>
                    <option value="min">Min</option>
                    <option value="max">Max</option>
                  </select>
                </div>
                ${this.renderGroupTotalsOverrides()}
              ` : nothing}
            </div>
          ` : nothing}
        </div>
      </details>
    `;
    }
    renderGroupTotalsOverrides() {
        if ((this.columnFields ?? []).length === 0)
            return nothing;
        const overrides = this.s.groupTotalsOverrides || {};
        return html `
      <details style="margin-top:6px;">
        <summary style="font-size:12px; color:#78716C; cursor:pointer; user-select:none;">Per-Column Aggregations</summary>
        <div style="display:flex; flex-direction:column; gap:6px; margin-top:6px;">
          ${(this.columnFields ?? []).map(f => {
            const isNumeric = (this.columnTypes[f] || '').toLowerCase() === 'number';
            const currentVal = overrides[f] || '';
            return html `
              <div class="setting-row">
                <label style="font-size:12px;">${f}</label>
                <select .value=${currentVal}
                  @change=${(e) => {
                const val = e.target.value;
                const updated = { ...overrides };
                if (val) {
                    updated[f] = val;
                }
                else {
                    delete updated[f];
                }
                this.emit('gridOptions', 'groupTotalsOverrides', updated);
            }}>
                  <option value="">${isNumeric ? 'Default (use fn)' : 'None'}</option>
                  <option value="none">${isNumeric ? 'None (hide)' : 'None'}</option>
                  <option value="sum">Sum</option>
                  <option value="avg">Average</option>
                  <option value="count">Count</option>
                  <option value="min">Min</option>
                  <option value="max">Max</option>
                </select>
              </div>
            `;
        })}
        </div>
      </details>
    `;
    }
    // ── Aggregation Row ──
    renderAggregationSection() {
        const show = !!this.s.showAggregation;
        return html `
      <details class="settings-section" ?open=${show}>
        <summary>Aggregation Row</summary>
        <div class="settings-content">
          ${this.renderToggle('Show Summary Row', 'gridOptions', 'showAggregation')}
          ${show ? html `
            <div class="setting-row">
              <label>Position</label>
              ${this.renderBtnGroup('gridOptions', 'aggregationPosition', [
            { value: 'top', label: 'Top' },
            { value: 'bottom', label: 'Bottom' },
            { value: 'both', label: 'Both' },
        ])}
            </div>
            <div class="setting-row">
              <label>Default Function</label>
              <select .value=${this.s.aggregationFn || 'sum'}
                @change=${(e) => this.emit('gridOptions', 'aggregationFn', e.target.value)}>
                <option value="sum">Sum</option>
                <option value="avg">Average</option>
                <option value="count">Count</option>
                <option value="min">Min</option>
                <option value="max">Max</option>
              </select>
            </div>
          ` : nothing}
        </div>
      </details>
    `;
    }
    // ── Section 6: Behaviour ──
    renderBehaviourSection() {
        const isVirtual = (this.s.scrollMode || 'paginate') === 'virtual';
        const hasThreshold = (this.s.virtualScrollThreshold || 0) > 0;
        return html `
      <details class="settings-section">
        <summary>Behaviour</summary>
        <div class="settings-content">
          <div class="setting-row">
            <label>Selection Mode</label>
            <select .value=${this.s.selectionMode || 'single'}
              @change=${(e) => this.emit('gridOptions', 'selectionMode', e.target.value)}>
              <option value="none">None</option>
              <option value="single">Single</option>
              <option value="multi">Multi</option>
              <option value="range">Range</option>
            </select>
          </div>
          <div class="setting-row">
            <label>Edit Mode</label>
            <select .value=${this.s.editMode || 'none'}
              @change=${(e) => this.emit('gridOptions', 'editMode', e.target.value)}>
              <option value="none">Disabled</option>
              <option value="cell">Cell Edit</option>
              <option value="row">Row Edit</option>
              <option value="dblclick">Double-Click</option>
            </select>
          </div>
          <div class="setting-row">
            <label>Scroll Mode</label>
            ${this.renderBtnGroup('gridOptions', 'scrollMode', [
            { value: 'paginate', label: 'Paginate' },
            { value: 'virtual', label: 'Virtual' },
        ])}
          </div>
          <div class="setting-row">
            <label>Auto-switch</label>
            <input type="number" .value=${String(this.s.virtualScrollThreshold || 0)} min="0" step="100"
              placeholder="0 = disabled"
              @change=${(e) => this.emit('gridOptions', 'virtualScrollThreshold', Number(e.target.value))}>
            <span style="font-size:11px;color:#78716C">rows</span>
          </div>
          ${isVirtual || hasThreshold ? html `
            <div class="setting-row">
              <label>Fetch Page Size</label>
              <select .value=${String(this.s.fetchPageSize || 100)}
                @change=${(e) => this.emit('gridOptions', 'fetchPageSize', Number(e.target.value))}>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
                <option value="500">500</option>
              </select>
            </div>
            <div class="setting-row">
              <label>Prefetch Pages</label>
              <input type="number" .value=${String(this.s.prefetchPages ?? 2)} min="0" max="5"
                @change=${(e) => this.emit('gridOptions', 'prefetchPages', Number(e.target.value))}>
            </div>
          ` : nothing}
          ${this.renderToggle('Show Pagination', 'gridOptions', 'showPagination')}
          ${this.renderToggle('Show Row Checkboxes', 'gridOptions', 'showCheckboxes')}
          ${this.renderToggle('Show Row Actions', 'gridOptions', 'showRowActions')}
          ${this.renderToggle('Show Selection Bar', 'gridOptions', 'showSelectionActions')}
          ${this.renderToggle('Show Edit Actions', 'gridOptions', 'showEditActions')}
          ${this.renderToggle('Show Copy Actions', 'gridOptions', 'showCopyActions')}
        </div>
      </details>
    `;
    }
    renderColumnGroupEditor() {
        const groups = this.s.columnGroups || [];
        return html `
      <div class="group-editor">
        ${groups.map((group, gi) => html `
          <div class="group-entry">
            <div class="group-entry-header">
              <input type="text" .value=${group.header} placeholder="Group header..."
                @change=${(e) => {
            const updated = [...groups];
            updated[gi] = { ...updated[gi], header: e.target.value };
            this.emit('gridOptions', 'columnGroups', updated);
        }}>
              <button title="Remove group" @click=${() => {
            const updated = groups.filter((_, i) => i !== gi);
            this.emit('gridOptions', 'columnGroups', updated);
        }}>&times;</button>
            </div>
            <div class="group-children">
              ${(this.columnFields ?? []).map(f => {
            const selected = (group.children || []).includes(f);
            return html `
                  <button class="group-child-chip ${selected ? 'selected' : ''}"
                    @click=${() => {
                const children = selected
                    ? group.children.filter(c => c !== f)
                    : [...group.children, f];
                const updated = [...groups];
                updated[gi] = { ...updated[gi], children };
                this.emit('gridOptions', 'columnGroups', updated);
            }}>${f}</button>
                `;
        })}
            </div>
          </div>
        `)}
        <button class="add-group-btn" @click=${() => {
            const updated = [...groups, { header: 'Group ' + (groups.length + 1), children: [] }];
            this.emit('gridOptions', 'columnGroups', updated);
        }}>+ Add Group</button>
      </div>
    `;
    }
    // ── Grid Lines & Display ──
    renderGridLinesSection() {
        return html `
      <details class="settings-section" open>
        <summary>Grid Lines &amp; Display</summary>
        <div class="settings-content">
          <div class="setting-row">
            <label>Grid Lines</label>
            ${this.renderBtnGroup('display', 'gridLines', [
            { value: 'none', label: 'None' },
            { value: 'horizontal', label: 'Horiz' },
            { value: 'vertical', label: 'Vert' },
            { value: 'both', label: 'Both' },
        ])}
          </div>
          <div class="setting-row">
            <label>Line Color</label>
            <input type="color" .value=${this.s.gridLineColor || '#E7E5E4'}
              @input=${(e) => this.emit('display', 'gridLineColor', e.target.value)}>
            <input type="text" .value=${this.s.gridLineColor || '#E7E5E4'} style="width:80px;flex:0"
              placeholder="#RRGGBB"
              @change=${(e) => this.emit('display', 'gridLineColor', e.target.value)}>
          </div>
          <div class="setting-row">
            <label>Line Width</label>
            ${this.renderBtnGroup('display', 'gridLineWidth', [
            { value: 'thin', label: 'Thin' },
            { value: 'medium', label: 'Medium' },
        ])}
          </div>
          <div class="setting-row">
            <label>Banding Color</label>
            <input type="color" .value=${this.s.bandingColor || '#FAFAF9'}
              @input=${(e) => this.emit('display', 'bandingColor', e.target.value)}>
            <input type="text" .value=${this.s.bandingColor || '#FAFAF9'} style="width:80px;flex:0"
              placeholder="#RRGGBB"
              @change=${(e) => this.emit('display', 'bandingColor', e.target.value)}>
          </div>
          ${this.renderToggle('Hover Highlight', 'display', 'hoverHighlight')}
          <div class="setting-row">
            <label>Cell Overflow</label>
            ${this.renderBtnGroup('display', 'cellTextOverflow', [
            { value: 'ellipsis', label: 'Ellipsis' },
            { value: 'clip', label: 'Clip' },
            { value: 'wrap', label: 'Wrap' },
        ])}
          </div>
          ${this.renderToggle('Compact Numbers', 'display', 'compactNumbers')}
        </div>
      </details>
    `;
    }
    // ── Section 5: Default Typography ──
    renderTypographySection() {
        return html `
      <details class="settings-section">
        <summary>Default Typography</summary>
        <div class="settings-content">
          <div class="setting-row">
            <label>Font Family</label>
            <select .value=${this.s.fontFamily}
              @change=${(e) => this.emit('typography', 'fontFamily', e.target.value)}>
              ${FONT_OPTIONS.map(f => html `<option value=${f.value} ?selected=${f.value === this.s.fontFamily}>${f.label}</option>`)}
            </select>
          </div>
          <div class="setting-row">
            <label>Font Size</label>
            <input type="number" .value=${String(this.s.fontSize)} min="10" max="20"
              @change=${(e) => this.emit('typography', 'fontSize', Number(e.target.value))}>
            <span style="font-size:12px;color:#78716C">px</span>
          </div>
          <div class="setting-row">
            <label>Style</label>
            <div class="format-btn-group">
              <button class="format-btn ${this.s.fontBold ? 'active' : ''}"
                title="Bold"
                @click=${() => this.emit('typography', 'fontBold', !this.s.fontBold)}>B</button>
              <button class="format-btn ${this.s.fontItalic ? 'active' : ''}"
                title="Italic"
                style="font-style:italic"
                @click=${() => this.emit('typography', 'fontItalic', !this.s.fontItalic)}>I</button>
              <button class="format-btn ${this.s.fontUnderline ? 'active' : ''}"
                title="Underline"
                style="text-decoration:underline"
                @click=${() => this.emit('typography', 'fontUnderline', !this.s.fontUnderline)}>U</button>
            </div>
          </div>
          <div class="setting-row">
            <label>Header Align</label>
            <div class="btn-group">
              ${['left', 'center', 'right'].map(a => html `
                <button class="${this.s.headerHAlign === a ? 'active' : ''}"
                  @click=${() => this.emit('typography', 'headerHAlign', a)}>
                  ${a === 'left' ? '\u2190' : a === 'center' ? '\u2194' : '\u2192'}
                </button>
              `)}
            </div>
          </div>
          <div class="setting-row">
            <label>Body H-Align</label>
            <div class="btn-group">
              ${['left', 'center', 'right'].map(a => html `
                <button class="${this.s.hAlign === a ? 'active' : ''}"
                  @click=${() => this.emit('typography', 'hAlign', a)}>
                  ${a === 'left' ? '\u2190' : a === 'center' ? '\u2194' : '\u2192'}
                </button>
              `)}
            </div>
          </div>
          <div class="setting-row">
            <label>V-Align</label>
            <div class="btn-group">
              ${['top', 'middle', 'bottom'].map(a => html `
                <button class="${this.s.vAlign === a ? 'active' : ''}"
                  @click=${() => this.emit('typography', 'vAlign', a)}>
                  ${a === 'top' ? '\u2191' : a === 'middle' ? '\u2195' : '\u2193'}
                </button>
              `)}
            </div>
          </div>

          <div style="margin-top:8px;padding-top:8px;border-top:1px solid #E7E5E4">
            <div style="font-size:12px;font-weight:700;color:#44403C;margin-bottom:8px">Alignment by Field Type</div>
            ${this.renderTypeAlignRow('Numbers', 'numberAlign')}
            ${this.renderTypeAlignRow('Text', 'textAlign')}
            ${this.renderTypeAlignRow('Dates', 'dateAlign')}
            ${this.renderTypeAlignRow('Boolean', 'booleanAlign')}
          </div>
        </div>
      </details>
    `;
    }
    renderTypeAlignRow(label, key) {
        const current = this.s[key];
        return html `
      <div class="setting-row">
        <label>${label}</label>
        <div class="btn-group">
          ${['left', 'center', 'right'].map(a => html `
            <button class="${current === a ? 'active' : ''}"
              @click=${() => this.emit('typography', key, a)}>
              ${a === 'left' ? '\u2190' : a === 'center' ? '\u2194' : '\u2192'}
            </button>
          `)}
        </div>
      </div>
    `;
    }
    // ── Section 6: Section Colors ──
    renderSectionColorsSection() {
        const colorRow = (label, bgKey, textKey) => html `
      <div class="color-row">
        <label>${label}</label>
        <div class="color-pair">
          <span>BG</span>
          <input type="color" .value=${String(this.s[bgKey])}
            @input=${(e) => this.emit('colors', bgKey, e.target.value)}>
        </div>
        <div class="color-pair">
          <span>Text</span>
          <input type="color" .value=${String(this.s[textKey])}
            @input=${(e) => this.emit('colors', textKey, e.target.value)}>
        </div>
      </div>
    `;
        return html `
      <details class="settings-section">
        <summary>Section Colors</summary>
        <div class="settings-content">
          ${colorRow('Title Bar', 'titleBarBgColor', 'titleBarTextColor')}
          ${colorRow('Headers', 'headerBg', 'headerText')}
          ${colorRow('Body', 'bodyBg', 'bodyText')}
          ${colorRow('Footer', 'footerBg', 'footerText')}
        </div>
      </details>
    `;
    }
    _renderTabSwitcher() {
        const tabs = [
            { key: 'layout', label: 'Layout' },
            { key: 'behaviour', label: 'Behaviour' },
            { key: 'styling', label: 'Styling' },
        ];
        return html `
      <div class="tab-switcher" role="tablist">
        ${tabs.map(t => html `
          <button
            role="tab"
            aria-selected=${this._activeTab === t.key}
            class="${this._activeTab === t.key ? 'active' : ''}"
            @click=${() => { this._activeTab = t.key; }}>
            ${t.label}
          </button>
        `)}
      </div>
    `;
    }
    render() {
        return html `
      <div>
        ${this._renderTabSwitcher()}

        ${this._activeTab === 'layout' ? html `
          <div class="settings-category">
            ${this.renderContainerSection()}
            ${this.renderTitleBarSection()}
            ${this.renderToolbarSection()}
          </div>
        ` : nothing}

        ${this._activeTab === 'behaviour' ? html `
          <div class="settings-category">
            ${this.renderGridOptionsSection()}
            ${this.renderRowGroupingSection()}
            ${this.renderAggregationSection()}
            ${this.renderBehaviourSection()}
          </div>
        ` : nothing}

        ${this._activeTab === 'styling' ? html `
          <div class="settings-category">
            ${this.renderGridLinesSection()}
            ${this.renderTypographySection()}
            ${this.renderSectionColorsSection()}
          </div>
        ` : nothing}
      </div>
    `;
    }
};
__decorate([
    property({ attribute: false })
], PhzAdminTableSettings.prototype, "settings", void 0);
__decorate([
    property({ type: Array })
], PhzAdminTableSettings.prototype, "columnFields", void 0);
__decorate([
    property({ attribute: false })
], PhzAdminTableSettings.prototype, "columnTypes", void 0);
__decorate([
    state()
], PhzAdminTableSettings.prototype, "_activeTab", void 0);
PhzAdminTableSettings = __decorate([
    safeCustomElement('phz-admin-table-settings')
], PhzAdminTableSettings);
export { PhzAdminTableSettings };
//# sourceMappingURL=phz-admin-table-settings.js.map