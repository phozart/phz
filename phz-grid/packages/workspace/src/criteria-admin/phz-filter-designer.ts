/**
 * @phozart/phz-criteria — Filter Designer
 *
 * Single place for creating and managing reusable filter definitions,
 * filter rules, and shared presets. Three tabs: Definitions, Rules, Presets.
 *
 * Features:
 * - Right-click context menus on all panels and items
 * - Auto-save on all edits (debounced, with visual confirmation)
 * - Built-in guidance panels for business administrators
 *
 * Composes engine-admin's <phz-filter-studio> via dynamic import for rich
 * definition editing; falls back to an inline form if engine-admin isn't installed.
 * Editing drawer is provided by <phz-filter-drawer>.
 *
 * CSS prefix: phz-fd-
 *
 * Events:
 * - definition-create: { definition: FilterDefinition }
 * - definition-update: { id, patch }
 * - definition-deprecate: { id }
 * - definition-restore: { id }
 * - definition-duplicate: { id, definition }
 * - rule-add / rule-remove / rule-toggle / rule-update  (re-dispatched from phz-rule-admin)
 * - preset-create / preset-update / preset-delete        (re-dispatched from phz-preset-admin)
 */

import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import type {
  FilterDefinition, FilterDefinitionId, FilterRule,
  SelectionPreset, SelectionFieldType, SessionBehavior,
  FilterDataSource, ValueSourceConfig, OptionsSource,
  FilterDefinitionPreset,
} from '@phozart/phz-core';
import { filterDefinitionId, resolveLabelTemplate } from '@phozart/phz-core';
import { criteriaStyles } from '@phozart/phz-criteria/shared-styles';

// Ensure sub-components are registered (side-effect imports)
import './phz-rule-admin.js';
import './phz-preset-admin.js';
import { buildFilterPresetContextItems } from './phz-preset-admin.js';
// Consumer component — registered via @phozart/phz-criteria
import '@phozart/phz-criteria';
import type { ComboboxOption } from '@phozart/phz-criteria';

type DesignerTab = 'definitions' | 'rules' | 'presets';

interface CtxMenuItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  separator?: boolean;
  variant?: 'default' | 'danger';
}

const FIELD_TYPES: { value: SelectionFieldType; label: string; hint: string }[] = [
  { value: 'single_select', label: 'Single Select', hint: 'Dropdown \u2014 users pick one option' },
  { value: 'multi_select', label: 'Multi Select', hint: 'Checkboxes \u2014 users pick multiple options' },
  { value: 'chip_group', label: 'Chip Group', hint: 'Clickable chips for quick selection' },
  { value: 'text', label: 'Text', hint: 'Free-text search input' },
  { value: 'date_range', label: 'Date Range', hint: 'Calendar picker for a date range' },
  { value: 'numeric_range', label: 'Numeric Range', hint: 'Slider or inputs for a number range' },
  { value: 'tree_select', label: 'Tree Select', hint: 'Hierarchical tree for nested categories' },
  { value: 'search', label: 'Search', hint: 'Type-ahead search with suggestions' },
  { value: 'field_presence', label: 'Field Presence', hint: 'Check if a field has a value or is empty' },
  { value: 'period_picker', label: 'Period Picker', hint: 'Select a time period (month, quarter, year)' },
];

const FIELD_TYPE_OPTIONS: ComboboxOption[] = FIELD_TYPES.map(t => ({ value: t.value, label: t.label }));

const SESSION_OPTIONS: ComboboxOption[] = [
  { value: 'reset', label: 'Reset each visit' },
  { value: 'persist', label: 'Remember selection' },
];

export const HELP: Record<DesignerTab, { title: string; body: string; tips: string[] }> = {
  definitions: {
    title: 'What are Filter Definitions?',
    body: 'Filter definitions are the building blocks of your filtering system. Each definition describes a type of filter available in reports and dashboards \u2014 like a \u201CRegion\u201D dropdown or a \u201CDate Range\u201D picker.',
    tips: [
      'Label \u2014 The name users see, e.g. \u201CRegion\u201D or \u201CStatus\u201D',
      'Type \u2014 How the filter appears: dropdown, checkboxes, calendar, etc.',
      'Data Source \u2014 A named dataset providing options, with value field and optional label template',
      'Session Behavior \u2014 \u201CReset\u201D starts fresh each visit; \u201CPersist\u201D remembers choices',
      'Right-click any definition for quick actions',
    ],
  },
  rules: {
    title: 'What are Filter Rules?',
    body: 'Rules refine how filter options are calculated. For example, exclude discontinued products from a \u201CProduct\u201D filter, or only show regions where a user has access.',
    tips: [
      'Priority \u2014 Rules run in order (lowest number first)',
      'Enable/Disable \u2014 Turn rules on or off without deleting them',
      'Preview \u2014 See how many options remain after each rule',
      'Right-click a rule for quick actions',
    ],
  },
  presets: {
    title: 'What are Filter Presets?',
    body: 'Filter presets are saved values scoped to a single filter. Select a filter, then create named presets with pre-configured values that users can apply with one click.',
    tips: [
      'Select a filter \u2014 Choose which filter to manage presets for',
      'Named presets \u2014 Give each saved value set a descriptive name',
      'Default \u2014 Automatically applied when the filter first loads',
      'Copy to filter \u2014 Copy a preset to another compatible filter',
      'Right-click a preset for quick actions',
    ],
  },
};

/** Build context menu items for a definition card */
export function buildDefContextItems(def: FilterDefinition): CtxMenuItem[] {
  if (def.deprecated) {
    return [
      { id: 'restore-def', label: 'Restore Definition', icon: '\u21A9' },
      { id: 'sep', label: '', separator: true },
      { id: 'copy-id', label: 'Copy Definition ID', icon: '\u2398' },
    ];
  }
  return [
    { id: 'edit-def', label: 'Edit Definition', icon: '\u270E' },
    { id: 'rename-def', label: 'Rename', icon: 'Aa' },
    { id: 'duplicate-def', label: 'Duplicate', icon: '\u29C9' },
    { id: 'copy-id', label: 'Copy Definition ID', icon: '\u2398' },
    { id: 'sep', label: '', separator: true },
    { id: 'deprecate-def', label: 'Deprecate', icon: '\u26A0', variant: 'danger' },
  ];
}

/** Build context menu items for a rule card */
export function buildRuleContextItems(rule: FilterRule, isFirst: boolean, isLast: boolean): CtxMenuItem[] {
  return [
    { id: 'edit-rule', label: 'Edit Rule', icon: '\u270E' },
    { id: 'copy-rule', label: 'Duplicate Rule', icon: '\u29C9' },
    { id: 'toggle-rule', label: rule.enabled ? 'Disable Rule' : 'Enable Rule', icon: rule.enabled ? '\u25CB' : '\u25CF' },
    { id: 'sep', label: '', separator: true },
    { id: 'move-rule-up', label: 'Move Higher Priority', icon: '\u2191', disabled: isFirst },
    { id: 'move-rule-down', label: 'Move Lower Priority', icon: '\u2193', disabled: isLast },
    { id: 'sep2', label: '', separator: true },
    { id: 'remove-rule', label: 'Remove Rule', icon: '\u2715', variant: 'danger' },
  ];
}

