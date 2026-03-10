/**
 * @phozart/phz-grid-admin — Column Configurator (Dual-List Picker)
 *
 * Side-by-side Available/Selected panels with search, drag-to-reorder,
 * multi-select, move up/down, and per-column settings (type, status colors,
 * bar thresholds, date formats).
 */

import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import { adminBaseStyles } from './shared-styles.js';
import type { ColumnColorThreshold, ColumnFormatting } from '@phozart/phz-engine';

export type { ColumnColorThreshold, ColumnFormatting };

interface ColumnItem {
  field: string;
  header: string;
  visible: boolean;
  width?: number;
}

const FONT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: "'Inter', sans-serif", label: 'Inter' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: "'Courier New', monospace", label: 'Courier' },
  { value: "ui-monospace, 'Cascadia Code', 'Fira Code', monospace", label: 'Monospace' },
];

const THRESHOLD_OPERATORS = [
  { value: 'gt', label: '>' },
  { value: 'gte', label: '>=' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '<=' },
  { value: 'eq', label: '=' },
  { value: 'contains', label: 'Contains' },
];

const COLUMN_TYPES = [
  { value: 'string', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'Date & Time' },
  { value: 'status', label: 'Status' },
  { value: 'bar', label: 'Progress Bar' },
  { value: 'link', label: 'Link' },
];

const DATE_FORMAT_PRESETS = [
  { value: 'dd/mm/yyyy', label: 'dd/mm/yyyy' },
  { value: 'mm/dd/yyyy', label: 'mm/dd/yyyy' },
  { value: 'yyyy-mm-dd', label: 'yyyy-mm-dd' },
  { value: 'dd mmmm yyyy', label: 'dd mmmm yyyy' },
  { value: 'mmmm dd, yyyy', label: 'mmmm dd, yyyy' },
  { value: 'dd/mm/yyyy hh24:mi', label: 'dd/mm/yyyy hh24:mi' },
  { value: 'mm/dd/yyyy hh12:mi AM', label: 'mm/dd/yyyy hh12:mi AM' },
  { value: 'yyyy-mm-dd hh24:mi:ss', label: 'yyyy-mm-dd hh24:mi:ss' },
];

interface StatusColorEntry {
  value: string;
  bg: string;
  color: string;
  dot: string;
}

