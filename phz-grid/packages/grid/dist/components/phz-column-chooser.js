var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * @phozart/grid — <phz-column-chooser>
 *
 * Column management panel: show/hide columns, drag-reorder,
 * save/load user profiles, add/edit computed columns.
 * Opens as a right-edge slide-out panel that fills the full viewport height.
 *
 * Role-gated feature access:
 *   viewer — read-only column list (no checkboxes, no drag, no footer)
 *   user   — show/hide, reorder, profiles, footer buttons
 *   editor — above + per-column settings (rename, type, date format, width)
 *   admin  — above + computed columns
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { DATE_FORMAT_PRESETS } from '../formatters/date-formatter.js';
const COLUMN_TYPES = [
    { value: 'string', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'datetime', label: 'Date & Time' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'status', label: 'Status' },
    { value: 'bar', label: 'Progress Bar' },
];
const COMPUTED_TYPES = [
    { value: 'sum', label: 'Sum' },
    { value: 'avg', label: 'Average' },
    { value: 'count', label: 'Count' },
    { value: 'max', label: 'Max' },
    { value: 'min', label: 'Min' },
    { value: 'distinct_count', label: 'Distinct Count' },
    { value: 'concat', label: 'Concat' },
    { value: 'custom', label: 'Custom Formula' },
];
const NUMERIC_ONLY_TYPES = new Set(['sum', 'avg', 'max', 'min']);
let PhzColumnChooser = class PhzColumnChooser extends LitElement {
    constructor() {
        super(...arguments);
        this.open = false;
        this.columns = [];
        this.columnState = null;
        this.profiles = [];
        this.computedColumns = [];
        this.availableFields = [];
        this.userRole = 'user';
        this.restrictedFields = new Set();
        this.dateFormats = {};
        this.localVisibility = {};
        this.localOrder = [];
        this.searchQuery = '';
        this.draggedField = null;
        this.profileName = '';
        this.sortAlpha = false;
        this.profilesExpanded = false;
        this.computedSectionExpanded = false;
        this.localComputedColumns = [];
        this.expandedSettingsField = null;
        this.cleanup = null;
    }
    // --- Role-based feature gates ---
    get canToggle() { return this.userRole !== 'viewer'; }
    get canReorder() { return this.userRole !== 'viewer'; }
    get canEditSettings() { return this.userRole === 'editor' || this.userRole === 'admin'; }
    get canCreateComputed() { return this.userRole === 'admin'; }
    static { this.styles = css `
    :host {
      position: fixed;
      top: 0; left: 0;
      width: 0; height: 0;
      z-index: 10001;
      pointer-events: none;
      overflow: visible;
    }
    :host([open]) { pointer-events: auto; }

    /* Backdrop overlay */
    .phz-cc__backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(28, 25, 23, 0.25);
      opacity: 0;
      transition: opacity 250ms cubic-bezier(0,0,0.2,1);
    }
    :host([open]) .phz-cc__backdrop {
      opacity: 1;
    }

    /* Slide-out panel — right-edge, full viewport height */
    .phz-cc {
      position: fixed;
      top: 0;
      right: 0;
      width: 320px;
      height: 100vh;
      background: var(--phz-popover-bg, #FEFDFB);
      border-left: 1px solid var(--phz-popover-border, #E7E5E4);
      box-shadow: -8px 0 30px rgba(28,25,23,0.12), -2px 0 8px rgba(28,25,23,0.06);
      font-family: var(--phz-font-family-base, system-ui, -apple-system, sans-serif);
      font-size: 0.8125rem;
      color: #1C1917;
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    :host([open]) .phz-cc {
      transform: translateX(0);
    }

    /* ─── Sticky header ─── */
    .phz-cc__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 16px 12px;
      border-bottom: 1px solid #E7E5E4;
      flex-shrink: 0;
    }

    .phz-cc__header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .phz-cc__title {
      font-weight: 600;
      font-size: 0.875rem;
    }

    .phz-cc__count {
      font-size: 0.6875rem;
      color: #78716C;
      background: #F5F5F4;
      padding: 2px 8px;
      border-radius: 10px;
    }

    .phz-cc__role-badge {
      font-size: 0.5625rem;
      color: white;
      background: #78716C;
      padding: 1px 6px;
      border-radius: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }
    .phz-cc__role-badge--editor { background: #3B82F6; }
    .phz-cc__role-badge--admin { background: #7C3AED; }

    .phz-cc__close {
      width: 28px; height: 28px;
      border: none; background: transparent;
      border-radius: 6px; cursor: pointer;
      color: #78716C; font-size: 16px;
      display: flex; align-items: center; justify-content: center;
      transition: background 100ms;
      flex-shrink: 0;
    }
    .phz-cc__close:hover { background: #F5F5F4; color: #1C1917; }

    /* ─── Sticky search + sort ─── */
    .phz-cc__search {
      padding: 8px 12px;
      flex-shrink: 0;
      border-bottom: 1px solid #F5F5F4;
    }

    .phz-cc__search input {
      width: 100%; padding: 7px 10px;
      border: 1px solid #D6D3D1; border-radius: 8px;
      font-size: 0.8125rem; font-family: inherit;
      background: #FFFFFF; color: #1C1917; outline: none;
      box-sizing: border-box;
    }
    .phz-cc__search input:focus {
      border-color: var(--phz-color-primary, #3B82F6);
      box-shadow: 0 0 0 2px rgba(59,130,246,0.15);
    }

    .phz-cc__sort-toggle {
      display: flex;
      gap: 2px;
      padding: 2px;
      background: #F5F5F4;
      border-radius: 6px;
      margin-top: 6px;
    }

    .phz-cc__sort-btn {
      padding: 3px 10px;
      border: none;
      border-radius: 4px;
      font-size: 0.6875rem;
      font-family: inherit;
      cursor: pointer;
      background: transparent;
      color: #57534E;
      transition: all 100ms;
    }

    .phz-cc__sort-btn--active {
      background: #FFFFFF;
      color: #1C1917;
      box-shadow: 0 1px 2px rgba(0,0,0,0.06);
    }

    /* ─── Scrollable column list (fills remaining height) ─── */
    .phz-cc__list {
      flex: 1;
      overflow-y: auto;
      padding: 4px 8px;
      min-height: 0;
    }
    .phz-cc__list::-webkit-scrollbar { width: 4px; }
    .phz-cc__list::-webkit-scrollbar-thumb { background: #D6D3D1; border-radius: 2px; }

    .phz-cc__item {
      border-radius: 8px;
      transition: background 100ms;
      user-select: none;
    }
    .phz-cc__item:hover { background: rgba(59,130,246,0.06); }
    .phz-cc__item--dragging { opacity: 0.4; }
    .phz-cc__item--drop-target { border-top: 2px solid var(--phz-color-primary, #3B82F6); }

    .phz-cc__item-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 8px;
      cursor: grab;
    }

    .phz-cc__drag-handle {
      color: #A8A29E; font-size: 14px; cursor: grab;
      flex-shrink: 0; width: 16px; text-align: center;
    }

    .phz-cc__checkbox {
      width: 16px; height: 16px;
      border: 2px solid #D6D3D1; border-radius: 4px;
      flex-shrink: 0; display: flex;
      align-items: center; justify-content: center;
      background: #FFFFFF; cursor: pointer;
      transition: all 150ms;
    }
    .phz-cc__checkbox--checked {
      background: var(--phz-color-primary, #3B82F6);
      border-color: var(--phz-color-primary, #3B82F6);
      color: white;
    }
    .phz-cc__checkbox-icon { font-size: 11px; }

    .phz-cc__col-name { flex: 1; }

    .phz-cc__settings-toggle {
      width: 20px; height: 20px; border: none;
      background: transparent; color: #A8A29E;
      cursor: pointer; font-size: 12px; line-height: 1;
      border-radius: 4px; display: flex;
      align-items: center; justify-content: center;
      flex-shrink: 0; transition: all 100ms;
    }
    .phz-cc__settings-toggle:hover { background: #F5F5F4; color: #1C1917; }
    .phz-cc__settings-toggle--open { color: #3B82F6; transform: rotate(90deg); }

    /* ─── Inline column settings editor ─── */
    .phz-cc__settings {
      padding: 6px 8px 10px 40px;
      display: flex; flex-direction: column; gap: 5px;
    }
    .phz-cc__settings-row {
      display: flex; align-items: center; gap: 6px;
    }
    .phz-cc__settings-label {
      font-size: 0.625rem; color: #78716C;
      width: 44px; flex-shrink: 0; text-align: right;
    }
    .phz-cc__settings-input {
      flex: 1; padding: 3px 6px;
      border: 1px solid #D6D3D1; border-radius: 4px;
      font-size: 0.6875rem; font-family: inherit;
      background: white; color: #1C1917; outline: none;
      box-sizing: border-box;
    }
    .phz-cc__settings-input:focus {
      border-color: var(--phz-color-primary, #3B82F6);
    }
    .phz-cc__settings-select {
      flex: 1; padding: 3px 6px;
      border: 1px solid #D6D3D1; border-radius: 4px;
      font-size: 0.6875rem; font-family: inherit;
      background: white; color: #1C1917; outline: none;
    }

    /* ─── Collapsible section (shared) ─── */
    .phz-cc__section {
      padding: 0;
      border-top: 1px solid #E7E5E4;
      flex-shrink: 0;
    }

    .phz-cc__section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #78716C;
      user-select: none;
    }
    .phz-cc__section-header:hover { color: #1C1917; }

    .phz-cc__section-chevron {
      font-size: 10px;
      transition: transform 200ms;
      color: #A8A29E;
    }
    .phz-cc__section-chevron--open {
      transform: rotate(180deg);
    }

    .phz-cc__section-body {
      padding: 0 12px 10px;
    }

    /* ─── Collapsible profiles section (reuse shared styles) ─── */
    .phz-cc__profiles { padding: 0; border-top: 1px solid #E7E5E4; flex-shrink: 0; }
    .phz-cc__profiles-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 12px; cursor: pointer; font-size: 0.6875rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.5px; color: #78716C; user-select: none;
    }
    .phz-cc__profiles-header:hover { color: #1C1917; }
    .phz-cc__profiles-chevron { font-size: 10px; transition: transform 200ms; color: #A8A29E; }
    .phz-cc__profiles-chevron--open { transform: rotate(180deg); }
    .phz-cc__profiles-body { padding: 0 12px 10px; }

    .phz-cc__profile-row {
      display: flex; gap: 6px; margin-bottom: 6px;
    }

    .phz-cc__profile-input {
      flex: 1; padding: 5px 8px;
      border: 1px solid #D6D3D1; border-radius: 6px;
      font-size: 0.75rem; font-family: inherit;
      outline: none; box-sizing: border-box;
    }

    .phz-cc__profile-btn {
      padding: 5px 10px;
      border: none; border-radius: 6px;
      font-size: 0.75rem; font-family: inherit;
      cursor: pointer; transition: all 100ms;
      font-weight: 500;
    }

    .phz-cc__profile-save {
      background: var(--phz-color-primary, #3B82F6);
      color: white;
    }
    .phz-cc__profile-save:hover { background: #2563EB; }

    .phz-cc__profile-list {
      display: flex; flex-wrap: wrap; gap: 4px;
    }

    .phz-cc__profile-chip {
      padding: 3px 10px;
      background: #F5F5F4; border: 1px solid #E7E5E4;
      border-radius: 6px; font-size: 0.6875rem;
      cursor: pointer; transition: all 100ms;
    }
    .phz-cc__profile-chip:hover { background: #E7E5E4; }

    /* ─── Computed columns section ─── */
    .phz-cc__computed-item {
      background: #F5F5F4; border-radius: 8px;
      padding: 8px 10px; margin-bottom: 6px;
    }
    .phz-cc__computed-header {
      display: flex; align-items: center; gap: 4px;
    }
    .phz-cc__computed-name {
      flex: 1; font-size: 0.75rem; font-weight: 600;
      padding: 3px 6px; border: 1px solid transparent;
      border-radius: 4px; background: transparent;
      color: #1C1917; font-family: inherit; outline: none;
      box-sizing: border-box;
    }
    .phz-cc__computed-name:hover { border-color: #D6D3D1; }
    .phz-cc__computed-name:focus { border-color: #1C1917; background: white; }
    .phz-cc__computed-remove {
      width: 20px; height: 20px; border: none;
      background: transparent; color: #A8A29E;
      cursor: pointer; font-size: 14px; line-height: 1;
      border-radius: 4px; display: flex;
      align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .phz-cc__computed-remove:hover { background: #FEE2E2; color: #DC2626; }

    .phz-cc__computed-type-row {
      display: flex; align-items: center; gap: 6px;
      margin-top: 6px;
    }
    .phz-cc__computed-type-label {
      font-size: 0.6875rem; color: #78716C;
    }
    .phz-cc__computed-type-select {
      font-size: 0.6875rem; padding: 2px 6px;
      border: 1px solid #D6D3D1; border-radius: 4px;
      background: white; font-family: inherit;
      outline: none; color: #1C1917;
    }
    .phz-cc__computed-fields {
      display: flex; flex-wrap: wrap; gap: 3px;
      margin-top: 6px;
    }
    .phz-cc__computed-chip {
      font-size: 0.625rem; padding: 2px 6px;
      border-radius: 4px; background: #E7E5E4;
      color: #44403C; cursor: pointer;
      user-select: none; border: 1px solid transparent;
      transition: all 150ms;
    }
    .phz-cc__computed-chip:hover { border-color: #78716C; }
    .phz-cc__computed-chip--active {
      background: #1C1917; color: white;
      border-color: #1C1917;
    }
    .phz-cc__computed-formula {
      width: 100%; font-size: 0.625rem;
      padding: 4px 6px; margin-top: 6px;
      border: 1px solid #D6D3D1; border-radius: 4px;
      background: white; color: #1C1917;
      font-family: 'SF Mono', 'Fira Code', monospace;
      resize: none; height: 28px; outline: none;
      box-sizing: border-box;
    }
    .phz-cc__computed-formula:focus { border-color: #1C1917; }
    .phz-cc__add-computed-btn {
      width: 100%; padding: 5px 0;
      border: 1px dashed #D6D3D1; border-radius: 6px;
      background: transparent; color: #78716C;
      font-size: 0.6875rem; font-family: inherit;
      cursor: pointer; transition: all 150ms;
    }
    .phz-cc__add-computed-btn:hover { border-color: #1C1917; color: #1C1917; }

    /* ─── Sticky footer ─── */
    .phz-cc__actions {
      display: flex; justify-content: space-between; gap: 6px;
      padding: 10px 12px; border-top: 1px solid #E7E5E4;
      flex-shrink: 0;
      background: var(--phz-popover-bg, #FEFDFB);
    }

    .phz-cc__btn {
      padding: 7px 14px; border: none; border-radius: 8px;
      font-size: 0.8125rem; font-family: inherit;
      cursor: pointer; transition: all 100ms; font-weight: 500;
    }
    .phz-cc__btn--secondary { background: transparent; color: #57534E; }
    .phz-cc__btn--secondary:hover { background: #F5F5F4; }
    .phz-cc__btn--danger { background: transparent; color: #DC2626; }
    .phz-cc__btn--danger:hover { background: #FEF2F2; }
    .phz-cc__btn--primary { background: var(--phz-color-primary, #3B82F6); color: white; }
    .phz-cc__btn--primary:hover { background: #2563EB; }

    @media (prefers-reduced-motion: reduce) {
      .phz-cc, .phz-cc__backdrop { transition: none; }
    }

    /* Small screens: full width */
    @media (max-width: 400px) {
      .phz-cc { width: 100vw; }
    }
  `; }
    willUpdate(changed) {
        if (changed.has('open') && this.open) {
            this.initLocalState();
        }
        if (changed.has('computedColumns')) {
            this.localComputedColumns = this.computedColumns.map(cc => ({ ...cc }));
        }
    }
    updated(changed) {
        if (changed.has('open') && this.open) {
            this.addListeners();
        }
        if (changed.has('open') && !this.open) {
            this.removeListeners();
        }
    }
    show() {
        this.open = true;
    }
    hide() {
        this.open = false;
        this.expandedSettingsField = null;
        this.dispatchEvent(new CustomEvent('chooser-close', { bubbles: true, composed: true }));
    }
    /** Reset columns to their original order and all visible */
    resetColumns() {
        this.localOrder = this.columns.map(c => c.field);
        this.localVisibility = Object.fromEntries(this.columns.map(c => [c.field, true]));
    }
    initLocalState() {
        if (this.columnState) {
            this.localOrder = [...this.columnState.order];
            this.localVisibility = { ...this.columnState.visibility };
        }
        else {
            this.resetColumns();
        }
        this.localComputedColumns = this.computedColumns.map(cc => ({ ...cc, sourceFields: [...cc.sourceFields] }));
        this.expandedSettingsField = null;
    }
    addListeners() {
        const onKeydown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                this.hide();
            }
        };
        document.addEventListener('keydown', onKeydown, true);
        this.cleanup = () => document.removeEventListener('keydown', onKeydown, true);
    }
    removeListeners() {
        this.cleanup?.();
        this.cleanup = null;
    }
    toggleColumn(field) {
        this.localVisibility = {
            ...this.localVisibility,
            [field]: !this.localVisibility[field],
        };
    }
    showAll() {
        this.localVisibility = Object.fromEntries(Object.keys(this.localVisibility).map(k => [k, this.restrictedFields.has(k) ? false : true]));
    }
    handleReset() {
        this.resetColumns();
    }
    handleApply() {
        this.dispatchEvent(new CustomEvent('chooser-apply', {
            detail: {
                order: this.localOrder,
                visibility: this.localVisibility,
            },
            bubbles: true,
            composed: true,
        }));
        // Emit computed columns change
        this.emitComputedColumnsChange();
        this.hide();
    }
    handleSaveProfile() {
        if (!this.profileName.trim())
            return;
        const profile = {
            name: this.profileName.trim(),
            order: [...this.localOrder],
            visibility: { ...this.localVisibility },
            widths: this.columnState?.widths ?? {},
        };
        this.dispatchEvent(new CustomEvent('profile-save', {
            detail: profile,
            bubbles: true,
            composed: true,
        }));
        this.profileName = '';
    }
    handleLoadProfile(profile) {
        this.localOrder = [...profile.order];
        this.localVisibility = { ...profile.visibility };
        this.dispatchEvent(new CustomEvent('profile-load', {
            detail: profile,
            bubbles: true,
            composed: true,
        }));
    }
    handleDragStart(e, field) {
        this.draggedField = field;
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', field);
        }
    }
    handleDragOver(e) {
        e.preventDefault();
        if (e.dataTransfer)
            e.dataTransfer.dropEffect = 'move';
    }
    handleDrop(e, targetField) {
        e.preventDefault();
        if (!this.draggedField || this.draggedField === targetField)
            return;
        const order = [...this.localOrder];
        const fromIdx = order.indexOf(this.draggedField);
        const toIdx = order.indexOf(targetField);
        if (fromIdx < 0 || toIdx < 0)
            return;
        order.splice(fromIdx, 1);
        order.splice(toIdx, 0, this.draggedField);
        this.localOrder = order;
        this.draggedField = null;
    }
    handleDragEnd() {
        this.draggedField = null;
    }
    getColumnHeader(field) {
        return this.columns.find(c => c.field === field)?.header ?? field;
    }
    getColumnType(field) {
        return this.columns.find(c => c.field === field)?.type ?? 'string';
    }
    getColumnWidth(field) {
        return this.columnState?.widths?.[field] ?? 120;
    }
    getVisibleCount() {
        return Object.values(this.localVisibility).filter(v => v !== false).length;
    }
    // --- Column settings change ---
    emitColumnSettingsChange(detail) {
        this.dispatchEvent(new CustomEvent('column-settings-change', {
            detail,
            bubbles: true,
            composed: true,
        }));
    }
    toggleSettings(field) {
        this.expandedSettingsField = this.expandedSettingsField === field ? null : field;
    }
    // --- Computed Columns Methods ---
    addComputedColumn() {
        const newCc = {
            name: 'New Column',
            field: '__computed_new_column',
            type: 'sum',
            sourceFields: [],
            formula: '',
        };
        this.localComputedColumns = [...this.localComputedColumns, newCc];
        this.emitComputedColumnsChange();
    }
    removeComputedColumn(index) {
        this.localComputedColumns = this.localComputedColumns.filter((_, i) => i !== index);
        this.emitComputedColumnsChange();
    }
    updateComputedName(index, name) {
        const updated = [...this.localComputedColumns];
        updated[index] = {
            ...updated[index],
            name,
            field: '__computed_' + name.replace(/\s+/g, '_').toLowerCase(),
        };
        this.localComputedColumns = updated;
    }
    updateComputedType(index, type) {
        const updated = [...this.localComputedColumns];
        // If switching to a numeric-only type, filter out non-numeric source fields
        let sourceFields = [...updated[index].sourceFields];
        if (NUMERIC_ONLY_TYPES.has(type)) {
            const numericFields = new Set(this.availableFields.filter(f => f.type === 'number' || f.type === 'bar').map(f => f.field));
            sourceFields = sourceFields.filter(f => numericFields.has(f));
        }
        updated[index] = { ...updated[index], type, sourceFields };
        this.localComputedColumns = updated;
        this.emitComputedColumnsChange();
    }
    toggleComputedSourceField(index, field) {
        const updated = [...this.localComputedColumns];
        const cc = updated[index];
        const fields = [...cc.sourceFields];
        const idx = fields.indexOf(field);
        if (idx >= 0)
            fields.splice(idx, 1);
        else
            fields.push(field);
        updated[index] = { ...cc, sourceFields: fields };
        this.localComputedColumns = updated;
        this.emitComputedColumnsChange();
    }
    updateComputedFormula(index, formula) {
        const updated = [...this.localComputedColumns];
        updated[index] = { ...updated[index], formula };
        this.localComputedColumns = updated;
        this.emitComputedColumnsChange();
    }
    emitComputedColumnsChange() {
        // Ensure all computed columns have valid fields
        const cleaned = this.localComputedColumns.map(cc => ({
            ...cc,
            field: cc.field || '__computed_' + cc.name.replace(/\s+/g, '_').toLowerCase(),
        }));
        this.dispatchEvent(new CustomEvent('computed-columns-change', {
            detail: cleaned,
            bubbles: true,
            composed: true,
        }));
    }
    getFieldsForComputedType(type) {
        if (NUMERIC_ONLY_TYPES.has(type)) {
            return this.availableFields.filter(f => f.type === 'number' || f.type === 'bar');
        }
        return this.availableFields.filter(f => !f.field.startsWith('__computed_'));
    }
    // --- Render ---
    render() {
        if (!this.open)
            return html ``;
        const q = this.searchQuery.toLowerCase();
        let filteredFields = this.localOrder.filter(f => {
            // Hide restricted fields from the chooser entirely
            if (this.restrictedFields.has(f))
                return false;
            if (!q)
                return true;
            return f.toLowerCase().includes(q) || this.getColumnHeader(f).toLowerCase().includes(q);
        });
        if (this.sortAlpha) {
            filteredFields = [...filteredFields].sort((a, b) => this.getColumnHeader(a).localeCompare(this.getColumnHeader(b)));
        }
        const totalCount = this.localOrder.length;
        const visibleCount = this.getVisibleCount();
        const roleBadgeClass = this.userRole === 'editor' ? 'phz-cc__role-badge--editor'
            : this.userRole === 'admin' ? 'phz-cc__role-badge--admin' : '';
        return html `
      <!-- Backdrop -->
      <div class="phz-cc__backdrop" @click="${this.hide}"></div>

      <!-- Slide-out panel -->
      <div class="phz-cc" role="dialog" aria-label="Column chooser">
        <!-- Sticky header -->
        <div class="phz-cc__header">
          <div class="phz-cc__header-left">
            <span class="phz-cc__title">Columns</span>
            ${this.canToggle ? html `<span class="phz-cc__count">${visibleCount}/${totalCount} visible</span>` : nothing}
            ${this.userRole !== 'user' ? html `<span class="phz-cc__role-badge ${roleBadgeClass}">${this.userRole}</span>` : nothing}
          </div>
          <button class="phz-cc__close" @click="${this.hide}" aria-label="Close">\u2715</button>
        </div>

        <!-- Sticky search + sort -->
        <div class="phz-cc__search">
          <input
            type="text"
            placeholder="Search columns..."
            .value="${this.searchQuery}"
            @input="${(e) => { this.searchQuery = e.target.value; }}"
          />
          <div class="phz-cc__sort-toggle">
            <button
              class="phz-cc__sort-btn ${!this.sortAlpha ? 'phz-cc__sort-btn--active' : ''}"
              @click="${() => { this.sortAlpha = false; }}"
            >Original</button>
            <button
              class="phz-cc__sort-btn ${this.sortAlpha ? 'phz-cc__sort-btn--active' : ''}"
              @click="${() => { this.sortAlpha = true; }}"
            >A-Z</button>
          </div>
        </div>

        <!-- Scrollable column list -->
        <div class="phz-cc__list" role="listbox" aria-label="Column list">
          ${filteredFields.map(field => this.renderColumnItem(field))}
        </div>

        <!-- Collapsible Computed Columns section (admin only) -->
        ${this.canCreateComputed ? html `
          <div class="phz-cc__section">
            <div class="phz-cc__section-header" @click="${() => { this.computedSectionExpanded = !this.computedSectionExpanded; }}">
              <span>Computed Columns${this.localComputedColumns.length > 0 ? ` (${this.localComputedColumns.length})` : ''}</span>
              <span class="phz-cc__section-chevron ${this.computedSectionExpanded ? 'phz-cc__section-chevron--open' : ''}">\u25BE</span>
            </div>
            ${this.computedSectionExpanded ? html `
              <div class="phz-cc__section-body">
                ${this.localComputedColumns.map((cc, i) => this.renderComputedItem(cc, i))}
                <button class="phz-cc__add-computed-btn" @click="${this.addComputedColumn}">+ Add Computed Column</button>
              </div>
            ` : nothing}
          </div>
        ` : nothing}

        <!-- Collapsible Profiles section (user+ roles) -->
        ${this.canToggle ? html `
          <div class="phz-cc__profiles">
            <div class="phz-cc__profiles-header" @click="${() => { this.profilesExpanded = !this.profilesExpanded; }}">
              <span>Profiles</span>
              <span class="phz-cc__profiles-chevron ${this.profilesExpanded ? 'phz-cc__profiles-chevron--open' : ''}">\u25BE</span>
            </div>
            ${this.profilesExpanded ? html `
              <div class="phz-cc__profiles-body">
                <div class="phz-cc__profile-row">
                  <input
                    class="phz-cc__profile-input"
                    type="text"
                    placeholder="Profile name..."
                    .value="${this.profileName}"
                    @input="${(e) => { this.profileName = e.target.value; }}"
                  />
                  <button class="phz-cc__profile-btn phz-cc__profile-save" @click="${this.handleSaveProfile}">Save</button>
                </div>
                ${this.profiles.length > 0 ? html `
                  <div class="phz-cc__profile-list">
                    ${this.profiles.map(p => html `
                      <button
                        class="phz-cc__profile-chip"
                        @click="${() => this.handleLoadProfile(p)}"
                      >${p.name}</button>
                    `)}
                  </div>
                ` : html `<div style="font-size:10px;color:#A8A29E;padding:2px 0">No saved profiles</div>`}
              </div>
            ` : nothing}
          </div>
        ` : nothing}

        <!-- Sticky footer (user+ roles) -->
        ${this.canToggle ? html `
          <div class="phz-cc__actions">
            <button class="phz-cc__btn phz-cc__btn--secondary" @click="${this.showAll}">Show All</button>
            <button class="phz-cc__btn phz-cc__btn--danger" @click="${this.handleReset}">Reset</button>
            <button class="phz-cc__btn phz-cc__btn--primary" @click="${this.handleApply}">Apply</button>
          </div>
        ` : nothing}
      </div>
    `;
    }
    renderColumnItem(field) {
        const visible = this.localVisibility[field] !== false;
        const dragging = this.draggedField === field;
        const settingsOpen = this.expandedSettingsField === field;
        return html `
      <div
        class="phz-cc__item ${dragging ? 'phz-cc__item--dragging' : ''}"
        draggable="${this.canReorder ? 'true' : 'false'}"
        @dragstart="${this.canReorder ? (e) => this.handleDragStart(e, field) : nothing}"
        @dragover="${this.canReorder ? this.handleDragOver : nothing}"
        @drop="${this.canReorder ? (e) => this.handleDrop(e, field) : nothing}"
        @dragend="${this.canReorder ? this.handleDragEnd : nothing}"
      >
        <div class="phz-cc__item-row">
          ${this.canReorder ? html `<span class="phz-cc__drag-handle" aria-hidden="true">\u2261</span>` : nothing}
          ${this.canToggle ? html `
            <div
              class="phz-cc__checkbox ${visible ? 'phz-cc__checkbox--checked' : ''}"
              @click="${() => this.toggleColumn(field)}"
              role="checkbox"
              aria-checked="${visible}"
            >
              ${visible ? html `<span class="phz-cc__checkbox-icon">\u2713</span>` : nothing}
            </div>
          ` : nothing}
          <span class="phz-cc__col-name">${this.getColumnHeader(field)}</span>
          ${this.canEditSettings ? html `
            <button
              class="phz-cc__settings-toggle ${settingsOpen ? 'phz-cc__settings-toggle--open' : ''}"
              @click="${() => this.toggleSettings(field)}"
              aria-label="Column settings"
            >\u25B8</button>
          ` : nothing}
        </div>
        ${settingsOpen && this.canEditSettings ? this.renderColumnSettings(field) : nothing}
      </div>
    `;
    }
    renderColumnSettings(field) {
        const col = this.columns.find(c => c.field === field);
        const colType = this.getColumnType(field);
        const colWidth = this.getColumnWidth(field);
        const isDateType = colType === 'date' || colType === 'datetime';
        const currentDateFormat = this.dateFormats[field] ?? '';
        return html `
      <div class="phz-cc__settings">
        <!-- Header name -->
        <div class="phz-cc__settings-row">
          <span class="phz-cc__settings-label">Name</span>
          <input
            class="phz-cc__settings-input"
            type="text"
            .value="${col?.header ?? field}"
            @change="${(e) => this.emitColumnSettingsChange({ field, header: e.target.value })}"
          />
        </div>
        <!-- Type -->
        <div class="phz-cc__settings-row">
          <span class="phz-cc__settings-label">Type</span>
          <select
            class="phz-cc__settings-select"
            @change="${(e) => this.emitColumnSettingsChange({ field, type: e.target.value })}"
          >
            ${COLUMN_TYPES.map(t => html `
              <option value="${t.value}" ?selected="${t.value === colType}">${t.label}</option>
            `)}
          </select>
        </div>
        <!-- Date format (only for date/datetime) -->
        ${isDateType ? html `
          <div class="phz-cc__settings-row">
            <span class="phz-cc__settings-label">Format</span>
            <select
              class="phz-cc__settings-select"
              @change="${(e) => {
            const val = e.target.value;
            this.emitColumnSettingsChange({ field, dateFormat: val });
        }}"
            >
              <option value="" ?selected="${!currentDateFormat}">Default</option>
              ${DATE_FORMAT_PRESETS.map(p => html `
                <option value="${p.value}" ?selected="${currentDateFormat === p.value}">${p.label}</option>
              `)}
            </select>
          </div>
        ` : nothing}
        <!-- Width -->
        <div class="phz-cc__settings-row">
          <span class="phz-cc__settings-label">Width</span>
          <input
            class="phz-cc__settings-input"
            type="number"
            min="40"
            max="800"
            .value="${String(colWidth)}"
            @change="${(e) => this.emitColumnSettingsChange({ field, width: Number(e.target.value) })}"
          />
        </div>
      </div>
    `;
    }
    renderComputedItem(cc, index) {
        const fields = this.getFieldsForComputedType(cc.type);
        return html `
      <div class="phz-cc__computed-item">
        <div class="phz-cc__computed-header">
          <input
            class="phz-cc__computed-name"
            type="text"
            .value="${cc.name}"
            placeholder="Column name..."
            @input="${(e) => this.updateComputedName(index, e.target.value)}"
            @change="${() => this.emitComputedColumnsChange()}"
          />
          <button class="phz-cc__computed-remove" @click="${() => this.removeComputedColumn(index)}">\u00D7</button>
        </div>

        <div class="phz-cc__computed-type-row">
          <span class="phz-cc__computed-type-label">Function</span>
          <select
            class="phz-cc__computed-type-select"
            .value="${cc.type}"
            @change="${(e) => this.updateComputedType(index, e.target.value)}"
          >
            ${COMPUTED_TYPES.map(t => html `
              <option value="${t.value}" ?selected="${t.value === cc.type}">${t.label}</option>
            `)}
          </select>
        </div>

        ${cc.type !== 'custom' ? html `
          <div class="phz-cc__computed-fields">
            ${fields.map(f => html `
              <span
                class="phz-cc__computed-chip ${cc.sourceFields.includes(f.field) ? 'phz-cc__computed-chip--active' : ''}"
                @click="${() => this.toggleComputedSourceField(index, f.field)}"
              >${f.header || f.field}</span>
            `)}
          </div>
        ` : html `
          <textarea
            class="phz-cc__computed-formula"
            .value="${cc.formula || ''}"
            placeholder="e.g., [price] * [quantity]"
            @input="${(e) => this.updateComputedFormula(index, e.target.value)}"
          ></textarea>
        `}
      </div>
    `;
    }
};
__decorate([
    property({ type: Boolean, reflect: true })
], PhzColumnChooser.prototype, "open", void 0);
__decorate([
    property({ attribute: false })
], PhzColumnChooser.prototype, "columns", void 0);
__decorate([
    property({ attribute: false })
], PhzColumnChooser.prototype, "columnState", void 0);
__decorate([
    property({ attribute: false })
], PhzColumnChooser.prototype, "profiles", void 0);
__decorate([
    property({ attribute: false })
], PhzColumnChooser.prototype, "computedColumns", void 0);
__decorate([
    property({ attribute: false })
], PhzColumnChooser.prototype, "availableFields", void 0);
__decorate([
    property({ type: String })
], PhzColumnChooser.prototype, "userRole", void 0);
__decorate([
    property({ attribute: false })
], PhzColumnChooser.prototype, "restrictedFields", void 0);
__decorate([
    property({ attribute: false })
], PhzColumnChooser.prototype, "dateFormats", void 0);
__decorate([
    state()
], PhzColumnChooser.prototype, "localVisibility", void 0);
__decorate([
    state()
], PhzColumnChooser.prototype, "localOrder", void 0);
__decorate([
    state()
], PhzColumnChooser.prototype, "searchQuery", void 0);
__decorate([
    state()
], PhzColumnChooser.prototype, "draggedField", void 0);
__decorate([
    state()
], PhzColumnChooser.prototype, "profileName", void 0);
__decorate([
    state()
], PhzColumnChooser.prototype, "sortAlpha", void 0);
__decorate([
    state()
], PhzColumnChooser.prototype, "profilesExpanded", void 0);
__decorate([
    state()
], PhzColumnChooser.prototype, "computedSectionExpanded", void 0);
__decorate([
    state()
], PhzColumnChooser.prototype, "localComputedColumns", void 0);
__decorate([
    state()
], PhzColumnChooser.prototype, "expandedSettingsField", void 0);
PhzColumnChooser = __decorate([
    customElement('phz-column-chooser')
], PhzColumnChooser);
export { PhzColumnChooser };
//# sourceMappingURL=phz-column-chooser.js.map