/** Build context menu items for a preset card */
export function buildPresetContextItems(preset: SelectionPreset, scope: string): CtxMenuItem[] {
  if (scope === 'shared') {
    return [
      { id: 'edit-preset', label: 'Edit Preset', icon: '\u270E' },
      { id: 'set-default-preset', label: preset.isDefault ? 'Remove Default' : 'Set as Default', icon: '\u2605' },
      { id: 'duplicate-preset', label: 'Duplicate', icon: '\u29C9' },
      { id: 'sep', label: '', separator: true },
      { id: 'delete-preset', label: 'Delete Preset', icon: '\u2715', variant: 'danger' },
    ];
  }
  return [
    { id: 'view-preset', label: 'View Details', icon: '\uD83D\uDC41' },
    { id: 'copy-to-shared', label: 'Copy to Shared', icon: '\u29C9' },
  ];
}

/** Build background context menu items */
export function buildBgContextItems(tab: DesignerTab, helpOpen: boolean): CtxMenuItem[] {
  const label = helpOpen ? 'Hide Guidance' : 'Show Guidance';
  switch (tab) {
    case 'definitions': return [
      { id: 'new-definition', label: 'New Definition', icon: '+' },
      { id: 'sep', label: '', separator: true },
      { id: 'toggle-help', label, icon: '?' },
    ];
    case 'rules': return [
      { id: 'add-rule', label: 'Add New Rule', icon: '+' },
      { id: 'sep', label: '', separator: true },
      { id: 'toggle-help', label, icon: '?' },
    ];
    case 'presets': return [
      { id: 'new-preset', label: 'New Preset', icon: '+' },
      { id: 'sep', label: '', separator: true },
      { id: 'toggle-help', label, icon: '?' },
    ];
  }
}

@safeCustomElement('phz-filter-designer')
export class PhzFilterDesigner extends LitElement {
  static styles = [criteriaStyles, css`
    :host { display: block; height: 100%; }

    .phz-fd-root {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #FAFAF9;
      border: 1px solid #E7E5E4;
      border-radius: 12px;
      overflow: hidden;
    }

    .phz-fd-tabs {
      display: flex;
      border-bottom: 1px solid #E7E5E4;
      background: #FFFFFF;
    }

    .phz-fd-tab {
      flex: 1;
      padding: 10px 16px;
      font-size: 12px;
      font-weight: 500;
      color: #78716C;
      cursor: pointer;
      border: none;
      background: none;
      border-bottom: 2px solid transparent;
      text-align: center;
      font-family: inherit;
      transition: all 0.15s;
    }

    .phz-fd-tab:hover { color: #44403C; background: #FAFAF9; }
    .phz-fd-tab--active { color: #1C1917; border-bottom-color: #1C1917; }

    .phz-fd-body {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }

    /* -- Help / Guidance -- */
    .phz-fd-help {
      background: #FFFBEB;
      border: 1px solid #FDE68A;
      border-radius: 10px;
      margin-bottom: 12px;
      overflow: hidden;
    }

    .phz-fd-help-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 10px 14px;
      border: none;
      background: none;
      cursor: pointer;
      font-family: inherit;
      font-size: 12px;
      font-weight: 600;
      color: #92400E;
      text-align: left;
    }

    .phz-fd-help-toggle:hover { background: rgba(251, 191, 36, 0.08); }

    .phz-fd-help-chevron {
      transition: transform 0.2s;
      font-size: 10px;
      flex-shrink: 0;
    }

    .phz-fd-help-chevron--open { transform: rotate(90deg); }

    .phz-fd-help-body {
      padding: 0 14px 12px;
      font-size: 12px;
      color: #78350F;
      line-height: 1.5;
    }

    .phz-fd-help-body p { margin: 0 0 8px; }

    .phz-fd-help-tips {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .phz-fd-help-tips li {
      padding: 3px 0;
      position: relative;
      padding-left: 16px;
    }

    .phz-fd-help-tips li::before {
      content: '\u2022';
      position: absolute;
      left: 4px;
      color: #D97706;
    }

    /* -- Search bar -- */
    .phz-fd-search { margin-bottom: 12px; }
    .phz-fd-search .phz-sc-input { width: 100%; }

    /* -- Definition list -- */
    .phz-fd-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .phz-fd-card {
      background: #FFFFFF;
      border: 1px solid #E7E5E4;
      border-radius: 10px;
      padding: 12px;
      transition: border-color 0.15s;
    }

    .phz-fd-card:hover { border-color: #A8A29E; }
    .phz-fd-card--deprecated { opacity: 0.5; }

    .phz-fd-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .phz-fd-card-label {
      font-size: 13px;
      font-weight: 600;
      color: #1C1917;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .phz-fd-card-type {
      font-size: 11px;
      color: #78716C;
      background: #F5F5F4;
      padding: 2px 8px;
      border-radius: 6px;
      flex-shrink: 0;
    }

    .phz-fd-dep-badge {
      font-size: 10px;
      font-weight: 600;
      color: #DC2626;
      background: #FEF2F2;
      padding: 2px 6px;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .phz-fd-card-meta {
      display: flex;
      gap: 8px;
      margin-top: 6px;
      font-size: 11px;
      color: #A8A29E;
      flex-wrap: wrap;
    }

    .phz-fd-card-actions {
      display: flex;
      gap: 4px;
      margin-top: 8px;
    }

    /* -- Inline form -- */
    .phz-fd-form {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 12px;
      background: #FFFFFF;
      border: 1px solid #E7E5E4;
      border-radius: 10px;
      margin-bottom: 12px;
    }

    .phz-fd-form-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .phz-fd-form-hint {
      font-size: 11px;
      color: #A8A29E;
      line-height: 1.3;
    }

    .phz-fd-empty {
      text-align: center;
      padding: 32px;
      color: #A8A29E;
      font-size: 13px;
      line-height: 1.5;
    }

    /* -- Context Menu -- */
    .phz-fd-ctx-backdrop {
      position: fixed;
      inset: 0;
      z-index: 9999;
    }

    .phz-fd-ctx {
      position: fixed;
      min-width: 200px;
      max-width: 280px;
      background: #FEFDFB;
      border: 1px solid #E7E5E4;
      border-radius: 12px;
      box-shadow: 0 8px 30px rgba(28,25,23,0.12), 0 2px 8px rgba(28,25,23,0.06);
      padding: 6px;
      z-index: 10000;
      opacity: 0;
      transform: translateY(-4px);
      animation: phz-fd-ctx-in 150ms cubic-bezier(0, 0, 0.2, 1) forwards;
      font-size: 13px;
    }

    @keyframes phz-fd-ctx-in {
      to { opacity: 1; transform: translateY(0); }
    }

    .phz-fd-ctx-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
      color: #1C1917;
      transition: background 100ms ease;
      user-select: none;
      min-height: 34px;
      border: none;
      background: none;
      width: 100%;
      font-family: inherit;
      font-size: inherit;
      text-align: left;
    }

    .phz-fd-ctx-item:hover,
    .phz-fd-ctx-item--focused { background: rgba(59, 130, 246, 0.08); }

    .phz-fd-ctx-item--disabled {
      opacity: 0.4;
      cursor: default;
      pointer-events: none;
    }

    .phz-fd-ctx-item--danger { color: #EF4444; }
    .phz-fd-ctx-item--danger:hover,
    .phz-fd-ctx-item--danger.phz-fd-ctx-item--focused {
      background: rgba(239, 68, 68, 0.08);
    }

    .phz-fd-ctx-icon {
      width: 18px;
      text-align: center;
      flex-shrink: 0;
      font-size: 13px;
    }

    .phz-fd-ctx-label {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .phz-fd-ctx-sep {
      height: 1px;
      background: #E7E5E4;
      margin: 4px 8px;
    }

    /* -- Auto-save status -- */
    .phz-fd-save-status {
      font-size: 11px;
      color: #A8A29E;
      padding: 0 8px;
    }

    .phz-fd-save-status--pending { color: #D97706; }
    .phz-fd-save-status--saved { color: #16A34A; }

    /* -- Toast -- */
    .phz-fd-toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(8px);
      background: #1C1917;
      color: #FFFFFF;
      padding: 8px 20px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
      z-index: 10001;
      opacity: 0;
      transition: opacity 0.2s, transform 0.2s;
      pointer-events: none;
    }

    .phz-fd-toast--visible {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }

    @media (prefers-reduced-motion: reduce) {
      .phz-fd-ctx { animation: none; opacity: 1; transform: none; }
      .phz-fd-toast { transition: none; }
      .phz-fd-help-chevron { transition: none; }
    }
  `];