@safeCustomElement('phz-admin-columns')
export class PhzAdminColumns extends LitElement {
  static styles = [
    adminBaseStyles,
    css`
      .dual-list {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .panel {
        display: flex;
        flex-direction: column;
        border-radius: 12px;
        overflow: hidden;
        min-height: 200px;
        box-shadow: var(--phz-admin-shadow-md);
        background: white;
      }

      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        background: #FAFAF9;
        box-shadow: 0 1px 2px rgba(28,25,23,0.06);
        font-size: 13px;
        font-weight: 700;
        color: #44403C;
      }

      .panel-count {
        font-weight: 400;
        color: #78716C;
        font-size: 12px;
      }

      .panel-search {
        padding: 8px;
        border-bottom: 1px solid #E7E5E4;
      }

      .panel-search input {
        width: 100%;
        padding: 6px 10px;
        border: 1px solid #D6D3D1;
        border-radius: 8px;
        font-size: 12px;
        background: white;
        color: #1C1917;
      }

      .panel-search input:focus {
        outline: none;
        border-color: #3B82F6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
      }

      .panel-list {
        flex: 1;
        overflow-y: auto;
        max-height: 340px;
        padding: 4px;
      }

      .panel-item {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        border-radius: 8px;
        font-size: 12px;
        color: #1C1917;
        cursor: pointer;
        user-select: none;
        transition: all 0.15s;
      }

      .panel-item:hover { background: #F5F5F4; transform: translateY(-1px); }
      .panel-item--selected { background: #EFF6FF; box-shadow: var(--phz-admin-shadow-sm); }
      .panel-item--selected:hover { background: #DBEAFE; }

      .panel-item--drag-over {
        border-top: 2px solid #3B82F6;
      }

      /* Selected panel items */
      .sel-item__drag {
        cursor: grab;
        color: #A8A29E;
        font-size: 14px;
        flex-shrink: 0;
        line-height: 1;
      }

      .sel-item__drag:active { cursor: grabbing; }

      .sel-item__label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

      .sel-item__gear {
        background: none;
        border: none;
        color: #A8A29E;
        cursor: pointer;
        font-size: 14px;
        padding: 2px;
        line-height: 1;
        border-radius: 8px;
        flex-shrink: 0;
        min-width: 36px;
        min-height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .sel-item__gear:hover { color: #3B82F6; background: #EFF6FF; }
      .sel-item__gear--active { color: #3B82F6; }

      .sel-item__remove {
        background: none;
        border: none;
        color: #A8A29E;
        cursor: pointer;
        font-size: 14px;
        padding: 2px;
        line-height: 1;
        border-radius: 8px;
        flex-shrink: 0;
        min-width: 36px;
        min-height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .sel-item__remove:hover { color: #DC2626; background: #FEF2F2; }

      .panel-footer {
        display: flex;
        gap: 4px;
        padding: 8px;
        box-shadow: 0 -1px 2px rgba(28,25,23,0.06);
        background: #FAFAF9;
      }

      .panel-footer button {
        flex: 1;
        padding: 6px 10px;
        border: 1px solid #D6D3D1;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 500;
        background: white;
        color: #44403C;
        cursor: pointer;
        transition: all 0.15s;
      }

      .panel-footer button:hover { background: #F5F5F4; box-shadow: var(--phz-admin-shadow-sm); }
      .panel-footer button:disabled { opacity: 0.4; cursor: default; }

      /* Move up/down in selected footer */
      .sel-footer {
        display: flex;
        gap: 4px;
        padding: 8px;
        box-shadow: 0 -1px 2px rgba(28,25,23,0.06);
        background: #FAFAF9;
      }

      .sel-footer button {
        padding: 6px 10px;
        border: 1px solid #D6D3D1;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 500;
        background: white;
        color: #44403C;
        cursor: pointer;
        transition: all 0.15s;
      }

      .sel-footer button:hover { background: #F5F5F4; box-shadow: var(--phz-admin-shadow-sm); }
      .sel-footer button:disabled { opacity: 0.4; cursor: default; }

      .panel-empty {
        padding: 20px 12px;
        text-align: center;
        color: #A8A29E;
        font-size: 12px;
        font-style: italic;
      }

      /* ── Column settings panel ── */
      .col-settings {
        border-radius: 12px;
        margin-top: 10px;
        padding: 14px;
        background: #FAFAF9;
        box-shadow: var(--phz-admin-shadow-md);
      }
      .col-settings-title {
        font-size: 13px;
        font-weight: 700;
        color: #1C1917;
        margin-bottom: 12px;
      }
      .settings-row {
        display: flex;
        gap: 8px;
        align-items: center;
        margin-bottom: 8px;
      }
      .settings-row label {
        font-size: 12px;
        font-weight: 600;
        color: #44403C;
        min-width: 80px;
      }
      .settings-row select,
      .settings-row input[type="text"] {
        padding: 6px 10px;
        border: 1px solid #D6D3D1;
        border-radius: 8px;
        font-size: 12px;
        background: white;
        color: #1C1917;
        flex: 1;
      }
      .settings-row input[type="color"] {
        width: 28px;
        height: 26px;
        border: 1px solid #D6D3D1;
        border-radius: 8px;
        padding: 1px;
        cursor: pointer;
        flex-shrink: 0;
      }
      .settings-row input[type="number"] {
        width: 60px;
        padding: 6px 10px;
        border: 1px solid #D6D3D1;
        border-radius: 8px;
        font-size: 12px;
        background: white;
        color: #1C1917;
      }
      .status-color-list { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }
      .status-color-row { display: flex; gap: 6px; align-items: center; }
      .status-color-row input[type="text"] { width: 80px; flex: 0; }
      .threshold-list { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }
      .threshold-row { display: flex; gap: 6px; align-items: center; }
      .add-entry-btn {
        font-size: 12px;
        padding: 6px 12px;
        border: 1px dashed #D6D3D1;
        border-radius: 8px;
        background: white;
        color: #78716C;
        cursor: pointer;
        margin-top: 6px;
        transition: all 0.15s;
      }
      .add-entry-btn:hover { border-color: #3B82F6; color: #3B82F6; }
      .remove-entry-btn {
        background: none;
        border: none;
        color: #A8A29E;
        cursor: pointer;
        font-size: 12px;
        padding: 2px 4px;
        min-width: 28px;
        min-height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .remove-entry-btn:hover { color: #DC2626; }

      /* ── Per-column formatting ── */
      .fmt-section-title {
        font-size: 12px;
        font-weight: 700;
        color: #44403C;
        margin-top: 12px;
        margin-bottom: 8px;
      }
      .fmt-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      .fmt-row label {
        font-size: 12px;
        font-weight: 600;
        color: #78716C;
        min-width: 60px;
      }
      .fmt-row select {
        padding: 6px 8px;
        border: 1px solid #D6D3D1;
        border-radius: 8px;
        font-size: 12px;
        background: white;
        color: #1C1917;
        flex: 1;
      }
      .fmt-row input[type="number"] {
        width: 56px;
        padding: 6px 8px;
        border: 1px solid #D6D3D1;
        border-radius: 8px;
        font-size: 12px;
      }
      .fmt-btn-group {
        display: flex;
        gap: 4px;
      }
      .fmt-btn {
        width: 32px;
        height: 32px;
        border: 1px solid #D6D3D1;
        border-radius: 8px;
        background: white;
        color: #78716C;
        cursor: pointer;
        font-size: 12px;
        font-weight: 700;
        font-family: inherit;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: var(--phz-admin-shadow-sm);
        transition: all 0.15s;
        padding: 0;
      }
      .fmt-btn:hover { background: #F5F5F4; transform: translateY(-1px); box-shadow: var(--phz-admin-shadow-md); }
      .fmt-btn.active { background: #1C1917; color: white; border-color: #1C1917; }
      .fmt-align-group {
        display: flex;
        border-radius: 8px;
        border: 1px solid #D6D3D1;
        overflow: hidden;
      }
      .fmt-align-group button {
        width: 32px;
        height: 32px;
        border: none;
        cursor: pointer;
        background: white;
        color: #78716C;
        font-size: 12px;
        font-family: inherit;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.1s;
        padding: 0;
      }
      .fmt-align-group button:not(:last-child) { border-right: 1px solid #D6D3D1; }
      .fmt-align-group button:hover { background: #F5F5F4; }
      .fmt-align-group button.active { background: #1C1917; color: white; }

      /* ── Color & threshold styling ── */
      .fmt-color-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      .fmt-color-row label {
        font-size: 12px;
        font-weight: 600;
        color: #78716C;
        min-width: 60px;
      }
      .fmt-color-row input[type="color"] {
        width: 28px;
        height: 26px;
        border: 1px solid #D6D3D1;
        border-radius: 8px;
        padding: 1px;
        cursor: pointer;
      }
      .fmt-color-row input[type="text"] {
        width: 76px;
        padding: 4px 8px;
        border: 1px solid #D6D3D1;
        border-radius: 8px;
        font-size: 12px;
      }
      .threshold-section-title {
        font-size: 12px;
        font-weight: 700;
        color: #44403C;
        margin-top: 10px;
        margin-bottom: 6px;
      }
      .threshold-entry {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-bottom: 6px;
        flex-wrap: wrap;
      }
      .threshold-entry select {
        padding: 4px 6px;
        border: 1px solid #D6D3D1;
        border-radius: 8px;
        font-size: 12px;
        width: 60px;
      }
      .threshold-entry input[type="text"] {
        width: 64px;
        padding: 4px 8px;
        border: 1px solid #D6D3D1;
        border-radius: 8px;
        font-size: 12px;
      }
      .threshold-entry input[type="color"] {
        width: 24px;
        height: 22px;
        border: 1px solid #D6D3D1;
        border-radius: 8px;
        padding: 1px;
        cursor: pointer;
      }
      .threshold-entry .remove-btn {
        background: none;
        border: none;
        color: #A8A29E;
        cursor: pointer;
        font-size: 12px;
        padding: 2px 4px;
      }
      .threshold-entry .remove-btn:hover { color: #DC2626; }
      .add-threshold-btn {
        font-size: 12px;
        padding: 4px 10px;
        border: 1px dashed #D6D3D1;
        border-radius: 8px;
        background: white;
        color: #78716C;
        cursor: pointer;
        font-family: inherit;
        margin-top: 4px;
        transition: all 0.15s;
      }
      .add-threshold-btn:hover { border-color: #3B82F6; color: #3B82F6; }
    `,
  ];

  @property({ type: Array }) columns: ColumnItem[] = [];
  @property({ attribute: false }) columnTypes: Record<string, string> = {};
  @property({ attribute: false }) statusColors: Record<string, { bg: string; color: string; dot: string }> = {};
  @property({ attribute: false }) barThresholds: Array<{ min: number; color: string }> = [];
  @property({ attribute: false }) dateFormats: Record<string, string> = {};
  @property({ attribute: false }) linkTemplates: Record<string, string> = {};
  @property({ attribute: false }) columnFormatting: Record<string, ColumnFormatting> = {};
  @property({ attribute: false }) numberFormats: Record<string, { decimals?: number; display?: string; prefix?: string; suffix?: string }> = {};

  @state() private availableFields: string[] = [];
  @state() private selectedFields: string[] = [];
  @state() private searchQuery: string = '';
  @state() private availableHighlighted: Set<string> = new Set();
  @state() private selectedHighlighted: Set<string> = new Set();
  @state() private dragField: string | null = null;
  @state() private dragOverField: string | null = null;
  @state() private settingsField: string | null = null;

  private columnMap = new Map<string, ColumnItem>();
  private skipNextColumnsSync = false;

  willUpdate(changed: Map<string, unknown>) {
    if (changed.has('columns')) {
      this.columnMap.clear();
      for (const col of this.columns) {
        this.columnMap.set(col.field, col);
      }

      if (this.skipNextColumnsSync) {
        this.skipNextColumnsSync = false;
        return;
      }

      const prevFields = new Set([...this.selectedFields, ...this.availableFields]);
      const newFields = new Set((this.columns ?? []).map(c => c.field));
      const isNewDataset = this.selectedFields.length === 0 && this.availableFields.length === 0;
      const fieldsChanged = newFields.size !== prevFields.size ||
        [...newFields].some(f => !prevFields.has(f));

      if (isNewDataset || fieldsChanged) {
        // Treat undefined visible as true (columns are visible by default)
        this.selectedFields = (this.columns ?? [])
          .filter(c => c.visible !== false)
          .map(c => c.field);
        this.availableFields = (this.columns ?? [])
          .filter(c => c.visible === false)
          .map(c => c.field)
          .sort((a, b) => this.getHeader(a).localeCompare(this.getHeader(b)));
        this.availableHighlighted = new Set();
        this.selectedHighlighted = new Set();
      }
    }
  }

  private getHeader(field: string): string {
    return this.columnMap.get(field)?.header || field;
  }

  private get filteredAvailable(): string[] {
    if (!this.searchQuery) return this.availableFields;
    const q = this.searchQuery.toLowerCase();
    return this.availableFields.filter(f =>
      this.getHeader(f).toLowerCase().includes(q)
    );
  }

  // ── Event emission ──

  private emitUpdate() {
    this.skipNextColumnsSync = true;
    this.dispatchEvent(new CustomEvent('columns-change', {
      bubbles: true,
      composed: true,
      detail: { action: 'update', visibleFields: [...this.selectedFields] },
    }));
  }