  // -- Public properties --
  @property({ type: Array }) definitions: FilterDefinition[] = [];
  @property({ type: Array }) rules: FilterRule[] = [];
  @property({ type: Array }) sharedPresets: SelectionPreset[] = [];
  @property({ type: Array }) userPresets: SelectionPreset[] = [];
  @property({ type: Array }) availableColumns: string[] = [];
  @property({ type: Array }) data: Record<string, unknown>[] = [];
  @property({ type: Object }) rulePreviewResults: Record<string, { before: number; after: number }> = {};
  @property({ type: Array }) dataSources: FilterDataSource[] = [];
  @property({ type: Array }) filterPresets: FilterDefinitionPreset[] = [];

  // -- Internal state --
  @state() private _tab: DesignerTab = 'definitions';
  @state() private _searchTerm = '';
  @state() private _drawerOpen = false;
  @state() private _drawerMode: 'studio' | 'inline' = 'inline';
  @state() private _editingDef: FilterDefinition | null = null;
  @state() private _hasStudio = false;
  @state() private _studioChecked = false;

  // New definition form state
  @state() private _newLabel = '';
  @state() private _newType: SelectionFieldType = 'single_select';
  @state() private _newSession: SessionBehavior = 'reset';
  @state() private _showNewForm = false;
  @state() private _newDataSourceId = '';
  @state() private _newValueField = '';
  @state() private _newLabelTemplate = '';

  // Edit label inline
  @state() private _editingId: string | null = null;
  @state() private _editingLabel = '';

  // Context menu state
  @state() private _ctxOpen = false;
  @state() private _ctxX = 0;
  @state() private _ctxY = 0;
  @state() private _ctxItems: CtxMenuItem[] = [];
  @state() private _ctxFocusIdx = -1;
  @state() private _ctxTargetId: string | null = null;
  @state() private _ctxTargetData: Record<string, unknown> | null = null;

  // Guidance state
  @state() private _helpOpen = true;

  // Auto-save state
  @state() private _saveStatus: 'idle' | 'pending' | 'saved' = 'idle';

  // Toast state
  @state() private _toastVisible = false;
  @state() private _toastMessage = '';

  private _autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  private _saveStatusTimer: ReturnType<typeof setTimeout> | null = null;
  private _toastTimer: ReturnType<typeof setTimeout> | null = null;
  private _ctxCleanup: (() => void) | null = null;