  private emitShowAll() {
    this.skipNextColumnsSync = true;
    this.dispatchEvent(new CustomEvent('columns-change', {
      bubbles: true,
      composed: true,
      detail: { action: 'show-all' },
    }));
  }

  private emitHideAll() {
    this.skipNextColumnsSync = true;
    this.dispatchEvent(new CustomEvent('columns-change', {
      bubbles: true,
      composed: true,
      detail: { action: 'hide-all' },
    }));
  }

  private emitColumnConfig(detail: Record<string, unknown>) {
    this.dispatchEvent(new CustomEvent('column-config-change', {
      bubbles: true,
      composed: true,
      detail,
    }));
  }

  // ── Available panel actions ──

  private handleAvailableClick(field: string, e: MouseEvent) {
    if (e.ctrlKey || e.metaKey) {
      const next = new Set(this.availableHighlighted);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      this.availableHighlighted = next;
    } else {
      this.availableHighlighted = new Set([field]);
    }
  }

  private handleAvailableDblClick(field: string) {
    this.addFields([field]);
  }

  private addFields(fields: string[]) {
    this.availableFields = this.availableFields.filter(f => !fields.includes(f));
    this.selectedFields = [...this.selectedFields, ...fields];
    this.availableHighlighted = new Set();
    this.emitUpdate();
  }

  private handleAddSelected() {
    if (this.availableHighlighted.size === 0) return;
    this.addFields([...this.availableHighlighted]);
  }

  private handleAddAll() {
    const toAdd = [...this.filteredAvailable];
    if (toAdd.length === 0) return;
    this.availableFields = this.availableFields.filter(f => !toAdd.includes(f));
    this.selectedFields = [...this.selectedFields, ...toAdd];
    this.availableHighlighted = new Set();
    if (this.availableFields.length === 0) {
      this.emitShowAll();
    } else {
      this.emitUpdate();
    }
  }

  // ── Selected panel actions ──

  private handleSelectedClick(field: string, e: MouseEvent) {
    if (e.ctrlKey || e.metaKey) {
      const next = new Set(this.selectedHighlighted);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      this.selectedHighlighted = next;
    } else {
      this.selectedHighlighted = new Set([field]);
    }
    // Auto-open settings for clicked column
    this.settingsField = field;
  }

  private removeFields(fields: string[], keepSettings = false) {
    this.selectedFields = this.selectedFields.filter(f => !fields.includes(f));
    this.availableFields = [...this.availableFields, ...fields].sort(
      (a, b) => this.getHeader(a).localeCompare(this.getHeader(b))
    );
    this.selectedHighlighted = new Set();
    if (!keepSettings && this.settingsField && fields.includes(this.settingsField)) {
      this.settingsField = null;
    }
    this.emitUpdate();
  }

  private handleRemoveItem(field: string) {
    this.removeFields([field]);
  }

  private handleRemoveSelected() {
    if (this.selectedHighlighted.size === 0) return;
    this.removeFields([...this.selectedHighlighted]);
  }

  private handleRemoveAll() {
    if (this.selectedFields.length === 0) return;
    this.availableFields = [...this.availableFields, ...this.selectedFields].sort(
      (a, b) => this.getHeader(a).localeCompare(this.getHeader(b))
    );
    this.selectedFields = [];
    this.selectedHighlighted = new Set();
    this.settingsField = null;
    this.emitHideAll();
  }

  // ── Move up/down ──

  private handleMoveUp() {
    if (this.selectedHighlighted.size !== 1) return;
    const field = [...this.selectedHighlighted][0];
    const idx = this.selectedFields.indexOf(field);
    if (idx <= 0) return;
    const next = [...this.selectedFields];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    this.selectedFields = next;
    this.emitUpdate();
  }

  private handleMoveDown() {
    if (this.selectedHighlighted.size !== 1) return;
    const field = [...this.selectedHighlighted][0];
    const idx = this.selectedFields.indexOf(field);
    if (idx < 0 || idx >= this.selectedFields.length - 1) return;
    const next = [...this.selectedFields];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    this.selectedFields = next;
    this.emitUpdate();
  }

  // ── Drag & Drop (selected panel reorder) ──