  // -- Lifecycle --

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._clearTimers();
    this._removeCtxListeners();
  }

  private _clearTimers() {
    if (this._autoSaveTimer) clearTimeout(this._autoSaveTimer);
    if (this._saveStatusTimer) clearTimeout(this._saveStatusTimer);
    if (this._toastTimer) clearTimeout(this._toastTimer);
  }

  // -- Main Render --

  render() {
    const drawerTitle = this._editingDef ? `Edit: ${this._editingDef.label}` : 'New Definition';
    const isStudio = this._drawerOpen && this._drawerMode === 'studio';
    const isInline = this._drawerOpen && this._drawerMode === 'inline';

    return html`
      <div class="phz-fd-root" @contextmenu=${this._handleRootContextMenu}>
        <div class="phz-fd-tabs">
          <button class="phz-fd-tab ${this._tab === 'definitions' ? 'phz-fd-tab--active' : ''}"
                  @click=${() => this._tab = 'definitions'}>Definitions</button>
          <button class="phz-fd-tab ${this._tab === 'rules' ? 'phz-fd-tab--active' : ''}"
                  @click=${() => this._tab = 'rules'}>Rules</button>
          <button class="phz-fd-tab ${this._tab === 'presets' ? 'phz-fd-tab--active' : ''}"
                  @click=${() => this._tab = 'presets'}>Presets</button>
        </div>
        <div class="phz-fd-body">
          ${this._renderHelp()}
          ${this._tab === 'definitions' ? this._renderDefinitions() : nothing}
          ${this._tab === 'rules' ? this._renderRules() : nothing}
          ${this._tab === 'presets' ? this._renderPresets() : nothing}
        </div>
      </div>

      ${isStudio ? this._renderStudioModal(drawerTitle) : nothing}

      ${isInline ? html`
        <phz-filter-drawer
          ?open=${true}
          .drawerTitle=${drawerTitle}
          .width=${400}
          .resizable=${false}
          @drawer-close=${this._closeDrawer}
        >
          ${this._renderInlineEditor()}
          <div slot="footer" style="display:flex;align-items:center;gap:8px;width:100%">
            <span class="phz-fd-save-status
              ${this._saveStatus === 'pending' ? 'phz-fd-save-status--pending' : ''}
              ${this._saveStatus === 'saved' ? 'phz-fd-save-status--saved' : ''}">
              ${this._saveStatus === 'pending' ? 'Saving...' : ''}
              ${this._saveStatus === 'saved' ? 'All changes saved' : ''}
              ${this._saveStatus === 'idle' ? 'Changes save automatically' : ''}
            </span>
            <button class="phz-sc-btn" @click=${this._closeDrawer}>Close</button>
          </div>
        </phz-filter-drawer>
      ` : nothing}

      ${this._ctxOpen ? this._renderContextMenu() : nothing}
      <div class="phz-fd-toast ${this._toastVisible ? 'phz-fd-toast--visible' : ''}"
           role="status" aria-live="polite">${this._toastMessage}</div>
    `;
  }

  // -- Studio Modal --

  private _renderStudioModal(title: string) {
    return html`
      <div class="phz-sc-studio-modal-backdrop" @click=${this._closeDrawer}>
        <div class="phz-sc-studio-modal-panel"
             @click=${(e: Event) => e.stopPropagation()}
             @filter-studio-save=${this._handleStudioSave}
             @filter-studio-cancel=${this._closeDrawer}
             @keydown=${this._onModalKeydown}
             role="dialog" aria-modal="true" aria-label=${title}>
          <div class="phz-sc-studio-modal-header">
            <span class="phz-sc-studio-modal-title">${title}</span>
            <button class="phz-sc-studio-modal-close"
                    @click=${this._closeDrawer}
                    aria-label="Close">\u2715</button>
          </div>
          <div class="phz-sc-studio-modal-body">
            <phz-filter-studio
              .definition=${this._editingDef}
              .data=${this.data}
              .availableColumns=${this.availableColumns}
              .dataSources=${this.dataSources}
            ></phz-filter-studio>
          </div>
        </div>
      </div>
    `;
  }

  private _handleStudioSave(e: CustomEvent) {
    const def = (e.detail as { definition: FilterDefinition }).definition;
    if (this._editingDef) {
      this._dispatchEvent('definition-update', {
        id: def.id,
        patch: {
          label: def.label,
          type: def.type,
          sessionBehavior: def.sessionBehavior,
          options: def.options,
          treeOptions: def.treeOptions,
          dateRangeConfig: def.dateRangeConfig,
          numericRangeConfig: def.numericRangeConfig,
          searchConfig: def.searchConfig,
          fieldPresenceConfig: def.fieldPresenceConfig,
          defaultValue: def.defaultValue,
          valueSource: def.valueSource,
          updatedAt: def.updatedAt,
        },
      });
      this._showToast('Definition updated');
    } else {
      this._dispatchEvent('definition-create', { definition: def });
      this._showToast('Definition created');
    }
    this._closeDrawer();
  }

  private _onModalKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      this._closeDrawer();
    }
  }

  // -- Guidance / Help Panel --

  private _renderHelp() {
    const info = HELP[this._tab];
    return html`
      <div class="phz-fd-help">
        <button class="phz-fd-help-toggle" @click=${() => { this._helpOpen = !this._helpOpen; }}
                aria-expanded="${this._helpOpen}">
          <span class="phz-fd-help-chevron ${this._helpOpen ? 'phz-fd-help-chevron--open' : ''}"
                aria-hidden="true">\u25B6</span>
          <span>${info.title}</span>
        </button>
        ${this._helpOpen ? html`
          <div class="phz-fd-help-body">
            <p>${info.body}</p>
            <ul class="phz-fd-help-tips">
              ${info.tips.map(t => html`<li>${t}</li>`)}
            </ul>
          </div>
        ` : nothing}
      </div>
    `;
  }

  // -- Definitions Tab --

  private _renderDefinitions() {
    const term = this._searchTerm.toLowerCase();
    const filtered = term
      ? (this.definitions ?? []).filter(d => d.label.toLowerCase().includes(term) || d.type.includes(term))
      : (this.definitions ?? []);

    return html`
      <div class="phz-fd-search">
        <input type="text" class="phz-sc-input" placeholder="Search definitions by name or type..."
               aria-label="Search filter definitions"
               .value=${this._searchTerm}
               @input=${(e: Event) => this._searchTerm = (e.target as HTMLInputElement).value}>
      </div>

      ${this._showNewForm ? this._renderNewForm() : html`
        <button class="phz-sc-btn phz-sc-btn--primary" style="margin-bottom: 12px; width: 100%"
                @click=${this._handleNewClick}>+ New Definition</button>
      `}

      <div class="phz-fd-list">
        ${filtered.length === 0
          ? html`<div class="phz-fd-empty">${this._searchTerm
              ? 'No matching definitions found. Try a different search term.'
              : 'No filter definitions yet. Click \u201C+ New Definition\u201D above or right-click for options.'
            }</div>`
          : nothing}
        ${filtered.map(def => this._renderDefinitionCard(def))}
      </div>
    `;
  }

  private _renderDefinitionCard(def: FilterDefinition) {
    const typeLabel = FIELD_TYPES.find(t => t.value === def.type)?.label ?? def.type.replace(/_/g, ' ');
    return html`
      <div class="phz-fd-card ${def.deprecated ? 'phz-fd-card--deprecated' : ''}"
           @contextmenu=${(e: MouseEvent) => this._handleDefContextMenu(e, def)}>
        <div class="phz-fd-card-header">
          ${this._editingId === def.id ? html`
            <input class="phz-sc-input" style="flex:1;font-size:13px;padding:2px 6px;"
              aria-label="Rename definition"
              .value=${this._editingLabel}
              @input=${(e: Event) => this._editingLabel = (e.target as HTMLInputElement).value}
              @blur=${() => this._commitLabelEdit(def.id)}
              @keydown=${(e: KeyboardEvent) => {
                if (e.key === 'Enter') this._commitLabelEdit(def.id);
                if (e.key === 'Escape') { this._editingId = null; }
              }}>
          ` : html`
            <span class="phz-fd-card-label">${def.label}</span>
          `}
          <span class="phz-fd-card-type">${typeLabel}</span>
          ${def.deprecated ? html`<span class="phz-fd-dep-badge">Deprecated</span>` : nothing}
        </div>
        <div class="phz-fd-card-meta">
          <span>Session: ${def.sessionBehavior === 'persist' ? 'Remembers selection' : 'Resets each visit'}</span>
          ${def.valueSource?.optionsSource?.valueField ? html`<span>Value: ${def.valueSource.optionsSource.valueField}</span>` : nothing}
        </div>
        ${!def.deprecated ? html`
          <div class="phz-fd-card-actions">
            <button class="phz-sc-btn" @click=${() => this._openEditor(def)}>Edit</button>
            <button class="phz-sc-btn" @click=${() => {
              this._editingId = def.id;
              this._editingLabel = def.label;
            }}>Rename</button>
            <button class="phz-sc-btn" style="color:#DC2626"
                    @click=${() => this._dispatchEvent('definition-deprecate', { id: def.id })}>Deprecate</button>
          </div>
        ` : nothing}
      </div>
    `;
  }

  private _renderNewForm() {
    const selectedType = FIELD_TYPES.find(t => t.value === this._newType);
    return html`
      <div class="phz-fd-form">
        <div class="phz-fd-form-row">
          <label class="phz-sc-field-label phz-sc-field-label--required">Label</label>
          <input class="phz-sc-input" .value=${this._newLabel}
                 @input=${(e: Event) => this._newLabel = (e.target as HTMLInputElement).value}
                 placeholder="e.g. Region, Date Range, Product Category">
          <span class="phz-fd-form-hint">The name users will see for this filter</span>
        </div>
        <div class="phz-fd-form-row">
          <label class="phz-sc-field-label">Type</label>
          <phz-combobox
            .options=${FIELD_TYPE_OPTIONS}
            .value=${this._newType}
            .allowEmpty=${false}
            @combobox-change=${(e: CustomEvent) => this._newType = (e.detail as { value: string }).value as SelectionFieldType}
          ></phz-combobox>
          <span class="phz-fd-form-hint">${selectedType?.hint ?? 'Choose how this filter appears to users'}</span>
        </div>
        <div class="phz-fd-form-row">
          <label class="phz-sc-field-label">Session Behavior</label>
          <phz-combobox
            .options=${SESSION_OPTIONS}
            .value=${this._newSession}
            .allowEmpty=${false}
            @combobox-change=${(e: CustomEvent) => this._newSession = (e.detail as { value: string }).value as SessionBehavior}
          ></phz-combobox>
          <span class="phz-fd-form-hint">Should this filter remember the user's last selection?</span>
        </div>
        ${(this.dataSources ?? []).length > 0 ? html`
          <div class="phz-fd-form-row">
            <label class="phz-sc-field-label">Data Source</label>
            <phz-combobox
              .options=${(this.dataSources ?? []).map(ds => ({ value: ds.id, label: ds.name }))}
              .value=${this._newDataSourceId}
              allow-empty
              empty-label="\u2014 None \u2014"
              @combobox-change=${(e: CustomEvent) => this._handleNewDataSourceChange((e.detail as { value: string }).value)}
            ></phz-combobox>
            <span class="phz-fd-form-hint">Named dataset that provides this filter's options</span>
          </div>
          ${this._newDataSourceId ? html`
            <div class="phz-fd-form-row">
              <label class="phz-sc-field-label">Value Field</label>
              <phz-combobox
                .options=${((this.dataSources ?? []).find(ds => ds.id === this._newDataSourceId)?.columns ?? []).map(c => ({ value: c, label: c }))}
                .value=${this._newValueField}
                allow-empty
                empty-label="\u2014 Select \u2014"
                @combobox-change=${(e: CustomEvent) => this._newValueField = (e.detail as { value: string }).value}
              ></phz-combobox>
              <span class="phz-fd-form-hint">Column to use as the option value</span>
            </div>
            <div class="phz-fd-form-row">
              <label class="phz-sc-field-label">Label Template</label>
              <input class="phz-sc-input" .value=${this._newLabelTemplate}
                     @input=${(e: Event) => this._newLabelTemplate = (e.target as HTMLInputElement).value}
                     placeholder="e.g. {code} - {description}">
              <span class="phz-fd-form-hint">Compose display labels from multiple fields using {fieldName} placeholders</span>
              ${this._renderNewTemplatePreview()}
            </div>
          ` : nothing}
        ` : nothing}
        <div style="display:flex;gap:8px">
          <button class="phz-sc-btn phz-sc-btn--primary" @click=${this._createDefinition}>Create</button>
          <button class="phz-sc-btn" @click=${() => this._showNewForm = false}>Cancel</button>
        </div>
      </div>
    `;
  }

  // -- Rules Tab --

  private _renderRules() {
    return html`
      <phz-rule-admin
        .rules=${this.rules}
        .definitions=${this.definitions}
        .previewResults=${this.rulePreviewResults}
        @rule-contextmenu=${this._handleRuleContextMenu}
        @rules-bg-contextmenu=${this._handleRulesBgContextMenu}
      ></phz-rule-admin>
    `;
  }

  // -- Presets Tab --

  private _renderPresets() {
    return html`
      <phz-preset-admin
        mode="per-filter"
        .definitions=${this.definitions}
        .filterPresets=${this.filterPresets}
        .dataSources=${this.dataSources}
        .data=${this.data}
        .sharedPresets=${this.sharedPresets}
        .userPresets=${this.userPresets}
        @preset-contextmenu=${this._handlePresetContextMenu}
        @presets-bg-contextmenu=${this._handlePresetsBgContextMenu}
        @filter-preset-create=${this._redispatch}
        @filter-preset-update=${this._redispatch}
        @filter-preset-delete=${this._redispatch}
        @filter-preset-copy=${this._redispatch}
        @filter-preset-contextmenu=${this._handleFilterPresetContextMenu}
      ></phz-preset-admin>
    `;
  }

  // -- Inline editor (fallback when engine-admin not available) --

  private _renderInlineEditor() {
    const def = this._editingDef;
    if (!def) return nothing;
    const selectedType = FIELD_TYPES.find(t => t.value === def.type);

    return html`
      <div style="display:flex;flex-direction:column;gap:12px;padding:0 16px">
        <div class="phz-fd-form-row">
          <label class="phz-sc-field-label">Label</label>
          <input class="phz-sc-input" .value=${def.label}
                 @input=${(e: Event) => this._handleEditorChange('label', (e.target as HTMLInputElement).value)}>
          <span class="phz-fd-form-hint">The name users will see for this filter</span>
        </div>
        <div class="phz-fd-form-row">
          <label class="phz-sc-field-label">Type</label>
          <phz-combobox
            .options=${FIELD_TYPE_OPTIONS}
            .value=${def.type}
            .allowEmpty=${false}
            @combobox-change=${(e: CustomEvent) => this._handleEditorChange('type', (e.detail as { value: string }).value)}
          ></phz-combobox>
          <span class="phz-fd-form-hint">${selectedType?.hint ?? 'How this filter appears to users'}</span>
        </div>
        <div class="phz-fd-form-row">
          <label class="phz-sc-field-label">Session Behavior</label>
          <phz-combobox
            .options=${SESSION_OPTIONS}
            .value=${def.sessionBehavior}
            .allowEmpty=${false}
            @combobox-change=${(e: CustomEvent) => this._handleEditorChange('sessionBehavior', (e.detail as { value: string }).value)}
          ></phz-combobox>
          <span class="phz-fd-form-hint">Should this filter remember the user's last selection?</span>
        </div>
        ${(this.dataSources ?? []).length > 0 ? html`
          <div class="phz-fd-form-row">
            <label class="phz-sc-field-label">Data Source</label>
            <phz-combobox
              .options=${(this.dataSources ?? []).map(ds => ({ value: ds.id, label: ds.name }))}
              .value=${def.valueSource?.optionsSource?.dataSetId ?? ''}
              allow-empty
              empty-label="\u2014 None \u2014"
              @combobox-change=${(e: CustomEvent) => {
                const dsId = (e.detail as { value: string }).value;
                if (!dsId) {
                  this._handleEditorChange('valueSource', undefined);
                } else {
                  const existing = def.valueSource?.optionsSource;
                  this._handleEditorChange('valueSource', {
                    type: 'dataset' as const,
                    optionsSource: {
                      dataSetId: dsId,
                      valueField: existing?.valueField ?? '',
                      labelTemplate: existing?.labelTemplate,
                    },
                  });
                }
              }}
            ></phz-combobox>
            <span class="phz-fd-form-hint">Named dataset that provides this filter's options</span>
          </div>
          ${def.valueSource?.optionsSource?.dataSetId ? html`
            <div class="phz-fd-form-row">
              <label class="phz-sc-field-label">Value Field</label>
              <phz-combobox
                .options=${((this.dataSources ?? []).find(ds => ds.id === def.valueSource?.optionsSource?.dataSetId)?.columns ?? []).map(c => ({ value: c, label: c }))}
                .value=${def.valueSource?.optionsSource?.valueField ?? ''}
                allow-empty
                empty-label="\u2014 Select \u2014"
                @combobox-change=${(e: CustomEvent) => {
                  const vf = (e.detail as { value: string }).value;
                  this._handleEditorChange('valueSource', {
                    ...def.valueSource,
                    type: 'dataset' as const,
                    optionsSource: { ...def.valueSource!.optionsSource!, valueField: vf },
                  });
                }}
              ></phz-combobox>
              <span class="phz-fd-form-hint">Column to use as the option value</span>
            </div>
            <div class="phz-fd-form-row">
              <label class="phz-sc-field-label">Label Template</label>
              <input class="phz-sc-input" .value=${def.valueSource?.optionsSource?.labelTemplate ?? ''}
                     @input=${(e: Event) => {
                       const tmpl = (e.target as HTMLInputElement).value;
                       this._handleEditorChange('valueSource', {
                         ...def.valueSource,
                         type: 'dataset' as const,
                         optionsSource: { ...def.valueSource!.optionsSource!, labelTemplate: tmpl || undefined },
                       });
                     }}
                     placeholder="e.g. {code} - {description}">
              <span class="phz-fd-form-hint">Compose display labels using {fieldName} placeholders</span>
            </div>
          ` : nothing}
        ` : nothing}
      </div>
    `;
  }

  // -- Auto-save --

  private _handleEditorChange(field: string, value: unknown) {
    if (!this._editingDef) return;
    this._editingDef = { ...this._editingDef, [field]: value };
    this._scheduleAutoSave();
  }

  private _scheduleAutoSave() {
    this._saveStatus = 'pending';
    if (this._autoSaveTimer) clearTimeout(this._autoSaveTimer);
    this._autoSaveTimer = setTimeout(() => {
      this._flushAutoSave();
    }, 800);
  }

  private _flushAutoSave() {
    if (this._autoSaveTimer) {
      clearTimeout(this._autoSaveTimer);
      this._autoSaveTimer = null;
    }
    if (!this._editingDef) return;
    this._dispatchEvent('definition-update', {
      id: this._editingDef.id,
      patch: {
        label: this._editingDef.label,
        type: this._editingDef.type,
        sessionBehavior: this._editingDef.sessionBehavior,
        valueSource: this._editingDef.valueSource,
        updatedAt: Date.now(),
      },
    });
    this._saveStatus = 'saved';
    if (this._saveStatusTimer) clearTimeout(this._saveStatusTimer);
    this._saveStatusTimer = setTimeout(() => {
      this._saveStatus = 'idle';
    }, 3000);
  }

  // -- Context Menu: Rendering --

  private _renderContextMenu() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const menuW = 240;
    const itemCount = this._ctxItems.filter(i => !i.separator).length;
    const sepCount = this._ctxItems.filter(i => i.separator).length;
    const menuH = itemCount * 38 + sepCount * 9 + 12;
    const x = (this._ctxX + menuW > vw) ? this._ctxX - menuW : this._ctxX;
    const y = (this._ctxY + menuH > vh) ? Math.max(4, this._ctxY - menuH) : this._ctxY;

    return html`
      <div class="phz-fd-ctx-backdrop" @click=${this._closeContextMenu}
           @contextmenu=${(e: Event) => { e.preventDefault(); this._closeContextMenu(); }}></div>
      <div class="phz-fd-ctx" role="menu" aria-label="Context menu"
           style="left:${Math.max(4, x)}px;top:${Math.max(4, y)}px;"
           @keydown=${this._handleCtxKeydown}>
        ${this._ctxItems.map((item, idx) => {
          if (item.separator) return html`<div class="phz-fd-ctx-sep" role="separator"></div>`;
          const focused = idx === this._ctxFocusIdx;
          return html`
            <button class="phz-fd-ctx-item
                     ${item.disabled ? 'phz-fd-ctx-item--disabled' : ''}
                     ${focused ? 'phz-fd-ctx-item--focused' : ''}
                     ${item.variant === 'danger' ? 'phz-fd-ctx-item--danger' : ''}"
                    role="menuitem"
                    tabindex="-1"
                    aria-disabled="${item.disabled ?? false}"
                    @click=${() => this._selectCtxItem(item)}
                    @mouseenter=${() => { this._ctxFocusIdx = idx; }}>
              ${item.icon ? html`<span class="phz-fd-ctx-icon" aria-hidden="true">${item.icon}</span>` : nothing}
              <span class="phz-fd-ctx-label">${item.label}</span>
            </button>
          `;
        })}
      </div>
    `;
  }

  // -- Context Menu: Keyboard --

  private _handleCtxKeydown(e: KeyboardEvent) {
    const actionable = this._ctxItems
      .map((item, i) => ({ item, i }))
      .filter(({ item }) => !item.separator && !item.disabled);

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        this._closeContextMenu();
        break;
      case 'ArrowDown': {
        e.preventDefault();
        const cur = actionable.findIndex(({ i }) => i === this._ctxFocusIdx);
        const next = cur < actionable.length - 1 ? cur + 1 : 0;
        this._ctxFocusIdx = actionable[next].i;
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const cur = actionable.findIndex(({ i }) => i === this._ctxFocusIdx);
        const prev = cur > 0 ? cur - 1 : actionable.length - 1;
        this._ctxFocusIdx = actionable[prev].i;
        break;
      }
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (this._ctxFocusIdx >= 0) this._selectCtxItem(this._ctxItems[this._ctxFocusIdx]);
        break;
    }
  }

  // -- Context Menu: Open / Close --

  private _openContextMenu(x: number, y: number, items: CtxMenuItem[], targetId?: string, targetData?: Record<string, unknown>) {
    this._ctxX = x;
    this._ctxY = y;
    this._ctxItems = items;
    this._ctxFocusIdx = -1;
    this._ctxTargetId = targetId ?? null;
    this._ctxTargetData = targetData ?? null;
    this._ctxOpen = true;
    this._addCtxListeners();
  }

  private _closeContextMenu() {
    this._ctxOpen = false;
    this._ctxTargetId = null;
    this._ctxTargetData = null;
    this._removeCtxListeners();
  }

  private _addCtxListeners() {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this._closeContextMenu();
      }
    };
    requestAnimationFrame(() => {
      document.addEventListener('keydown', onKey, true);
    });
    this._ctxCleanup = () => {
      document.removeEventListener('keydown', onKey, true);
    };
  }

  private _removeCtxListeners() {
    this._ctxCleanup?.();
    this._ctxCleanup = null;
  }

  // -- Context Menu: Event Handlers --

  private _handleRootContextMenu(e: MouseEvent) {
    if (this._tab !== 'definitions') return;
    const path = e.composedPath();
    const isCard = path.some(el => el instanceof HTMLElement && el.classList?.contains('phz-fd-card'));
    const isForm = path.some(el => el instanceof HTMLElement && el.classList?.contains('phz-fd-form'));
    const isDrawer = path.some(el => el instanceof HTMLElement && el.classList?.contains('phz-sc-drawer-panel'));
    if (isCard || isForm || isDrawer) return;
    e.preventDefault();
    this._openContextMenu(e.clientX, e.clientY, buildBgContextItems('definitions', this._helpOpen));
  }

  private _handleDefContextMenu(e: MouseEvent, def: FilterDefinition) {
    e.preventDefault();
    e.stopPropagation();
    this._openContextMenu(e.clientX, e.clientY, buildDefContextItems(def), def.id, def as unknown as Record<string, unknown>);
  }

  private _handleRuleContextMenu(e: CustomEvent) {
    const { ruleId, rule, x, y } = e.detail as { ruleId: string; rule: FilterRule; x: number; y: number };
    const sorted = [...this.rules].sort((a, b) => a.priority - b.priority);
    const idx = sorted.findIndex(r => r.id === ruleId);
    this._openContextMenu(x, y,
      buildRuleContextItems(rule, idx === 0, idx === sorted.length - 1),
      ruleId, rule as unknown as Record<string, unknown>);
  }

  private _handleRulesBgContextMenu(e: CustomEvent) {
    const { x, y } = e.detail as { x: number; y: number };
    this._openContextMenu(x, y, buildBgContextItems('rules', this._helpOpen));
  }

  private _handlePresetContextMenu(e: CustomEvent) {
    const { presetId, preset, scope, x, y } = e.detail as {
      presetId: string; preset: SelectionPreset; scope: string; x: number; y: number;
    };
    this._openContextMenu(x, y,
      buildPresetContextItems(preset, scope),
      presetId, preset as unknown as Record<string, unknown>);
  }

  private _handlePresetsBgContextMenu(e: CustomEvent) {
    const { scope, x, y } = e.detail as { scope: string; x: number; y: number };
    this._openContextMenu(x, y, buildBgContextItems('presets', this._helpOpen), undefined, { scope });
  }

  private _handleFilterPresetContextMenu(e: CustomEvent) {
    const { presetId, preset, x, y } = e.detail as {
      presetId: string; preset: FilterDefinitionPreset; x: number; y: number;
    };
    const items = buildFilterPresetContextItems(preset);
    this._openContextMenu(x, y, items, presetId, preset as unknown as Record<string, unknown>);
  }

  private _redispatch(e: CustomEvent) {
    this._dispatchEvent(e.type, e.detail as Record<string, unknown>);
  }

  // -- Context Menu: Action Dispatch --

  private _selectCtxItem(item: CtxMenuItem) {
    if (item.disabled || item.separator) return;
    this._closeContextMenu();

    switch (item.id) {
      // -- Definitions --
      case 'new-definition':
        this._handleNewClick();
        break;
      case 'edit-def':
        if (this._ctxTargetId) {
          const def = (this.definitions ?? []).find(d => d.id === this._ctxTargetId);
          if (def) this._openEditor(def);
        }
        break;
      case 'rename-def':
        if (this._ctxTargetId) {
          const def = (this.definitions ?? []).find(d => d.id === this._ctxTargetId);
          if (def) {
            this._editingId = def.id;
            this._editingLabel = def.label;
          }
        }
        break;
      case 'duplicate-def':
        if (this._ctxTargetId) {
          const def = (this.definitions ?? []).find(d => d.id === this._ctxTargetId);
          if (def) {
            const now = Date.now();
            const copy: FilterDefinition = {
              ...def,
              id: filterDefinitionId(def.id + '_copy_' + now),
              label: def.label + ' (Copy)',
              deprecated: false,
              createdAt: now,
              updatedAt: now,
            };
            this._dispatchEvent('definition-create', { definition: copy });
            this._showToast('Definition duplicated');
          }
        }
        break;
      case 'copy-id':
        if (this._ctxTargetId) {
          navigator.clipboard?.writeText(this._ctxTargetId).then(() => {
            this._showToast('ID copied to clipboard');
          });
        }
        break;
      case 'deprecate-def':
        if (this._ctxTargetId) {
          this._dispatchEvent('definition-deprecate', { id: this._ctxTargetId });
          this._showToast('Definition deprecated');
        }
        break;
      case 'restore-def':
        if (this._ctxTargetId) {
          this._dispatchEvent('definition-restore', { id: this._ctxTargetId });
          this._showToast('Definition restored');
        }
        break;

      // -- Rules --
      case 'add-rule':
        this._openRuleEditor(null, 'add');
        break;
      case 'edit-rule':
        if (this._ctxTargetId && this._ctxTargetData) {
          this._openRuleEditor(this._ctxTargetData as unknown as FilterRule, 'edit');
        }
        break;
      case 'copy-rule':
        if (this._ctxTargetId && this._ctxTargetData) {
          this._openRuleEditor(this._ctxTargetData as unknown as FilterRule, 'copy');
        }
        break;
      case 'toggle-rule':
        if (this._ctxTargetId && this._ctxTargetData) {
          const enabled = (this._ctxTargetData as unknown as FilterRule).enabled;
          this._dispatchEvent('rule-toggle', { ruleId: this._ctxTargetId, enabled: !enabled });
          this._showToast(enabled ? 'Rule disabled' : 'Rule enabled');
        }
        break;
      case 'move-rule-up':
      case 'move-rule-down': {
        if (this._ctxTargetId) {
          const sorted = [...this.rules].sort((a, b) => a.priority - b.priority);
          const idx = sorted.findIndex(r => r.id === this._ctxTargetId);
          const swapIdx = item.id === 'move-rule-up' ? idx - 1 : idx + 1;
          if (swapIdx >= 0 && swapIdx < sorted.length) {
            const thisPriority = sorted[idx].priority;
            const swapPriority = sorted[swapIdx].priority;
            this._dispatchEvent('rule-update', { ruleId: sorted[idx].id, patch: { priority: swapPriority } });
            this._dispatchEvent('rule-update', { ruleId: sorted[swapIdx].id, patch: { priority: thisPriority } });
            this._showToast('Rule reordered');
          }
        }
        break;
      }
      case 'remove-rule':
        if (this._ctxTargetId) {
          this._dispatchEvent('rule-remove', { ruleId: this._ctxTargetId });
          this._showToast('Rule removed');
        }
        break;

      // -- Presets --
      case 'new-preset': {
        const scope = (this._ctxTargetData as Record<string, unknown>)?.scope ?? 'shared';
        this._dispatchEvent('preset-create', { scope });
        break;
      }
      case 'edit-preset':
        if (this._ctxTargetId) this._dispatchEvent('preset-update', { presetId: this._ctxTargetId });
        break;
      case 'set-default-preset':
        if (this._ctxTargetId && this._ctxTargetData) {
          const isDefault = (this._ctxTargetData as unknown as SelectionPreset).isDefault;
          this._dispatchEvent('preset-update', { presetId: this._ctxTargetId, patch: { isDefault: !isDefault } });
          this._showToast(isDefault ? 'Default removed' : 'Set as default');
        }
        break;
      case 'duplicate-preset':
        if (this._ctxTargetId) {
          this._dispatchEvent('preset-create', { duplicateFrom: this._ctxTargetId });
          this._showToast('Preset duplicated');
        }
        break;
      case 'delete-preset':
        if (this._ctxTargetId) {
          this._dispatchEvent('preset-delete', { presetId: this._ctxTargetId });
          this._showToast('Preset deleted');
        }
        break;
      case 'view-preset':
        if (this._ctxTargetId) this._dispatchEvent('preset-update', { presetId: this._ctxTargetId });
        break;
      case 'copy-to-shared':
        if (this._ctxTargetId) {
          this._dispatchEvent('preset-create', { duplicateFrom: this._ctxTargetId, scope: 'shared' });
          this._showToast('Copied to shared presets');
        }
        break;

      // -- Filter Presets --
      case 'edit-filter-preset':
        if (this._ctxTargetId && this._ctxTargetData) {
          const presetAdmin = this.shadowRoot?.querySelector('phz-preset-admin') as
            import('./phz-preset-admin.js').PhzPresetAdmin | null;
          if (presetAdmin) {
            const fp = this._ctxTargetData as unknown as FilterDefinitionPreset;
            presetAdmin['_openEditModal'](fp);
          }
        }
        break;
      case 'set-default-filter-preset':
        if (this._ctxTargetId && this._ctxTargetData) {
          const isDefault = (this._ctxTargetData as unknown as FilterDefinitionPreset).isDefault;
          this._dispatchEvent('filter-preset-update', { presetId: this._ctxTargetId, patch: { isDefault: !isDefault } });
          this._showToast(isDefault ? 'Default removed' : 'Set as default');
        }
        break;
      case 'copy-filter-preset':
        if (this._ctxTargetId && this._ctxTargetData) {
          const presetAdmin = this.shadowRoot?.querySelector('phz-preset-admin') as
            import('./phz-preset-admin.js').PhzPresetAdmin | null;
          if (presetAdmin) {
            const fp = this._ctxTargetData as unknown as FilterDefinitionPreset;
            presetAdmin['_openCopyModal'](fp);
          }
        }
        break;
      case 'delete-filter-preset':
        if (this._ctxTargetId) {
          this._dispatchEvent('filter-preset-delete', { presetId: this._ctxTargetId });
          this._showToast('Preset deleted');
        }
        break;

      // -- Shared --
      case 'toggle-help':
        this._helpOpen = !this._helpOpen;
        break;
    }
  }

  // -- Rule Editor (delegates to phz-rule-admin's built-in modal) --

  private _openRuleEditor(rule: FilterRule | null, mode: 'add' | 'edit' | 'copy') {
    const ruleAdmin = this.shadowRoot?.querySelector('phz-rule-admin') as
      import('./phz-rule-admin.js').PhzRuleAdmin | null;
    if (ruleAdmin) {
      if (rule) {
        ruleAdmin.openEditor(rule, mode);
      } else {
        ruleAdmin.openEditor(null as unknown as FilterRule, 'add');
      }
    }
  }

  // -- Toast --

  private _showToast(msg: string) {
    this._toastMessage = msg;
    this._toastVisible = true;
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => { this._toastVisible = false; }, 2500);
  }

  // -- Data Source helpers --

  private _handleNewDataSourceChange(dsId: string) {
    this._newDataSourceId = dsId;
    this._newValueField = '';
    this._newLabelTemplate = '';
    if (dsId && !this._newLabel) {
      const ds = (this.dataSources ?? []).find(d => d.id === dsId);
      if (ds) this._newLabel = ds.name;
    }
  }

  private _renderNewTemplatePreview() {
    if (!this._newLabelTemplate || !this._newDataSourceId) return nothing;
    const ds = (this.dataSources ?? []).find(d => d.id === this._newDataSourceId);
    const sample = ds?.sampleRows?.[0];
    if (!sample) return nothing;
    const preview = resolveLabelTemplate(this._newLabelTemplate, sample);
    return html`<span class="phz-fd-form-hint" style="color:#16A34A">Preview: ${preview}</span>`;
  }

  // -- Actions --

  private async _handleNewClick() {
    if (!this._studioChecked) {
      await this._checkStudio();
    }
    if (this._hasStudio) {
      this._editingDef = null;
      this._drawerMode = 'studio';
      this._drawerOpen = true;
    } else {
      this._showNewForm = true;
    }
  }

  private async _openEditor(def: FilterDefinition) {
    if (!this._studioChecked) {
      await this._checkStudio();
    }
    this._editingDef = { ...def };
    this._drawerMode = this._hasStudio ? 'studio' : 'inline';
    this._saveStatus = 'idle';
    this._drawerOpen = true;
  }

  private async _checkStudio() {
    try {
      // @ts-ignore — optional side-effect import for feature detection
      await import('../engine-admin/index.js');
      this._hasStudio = true;
    } catch {
      this._hasStudio = false;
    }
    this._studioChecked = true;
  }

  private _closeDrawer() {
    // Only flush auto-save for inline editor (studio saves explicitly)
    if (this._drawerMode === 'inline' && this._autoSaveTimer) this._flushAutoSave();
    this._drawerOpen = false;
    this._editingDef = null;
    this._saveStatus = 'idle';
  }

  private _commitLabelEdit(defId: string) {
    const label = this._editingLabel.trim().slice(0, 200);
    if (label) {
      this._dispatchEvent('definition-update', { id: defId, patch: { label } });
      this._showToast('Label saved');
    }
    this._editingId = null;
  }

  private _createDefinition() {
    if (!this._newLabel.trim()) return;
    const now = Date.now();

    let valueSource: ValueSourceConfig | undefined;
    if (this._newDataSourceId && this._newValueField) {
      const optionsSource: OptionsSource = {
        dataSetId: this._newDataSourceId,
        valueField: this._newValueField,
      };
      if (this._newLabelTemplate) {
        optionsSource.labelTemplate = this._newLabelTemplate;
      }
      valueSource = { type: 'dataset', optionsSource };
    }

    const def: FilterDefinition = {
      id: filterDefinitionId(this._newLabel.toLowerCase().replace(/\s+/g, '_')),
      label: this._newLabel,
      type: this._newType,
      sessionBehavior: this._newSession,
      valueSource,
      createdAt: now,
      updatedAt: now,
    };
    this._dispatchEvent('definition-create', { definition: def });
    this._showToast('Definition created');
    this._newLabel = '';
    this._newType = 'single_select';
    this._newSession = 'reset';
    this._newDataSourceId = '';
    this._newValueField = '';
    this._newLabelTemplate = '';
    this._showNewForm = false;
  }

  private _dispatchEvent(name: string, detail: Record<string, unknown>) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }
}