  private handleDragStart(field: string, e: DragEvent) {
    this.dragField = field;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', field);
    }
  }

  private handleDragOver(field: string, e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    if (field !== this.dragField) {
      this.dragOverField = field;
    }
  }

  private handleDragLeave(_field: string) {
    this.dragOverField = null;
  }

  private handleDrop(targetField: string, e: DragEvent) {
    e.preventDefault();
    this.dragOverField = null;
    if (!this.dragField || this.dragField === targetField) {
      this.dragField = null;
      return;
    }
    const next = this.selectedFields.filter(f => f !== this.dragField);
    const targetIdx = next.indexOf(targetField);
    next.splice(targetIdx, 0, this.dragField!);
    this.selectedFields = next;
    this.dragField = null;
    this.emitUpdate();
  }

  private handleDragEnd() {
    this.dragField = null;
    this.dragOverField = null;
  }

  // ── Search ──

  private handleSearch(e: Event) {
    this.searchQuery = (e.target as HTMLInputElement).value;
  }

  // ── Column settings handlers ──

  private handleToggleSettings(field: string) {
    this.settingsField = this.settingsField === field ? null : field;
  }

  private handleColumnTypeChange(field: string, type: string) {
    this.emitColumnConfig({ field, type });
  }

  private handleDateFormatChange(field: string, dateFormat: string) {
    this.emitColumnConfig({ field, dateFormat });
  }

  private handleLinkTemplateChange(field: string, linkTemplate: string) {
    this.emitColumnConfig({ field, linkTemplate });
  }

  private handleNumberFormatChange(field: string, key: string, value: unknown) {
    const current = this.numberFormats[field] || {};
    const updated = { ...current, [key]: value };
    this.emitColumnConfig({ field, numberFormat: updated });
  }

  private handleStatusColorChange(field: string, statusValue: string, key: 'bg' | 'color' | 'dot', value: string) {
    const current = { ...(this.statusColors || {}) };
    const entry = current[statusValue] || { bg: '#ffffff', color: '#000000', dot: '#000000' };
    current[statusValue] = { ...entry, [key]: value };
    this.emitColumnConfig({ field, statusColors: current });
  }

  private handleStatusValueRename(field: string, oldValue: string, newValue: string) {
    const current = { ...(this.statusColors || {}) };
    if (oldValue !== newValue && current[oldValue]) {
      current[newValue] = current[oldValue];
      delete current[oldValue];
      this.emitColumnConfig({ field, statusColors: current });
    }
  }

  private handleAddStatusValue(field: string) {
    const current = { ...(this.statusColors || {}) };
    const name = 'Status ' + (Object.keys(current).length + 1);
    current[name] = { bg: '#EFF6FF', color: '#3B82F6', dot: '#3B82F6' };
    this.emitColumnConfig({ field, statusColors: current });
  }

  private handleRemoveStatusValue(field: string, statusValue: string) {
    const current = { ...(this.statusColors || {}) };
    delete current[statusValue];
    this.emitColumnConfig({ field, statusColors: current });
  }

  private handleThresholdChange(field: string, index: number, key: 'min' | 'color', value: string) {
    const current = [...(this.barThresholds || [])];
    if (current[index]) {
      current[index] = { ...current[index], [key]: key === 'min' ? Number(value) : value };
      this.emitColumnConfig({ field, barThresholds: current });
    }
  }

  private handleAddThreshold(field: string) {
    const current = [...(this.barThresholds || [])];
    current.push({ min: 0, color: '#3B82F6' });
    this.emitColumnConfig({ field, barThresholds: current });
  }

  private handleRemoveThreshold(field: string, index: number) {
    const current = [...(this.barThresholds || [])];
    current.splice(index, 1);
    this.emitColumnConfig({ field, barThresholds: current });
  }

  // ── Render column settings panel ──

  private renderColumnSettings(field: string) {
    const colType = this.columnTypes[field] || 'string';
    const showDateFormat = colType === 'date' || colType === 'datetime';
    const showStatusColors = colType === 'status';
    const showBarThresholds = colType === 'bar';
    const showLinkTemplate = colType === 'link';
    const showNumberFormat = colType === 'number' || colType === 'bar';
    const numFmt = this.numberFormats[field] || {};

    const isVisible = this.selectedFields.includes(field);

    return html`
      <div class="col-settings">
        <div class="col-settings-title">${this.getHeader(field)} Settings</div>

        <div class="settings-row" style="align-items:center">
          <label>Visible</label>
          <label class="phz-admin-toggle" style="margin-left:auto">
            <input type="checkbox" .checked=${isVisible}
              @change=${(e: Event) => {
                const checked = (e.target as HTMLInputElement).checked;
                if (checked && !isVisible) {
                  this.addFields([field]);
                } else if (!checked && isVisible) {
                  this.removeFields([field], true);
                }
              }}>
            <span class="phz-admin-toggle-slider"></span>
          </label>
        </div>

        <div class="settings-row">
          <label>Type</label>
          <select .value=${colType}
                  @change=${(e: Event) => this.handleColumnTypeChange(field, (e.target as HTMLSelectElement).value)}>
            ${COLUMN_TYPES.map(t => html`<option value=${t.value} ?selected=${t.value === colType}>${t.label}</option>`)}
          </select>
        </div>

        ${showNumberFormat ? html`
          <div class="settings-row">
            <label>Display</label>
            <select .value=${numFmt.display || 'number'}
                    @change=${(e: Event) => this.handleNumberFormatChange(field, 'display', (e.target as HTMLSelectElement).value)}>
              <option value="number" ?selected=${(numFmt.display || 'number') === 'number'}>Number</option>
              <option value="percent" ?selected=${numFmt.display === 'percent'}>Percentage</option>
              <option value="currency" ?selected=${numFmt.display === 'currency'}>Currency</option>
            </select>
          </div>
          <div class="settings-row">
            <label>Decimals</label>
            <input type="number" .value=${String(numFmt.decimals ?? '')} min="0" max="6"
                   placeholder="auto"
                   style="width:60px"
                   @change=${(e: Event) => {
                     const v = (e.target as HTMLInputElement).value;
                     this.handleNumberFormatChange(field, 'decimals', v ? Number(v) : undefined);
                   }}>
          </div>
          ${numFmt.display === 'currency' ? html`
            <div class="settings-row">
              <label>Prefix</label>
              <input type="text" .value=${numFmt.prefix || ''}
                     placeholder="$"
                     style="width:60px;flex:0"
                     @change=${(e: Event) => this.handleNumberFormatChange(field, 'prefix', (e.target as HTMLInputElement).value)}>
            </div>
          ` : nothing}
        ` : nothing}

        ${showDateFormat ? html`
          <div class="settings-row">
            <label>Date Format</label>
            <select .value=${this.dateFormats[field] || 'dd/mm/yyyy'}
                    @change=${(e: Event) => this.handleDateFormatChange(field, (e.target as HTMLSelectElement).value)}>
              ${DATE_FORMAT_PRESETS.map(p => html`<option value=${p.value} ?selected=${p.value === (this.dateFormats[field] || 'dd/mm/yyyy')}>${p.label}</option>`)}
            </select>
          </div>
          <div class="settings-row">
            <label>Custom</label>
            <input type="text" .value=${this.dateFormats[field] || ''}
                   placeholder="e.g. dd/mm/yyyy hh24:mi"
                   @change=${(e: Event) => this.handleDateFormatChange(field, (e.target as HTMLInputElement).value)}>
          </div>
        ` : nothing}

        ${showStatusColors ? html`
          <div style="margin-bottom: 8px;">
            <label style="font-size: 11px; font-weight: 600; color: #44403C;">Status Colors</label>
            <div class="status-color-list">
              ${Object.entries(this.statusColors || {}).map(([sv, colors]) => html`
                <div class="status-color-row">
                  <input type="text" .value=${sv} style="width: 80px; padding: 4px 6px; border: 1px solid #D6D3D1; border-radius: 4px; font-size: 11px;"
                         @change=${(e: Event) => this.handleStatusValueRename(field, sv, (e.target as HTMLInputElement).value)}>
                  <input type="color" .value=${colors.bg}
                         title="Background"
                         @input=${(e: Event) => this.handleStatusColorChange(field, sv, 'bg', (e.target as HTMLInputElement).value)}>
                  <input type="color" .value=${colors.color}
                         title="Text"
                         @input=${(e: Event) => this.handleStatusColorChange(field, sv, 'color', (e.target as HTMLInputElement).value)}>
                  <input type="color" .value=${colors.dot}
                         title="Dot"
                         @input=${(e: Event) => this.handleStatusColorChange(field, sv, 'dot', (e.target as HTMLInputElement).value)}>
                  <button class="remove-entry-btn" title="Remove"
                          @click=${() => this.handleRemoveStatusValue(field, sv)}>&#x2715;</button>
                </div>
              `)}
            </div>
            <button class="add-entry-btn" @click=${() => this.handleAddStatusValue(field)}>+ Add Status Value</button>
          </div>
        ` : nothing}

        ${showBarThresholds ? html`
          <div style="margin-bottom: 8px;">
            <label style="font-size: 11px; font-weight: 600; color: #44403C;">Bar Thresholds</label>
            <div class="threshold-list">
              ${(this.barThresholds || []).map((t, i) => html`
                <div class="threshold-row">
                  <span style="font-size: 11px; color: #78716C;">Min:</span>
                  <input type="number" .value=${String(t.min)} style="width: 60px;"
                         @change=${(e: Event) => this.handleThresholdChange(field, i, 'min', (e.target as HTMLInputElement).value)}>
                  <input type="color" .value=${t.color}
                         @input=${(e: Event) => this.handleThresholdChange(field, i, 'color', (e.target as HTMLInputElement).value)}>
                  <button class="remove-entry-btn" title="Remove"
                          @click=${() => this.handleRemoveThreshold(field, i)}>&#x2715;</button>
                </div>
              `)}
            </div>
            <button class="add-entry-btn" @click=${() => this.handleAddThreshold(field)}>+ Add Threshold</button>
          </div>
        ` : nothing}

        ${showLinkTemplate ? html`
          <div class="settings-row">
            <label>URL Template</label>
            <input type="text" .value=${this.linkTemplates[field] || ''}
                   placeholder="https://example.com/{value}"
                   @change=${(e: Event) => this.handleLinkTemplateChange(field, (e.target as HTMLInputElement).value)}>
          </div>
          <div style="font-size: 10px; color: #78716C; margin-top: -4px; margin-bottom: 8px; padding-left: 88px;">
            Use {value} for cell value or {fieldName} for any row field
          </div>
        ` : nothing}

        ${this.renderColumnFormatting(field)}
      </div>
    `;
  }

  // ── Per-column formatting handlers ──

  private handleFormattingChange(field: string, key: string, value: unknown) {
    const current = this.columnFormatting[field] || {};
    const updated = { ...current, [key]: value };
    this.emitColumnConfig({ field, formatting: updated });
  }

  private renderColumnFormatting(field: string) {
    const fmt = this.columnFormatting[field] || {};
    const colType = this.columnTypes[field] || 'string';
    // Number columns get auto-monospace from the grid
    const isMonoType = colType === 'number';
    const thresholds: ColumnColorThreshold[] = fmt.colorThresholds || [];

    return html`
      <div class="fmt-section-title">Formatting</div>
      <div class="fmt-row">
        <label>Font</label>
        <select .value=${fmt.fontFamily || ''}
          @change=${(e: Event) => this.handleFormattingChange(field, 'fontFamily', (e.target as HTMLSelectElement).value)}>
          ${FONT_OPTIONS.map(f => {
            let label = f.label;
            if (f.value === '' && isMonoType && !fmt.fontFamily) label = 'Default (Monospace)';
            return html`<option value=${f.value} ?selected=${f.value === (fmt.fontFamily || '')}>${label}</option>`;
          })}
        </select>
      </div>
      <div class="fmt-row">
        <label>Size</label>
        <input type="number" .value=${String(fmt.fontSize || '')} min="10" max="20"
          placeholder="px"
          @change=${(e: Event) => {
            const v = (e.target as HTMLInputElement).value;
            this.handleFormattingChange(field, 'fontSize', v ? Number(v) : undefined);
          }}>
      </div>
      <div class="fmt-row">
        <label>Style</label>
        <div class="fmt-btn-group">
          <button class="fmt-btn ${fmt.bold ? 'active' : ''}"
            title="Bold"
            @click=${() => this.handleFormattingChange(field, 'bold', !fmt.bold)}>B</button>
          <button class="fmt-btn ${fmt.italic ? 'active' : ''}"
            title="Italic" style="font-style:italic"
            @click=${() => this.handleFormattingChange(field, 'italic', !fmt.italic)}>I</button>
          <button class="fmt-btn ${fmt.underline ? 'active' : ''}"
            title="Underline" style="text-decoration:underline"
            @click=${() => this.handleFormattingChange(field, 'underline', !fmt.underline)}>U</button>
        </div>
      </div>
      <div class="fmt-row">
        <label>H-Align</label>
        <div class="fmt-align-group">
          ${(['left', 'center', 'right'] as const).map(a => html`
            <button class="${fmt.hAlign === a ? 'active' : ''}"
              @click=${() => this.handleFormattingChange(field, 'hAlign', a)}>
              ${a === 'left' ? '\u2190' : a === 'center' ? '\u2194' : '\u2192'}
            </button>
          `)}
        </div>
      </div>
      <div class="fmt-row">
        <label>V-Align</label>
        <div class="fmt-align-group">
          ${(['top', 'middle', 'bottom'] as const).map(a => html`
            <button class="${fmt.vAlign === a ? 'active' : ''}"
              @click=${() => this.handleFormattingChange(field, 'vAlign', a)}>
              ${a === 'top' ? '\u2191' : a === 'middle' ? '\u2195' : '\u2193'}
            </button>
          `)}
        </div>
      </div>

      <div class="fmt-section-title">Column Colors</div>
      <div class="fmt-color-row">
        <label>Background</label>
        <input type="color" .value=${fmt.bgColor || '#FFFFFF'}
          @input=${(e: Event) => this.handleFormattingChange(field, 'bgColor', (e.target as HTMLInputElement).value)}>
        <input type="text" .value=${fmt.bgColor || ''}
          placeholder="#FFFFFF"
          @change=${(e: Event) => this.handleFormattingChange(field, 'bgColor', (e.target as HTMLInputElement).value)}>
      </div>
      <div class="fmt-color-row">
        <label>Text</label>
        <input type="color" .value=${fmt.textColor || '#1C1917'}
          @input=${(e: Event) => this.handleFormattingChange(field, 'textColor', (e.target as HTMLInputElement).value)}>
        <input type="text" .value=${fmt.textColor || ''}
          placeholder="#1C1917"
          @change=${(e: Event) => this.handleFormattingChange(field, 'textColor', (e.target as HTMLInputElement).value)}>
      </div>

      <div class="threshold-section-title">Conditional Colors</div>
      ${thresholds.map((t, i) => html`
        <div class="threshold-entry">
          <select .value=${t.operator}
            @change=${(e: Event) => this.handleThresholdEntryChange(field, i, 'operator', (e.target as HTMLSelectElement).value)}>
            ${THRESHOLD_OPERATORS.map(op => html`<option value=${op.value} ?selected=${op.value === t.operator}>${op.label}</option>`)}
          </select>
          <input type="text" .value=${t.value}
            placeholder="value"
            @change=${(e: Event) => this.handleThresholdEntryChange(field, i, 'value', (e.target as HTMLInputElement).value)}>
          <input type="color" .value=${t.bgColor}
            title="BG"
            @input=${(e: Event) => this.handleThresholdEntryChange(field, i, 'bgColor', (e.target as HTMLInputElement).value)}>
          <input type="color" .value=${t.textColor}
            title="Text"
            @input=${(e: Event) => this.handleThresholdEntryChange(field, i, 'textColor', (e.target as HTMLInputElement).value)}>
          <button class="remove-btn" title="Remove"
            @click=${() => this.handleRemoveThresholdEntry(field, i)}>&#x2715;</button>
        </div>
      `)}
      <button class="add-threshold-btn" @click=${() => this.handleAddThresholdEntry(field)}>+ Add Rule</button>
    `;
  }

  private handleThresholdEntryChange(field: string, index: number, key: string, value: string) {
    const fmt = this.columnFormatting[field] || {};
    const thresholds = [...(fmt.colorThresholds || [])];
    if (thresholds[index]) {
      thresholds[index] = { ...thresholds[index], [key]: value };
      this.handleFormattingChange(field, 'colorThresholds', thresholds);
    }
  }

  private handleAddThresholdEntry(field: string) {
    const fmt = this.columnFormatting[field] || {};
    const thresholds = [...(fmt.colorThresholds || [])];
    thresholds.push({ operator: 'gte', value: '', bgColor: '#FEF3C7', textColor: '#92400E' });
    this.handleFormattingChange(field, 'colorThresholds', thresholds);
  }

  private handleRemoveThresholdEntry(field: string, index: number) {
    const fmt = this.columnFormatting[field] || {};
    const thresholds = [...(fmt.colorThresholds || [])];
    thresholds.splice(index, 1);
    this.handleFormattingChange(field, 'colorThresholds', thresholds);
  }

  // ── Render ──

  render() {
    const filteredAvail = this.filteredAvailable;

    return html`
      <div>
        <div class="dual-list">
          <!-- Available Panel -->
          <div class="panel">
            <div class="panel-header">
              Available
              <span class="panel-count">(${this.availableFields.length})</span>
            </div>
            <div class="panel-search">
              <input type="text"
                     placeholder="Search columns..."
                     .value=${this.searchQuery}
                     @input=${this.handleSearch}>
            </div>
            <div class="panel-list" role="listbox" aria-label="Available columns">
              ${filteredAvail.length === 0
                ? html`<div class="panel-empty">
                    ${this.searchQuery ? 'No matches' : 'All columns selected'}
                  </div>`
                : filteredAvail.map(field => html`
                  <div class="panel-item ${this.availableHighlighted.has(field) ? 'panel-item--selected' : ''}"
                       role="option"
                       aria-selected=${this.availableHighlighted.has(field)}
                       @click=${(e: MouseEvent) => this.handleAvailableClick(field, e)}
                       @dblclick=${() => this.handleAvailableDblClick(field)}>
                    <span title="${this.getHeader(field)}">${this.getHeader(field)}</span>
                  </div>
                `)
              }
            </div>
            <div class="panel-footer">
              <button @click=${this.handleAddSelected}
                      ?disabled=${this.availableHighlighted.size === 0}>
                Add &#x2192;
              </button>
              <button @click=${this.handleAddAll}
                      ?disabled=${filteredAvail.length === 0}>
                Add All &#x21C9;
              </button>
            </div>
          </div>

          <!-- Selected Panel -->
          <div class="panel">
            <div class="panel-header">
              Selected
              <span class="panel-count">(${this.selectedFields.length})</span>
            </div>
            <div class="panel-list" role="listbox" aria-label="Selected columns">
              ${this.selectedFields.length === 0
                ? html`<div class="panel-empty">No columns selected</div>`
                : this.selectedFields.map(field => html`
                  <div class="panel-item ${this.selectedHighlighted.has(field) ? 'panel-item--selected' : ''} ${this.dragOverField === field ? 'panel-item--drag-over' : ''}"
                       role="option"
                       aria-selected=${this.selectedHighlighted.has(field)}
                       draggable="true"
                       @click=${(e: MouseEvent) => this.handleSelectedClick(field, e)}
                       @dblclick=${() => this.handleRemoveItem(field)}
                       @dragstart=${(e: DragEvent) => this.handleDragStart(field, e)}
                       @dragover=${(e: DragEvent) => this.handleDragOver(field, e)}
                       @dragleave=${() => this.handleDragLeave(field)}
                       @drop=${(e: DragEvent) => this.handleDrop(field, e)}
                       @dragend=${this.handleDragEnd}>
                    <span class="sel-item__drag" aria-hidden="true">&#x2630;</span>
                    <span class="sel-item__label" title="${this.getHeader(field)}">${this.getHeader(field)}</span>
                    <button class="sel-item__gear ${this.settingsField === field ? 'sel-item__gear--active' : ''}"
                            title="Settings for ${this.getHeader(field)}"
                            @click=${(e: MouseEvent) => { e.stopPropagation(); this.handleToggleSettings(field); }}>
                      &#x2699;
                    </button>
                    <button class="sel-item__remove"
                            title="Remove ${this.getHeader(field)}"
                            @click=${(e: MouseEvent) => { e.stopPropagation(); this.handleRemoveItem(field); }}>
                      &#x2715;
                    </button>
                  </div>
                `)
              }
            </div>
            <div class="sel-footer">
              <button @click=${this.handleMoveUp}
                      ?disabled=${this.selectedHighlighted.size !== 1 || this.selectedFields.indexOf([...this.selectedHighlighted][0]) <= 0}
                      title="Move up">
                &#x25B2;
              </button>
              <button @click=${this.handleMoveDown}
                      ?disabled=${this.selectedHighlighted.size !== 1 || this.selectedFields.indexOf([...this.selectedHighlighted][0]) >= this.selectedFields.length - 1}
                      title="Move down">
                &#x25BC;
              </button>
              <button @click=${this.handleRemoveSelected}
                      ?disabled=${this.selectedHighlighted.size === 0}
                      style="margin-left: auto;">
                &#x2190; Remove
              </button>
              <button @click=${this.handleRemoveAll}
                      ?disabled=${this.selectedFields.length === 0}>
                &#x21C7; Remove All
              </button>
            </div>
          </div>
        </div>

        ${this.settingsField ? this.renderColumnSettings(this.settingsField) : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-admin-columns': PhzAdminColumns;
  }
}
