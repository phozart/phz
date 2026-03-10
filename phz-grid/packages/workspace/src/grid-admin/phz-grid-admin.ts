/**
 * @phozart/phz-grid-admin — Grid Admin Facade
 *
 * Modal dialog with tabbed admin sections for grid visual configuration.
 * Tabs: Table Settings, Columns, Formatting, Filters, Export.
 *
 * Report identity, data source selection, and criteria binding are handled
 * by phz-definitions and phz-criteria respectively.
 */

import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import { adminBaseStyles } from './shared-styles.js';
import { DEFAULT_TABLE_SETTINGS } from '@phozart/phz-engine';
import type { ReportPresentation } from '@phozart/phz-engine';
import './phz-admin-table-settings.js';
import './phz-admin-columns.js';
import './phz-admin-formatting.js';
import './phz-admin-filters.js';
import './phz-admin-export.js';

type AdminTab = 'table-settings' | 'columns' | 'formatting' | 'filters' | 'export';

@safeCustomElement('phz-grid-admin')
export class PhzGridAdmin extends LitElement {
  static styles = [
    adminBaseStyles,
    css`
      :host { display: block; }

      /* ── Backdrop overlay ── */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(28, 25, 23, 0.5);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        animation: fadeIn 0.15s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideUp {
        from { opacity: 0; transform: translateY(12px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      /* ── Modal dialog ── */
      .grid-admin {
        width: 90vw;
        max-width: 1100px;
        height: 85vh;
        max-height: 900px;
        background: white;
        border-radius: 16px;
        display: flex;
        flex-direction: column;
        box-shadow:
          0 24px 48px rgba(28,25,23,0.18),
          0 12px 24px rgba(28,25,23,0.12),
          0 4px 8px rgba(28,25,23,0.08);
        animation: slideUp 0.2s ease;
        overflow: hidden;
      }
      .admin-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 28px;
        border-bottom: 1px solid #E7E5E4;
        flex-shrink: 0;
      }
      .admin-title { font-size: 18px; font-weight: 700; margin: 0; }
      .close-btn {
        background: none; border: 1px solid transparent; font-size: 18px; cursor: pointer;
        color: #78716C; width: 44px; height: 44px; border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.15s ease;
      }
      .close-btn:hover { color: #1C1917; background: #F5F5F4; transform: scale(1.05); }
      .admin-body { flex: 1; overflow-y: auto; padding: 28px; }
      .report-badge {
        font-size: 12px; font-weight: 600; color: #78716C; background: #F5F5F4;
        border-radius: 8px; padding: 4px 10px; margin-left: 8px;
        max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .admin-actions { display: flex; gap: 8px; align-items: center; }
      .copy-btn {
        background: none; border: 1px solid #D6D3D1; border-radius: 8px;
        font-size: 12px; padding: 8px 16px; cursor: pointer; color: #78716C;
        font-family: inherit; box-shadow: var(--phz-admin-shadow-sm);
        transition: all 0.15s ease;
      }
      .copy-btn:hover {
        border-color: #3B82F6; color: #3B82F6;
        transform: translateY(-1px); box-shadow: var(--phz-admin-shadow-md);
      }
      .save-btn {
        background: #3B82F6; border: 1px solid #3B82F6; border-radius: 8px;
        font-size: 12px; padding: 8px 16px; cursor: pointer; color: white;
        font-family: inherit; font-weight: 600; box-shadow: var(--phz-admin-shadow-sm);
        transition: all 0.15s ease; min-height: 44px;
      }
      .save-btn:hover {
        background: #2563EB; border-color: #2563EB;
        transform: translateY(-1px); box-shadow: var(--phz-admin-shadow-md);
      }
      .save-btn--saved {
        background: #16A34A; border-color: #16A34A;
      }
      .save-btn--saved:hover {
        background: #16A34A; border-color: #16A34A;
        transform: none; box-shadow: var(--phz-admin-shadow-sm);
      }
      .reset-btn {
        background: none; border: 1px solid #D6D3D1; border-radius: 8px;
        font-size: 12px; padding: 8px 16px; cursor: pointer; color: #78716C;
        font-family: inherit; box-shadow: var(--phz-admin-shadow-sm);
        transition: all 0.15s ease;
      }
      .reset-btn:hover {
        border-color: #DC2626; color: #DC2626;
        transform: translateY(-1px); box-shadow: var(--phz-admin-shadow-md);
      }

      /* ── Tabs override for modal — more breathing room ── */
      .phz-admin-tabs {
        padding: 0 28px;
        flex-shrink: 0;
      }
      .phz-admin-tab {
        padding: 12px 18px;
        font-size: 13px;
      }

      @media (max-width: 768px) {
        .modal-backdrop { padding: 0; }
        .grid-admin {
          width: 100%;
          max-width: 100%;
          height: 100%;
          max-height: none;
          border-radius: 0;
        }
        .admin-header { padding: 16px 20px; }
        .admin-body { padding: 16px; }
        .phz-admin-tabs { padding: 0 12px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .phz-admin-tab { padding: 12px 12px; font-size: 12px; min-height: 44px; }
        .admin-actions { flex-wrap: wrap; }
        .save-btn, .reset-btn, .copy-btn, .close-btn { min-height: 44px; min-width: 44px; }
      }

      @media (max-width: 576px) {
        .modal-backdrop { padding: 0; }
        .grid-admin {
          width: 100%; max-width: 100%;
          height: 100%; max-height: none;
          border-radius: 0;
        }
        .admin-header {
          padding: 12px 16px;
          flex-wrap: wrap; gap: 8px;
        }
        .admin-body { padding: 12px; }
        .admin-actions { width: 100%; justify-content: flex-end; }
        .report-badge { display: none; }
      }
    `,
  ];

  @property({ type: Boolean }) open: boolean = false;

  /** Report identity — settings are scoped to this report */
  @property({ type: String }) reportId: string = '';
  @property({ type: String }) reportName: string = '';

  /** List of other reports whose settings can be copied */
  @property({ attribute: false }) availableReports: Array<{ id: string; name: string }> = [];
  @property({ type: Array }) columns: any[] = [];
  @property({ type: Array }) formattingRules: any[] = [];
  @property({ type: Array }) fields: string[] = [];
  @property({ type: Object }) filterPresets: Record<string, any> = {};
  @property({ type: Object }) themeTokens: Record<string, string> = {};
  @property({ attribute: false }) columnTypes: Record<string, string> = {};
  @property({ attribute: false }) statusColors: Record<string, { bg: string; color: string; dot: string }> = {};
  @property({ attribute: false }) barThresholds: Array<{ min: number; color: string }> = [];
  @property({ attribute: false }) dateFormats: Record<string, string> = {};
  @property({ attribute: false }) linkTemplates: Record<string, string> = {};
  @property({ attribute: false }) tableSettings: any = { ...DEFAULT_TABLE_SETTINGS };
  @property({ attribute: false }) columnFormatting: Record<string, any> = {};
  @property({ attribute: false }) numberFormats: Record<string, any> = {};

  @state() private activeTab: AdminTab = 'table-settings';
  @state() private _saveState: 'idle' | 'saved' = 'idle';
  private _saveTimer: ReturnType<typeof setTimeout> | null = null;
  private _autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  private _initialized = false;
  private _boundKeyHandler: ((e: KeyboardEvent) => void) | null = null;

  private readonly tabs: { id: AdminTab; label: string }[] = [
    { id: 'table-settings', label: 'Table Settings' },
    { id: 'columns', label: 'Columns' },
    { id: 'formatting', label: 'Formatting' },
    { id: 'filters', label: 'Filters' },
    { id: 'export', label: 'Export' },
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    // Listen for child component events to keep local state in sync
    this.addEventListener('table-settings-change', this._handleTableSettingsChange as EventListener);
    this.addEventListener('column-config-change', this._handleColumnConfigChange as EventListener);
    this.addEventListener('rules-change', this._handleRulesChange as EventListener);
    this.addEventListener('columns-change', this._handleColumnsChange as EventListener);
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('open')) {
      if (this.open) {
        // Set initial tab on first open
        if (!this._initialized) {
          this._initialized = true;
          this.activeTab = 'table-settings';
        }
        // Bind Escape key to close
        this._boundKeyHandler = (e: KeyboardEvent) => {
          if (e.key === 'Escape') this.handleClose();
        };
        document.addEventListener('keydown', this._boundKeyHandler);
        // Prevent body scroll while modal is open
        document.body.style.overflow = 'hidden';
      } else {
        // Clean up
        if (this._boundKeyHandler) {
          document.removeEventListener('keydown', this._boundKeyHandler);
          this._boundKeyHandler = null;
        }
        document.body.style.overflow = '';
      }
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._boundKeyHandler) {
      document.removeEventListener('keydown', this._boundKeyHandler);
      this._boundKeyHandler = null;
    }
    document.body.style.overflow = '';
    this.removeEventListener('table-settings-change', this._handleTableSettingsChange as EventListener);
    this.removeEventListener('column-config-change', this._handleColumnConfigChange as EventListener);
    this.removeEventListener('rules-change', this._handleRulesChange as EventListener);
    this.removeEventListener('columns-change', this._handleColumnsChange as EventListener);
  }

  // ── Sync local state from child component events ──

  private _handleTableSettingsChange = (e: CustomEvent) => {
    const { key, value } = e.detail;
    this.tableSettings = { ...this.tableSettings, [key]: value };
    this.scheduleAutoSave();
  };

  private _handleColumnConfigChange = (e: CustomEvent) => {
    const { field, type, formatting, numberFormat, statusColors: sc, barThresholds: bt, dateFormat, linkTemplate } = e.detail;
    if (type !== undefined) {
      this.columnTypes = { ...this.columnTypes, [field]: type };
    }
    if (formatting !== undefined) {
      this.columnFormatting = { ...this.columnFormatting, [field]: formatting };
    }
    if (numberFormat !== undefined) {
      this.numberFormats = { ...this.numberFormats, [field]: numberFormat };
    }
    if (sc !== undefined) {
      this.statusColors = { ...sc };
    }
    if (bt !== undefined) {
      this.barThresholds = [...bt];
    }
    if (dateFormat !== undefined) {
      this.dateFormats = { ...this.dateFormats, [field]: dateFormat };
    }
    if (linkTemplate !== undefined) {
      this.linkTemplates = { ...this.linkTemplates, [field]: linkTemplate };
    }
    this.scheduleAutoSave();
  };

  private _handleRulesChange = (e: CustomEvent) => {
    const { action, ruleId, updates } = e.detail;
    let rules = [...this.formattingRules];
    if (action === 'add') {
      rules.push({
        id: ruleId,
        field: this.fields[0] || '',
        condition: { operator: 'equals', value: '' },
        style: { backgroundColor: '#ffffff', color: '#000000', fontWeight: 'normal' },
      });
    } else if (action === 'remove') {
      rules = rules.filter((r: any) => r.id !== ruleId);
    } else if (action === 'update') {
      rules = rules.map((r: any) => {
        if (r.id !== ruleId || !updates) return r;
        const updated = { ...r };
        if (updates.field !== undefined) updated.field = updates.field;
        if (updates.operator !== undefined) updated.condition = { ...updated.condition, operator: updates.operator };
        if (updates.value !== undefined) updated.condition = { ...updated.condition, value: updates.value };
        if (updates.value2 !== undefined) updated.condition = { ...updated.condition, value2: updates.value2 };
        if (updates.backgroundColor !== undefined) updated.style = { ...updated.style, backgroundColor: updates.backgroundColor };
        if (updates.color !== undefined) updated.style = { ...updated.style, color: updates.color };
        if (updates.fontWeight !== undefined) updated.style = { ...updated.style, fontWeight: updates.fontWeight };
        return updated;
      });
    }
    this.formattingRules = rules;
  };

  private _handleColumnsChange = (e: CustomEvent) => {
    const { action, visibleFields } = e.detail;
    if (action === 'show-all') {
      this.columns = (this.columns ?? []).map((c: any) => ({ ...c, visible: true }));
    } else if (action === 'hide-all') {
      this.columns = (this.columns ?? []).map((c: any) => ({ ...c, visible: false }));
    } else if (visibleFields) {
      this.columns = (this.columns ?? []).map((c: any) => ({ ...c, visible: visibleFields.includes(c.field) }));
    }
  };

  /** Returns the current admin state as a ReportPresentation bundle. */
  getSettings(): ReportPresentation {
    const presentation: ReportPresentation = {};
    if (this.tableSettings && Object.keys(this.tableSettings ?? {}).length > 0) {
      presentation.tableSettings = { ...this.tableSettings };
    }
    if (this.columnFormatting && Object.keys(this.columnFormatting ?? {}).length > 0) {
      presentation.columnFormatting = { ...this.columnFormatting };
    }
    if (this.numberFormats && Object.keys(this.numberFormats ?? {}).length > 0) {
      presentation.numberFormats = { ...this.numberFormats };
    }
    if (this.filterPresets && Object.keys(this.filterPresets ?? {}).length > 0) {
      presentation.filterPresets = { ...this.filterPresets };
    }
    if (this.columnTypes && Object.keys(this.columnTypes ?? {}).length > 0) {
      presentation.columnTypes = { ...this.columnTypes };
    }
    if (this.statusColors && Object.keys(this.statusColors ?? {}).length > 0) {
      presentation.statusColors = { ...this.statusColors };
    }
    if (this.barThresholds && (this.barThresholds ?? []).length > 0) {
      presentation.barThresholds = [...this.barThresholds];
    }
    if (this.dateFormats && Object.keys(this.dateFormats ?? {}).length > 0) {
      presentation.dateFormats = { ...this.dateFormats };
    }
    if (this.linkTemplates && Object.keys(this.linkTemplates ?? {}).length > 0) {
      presentation.linkTemplates = { ...this.linkTemplates };
    }
    // Read export settings from export child component if available
    const exportEl = this.shadowRoot?.querySelector('phz-admin-export') as any;
    if (exportEl) {
      presentation.exportSettings = {
        format: exportEl.format || 'csv',
        includeHeaders: exportEl.includeHeaders ?? true,
        includeFormatting: exportEl.includeFormatting ?? false,
        includeGroupHeaders: exportEl.includeGroupHeaders ?? true,
        separator: exportEl.separator || ',',
        selectedColumns: exportEl.selectedColumns || [],
      };
    }
    return presentation;
  }

  /** Populates facade properties from a ReportPresentation bundle. */
  setSettings(presentation: ReportPresentation): void {
    if (presentation.tableSettings) {
      this.tableSettings = { ...this.tableSettings, ...presentation.tableSettings };
    }
    if (presentation.columnFormatting) {
      this.columnFormatting = { ...presentation.columnFormatting };
    }
    if (presentation.numberFormats) {
      this.numberFormats = { ...presentation.numberFormats };
    }
    if (presentation.filterPresets) {
      this.filterPresets = { ...presentation.filterPresets };
    }
    if (presentation.columnTypes) {
      this.columnTypes = { ...presentation.columnTypes };
    }
    if (presentation.statusColors) {
      this.statusColors = { ...presentation.statusColors };
    }
    if (presentation.barThresholds) {
      this.barThresholds = [...presentation.barThresholds];
    }
    if (presentation.dateFormats) {
      this.dateFormats = { ...presentation.dateFormats };
    }
    if (presentation.linkTemplates) {
      this.linkTemplates = { ...presentation.linkTemplates };
    }
    this.requestUpdate();
  }

  private scheduleAutoSave(): void {
    if (this._autoSaveTimer) clearTimeout(this._autoSaveTimer);
    this._autoSaveTimer = setTimeout(() => {
      this.dispatchEvent(new CustomEvent('settings-auto-save', {
        bubbles: true, composed: true,
        detail: {
          reportId: this.reportId,
          reportName: this.reportName,
          settings: this.getSettings(),
        },
      }));
    }, 2000);
  }

  private handleSaveSettings() {
    this.dispatchEvent(new CustomEvent('settings-save', {
      bubbles: true,
      composed: true,
      detail: {
        reportId: this.reportId,
        reportName: this.reportName,
        settings: this.getSettings(),
      },
    }));
    this._saveState = 'saved';
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => { this._saveState = 'idle'; }, 2000);
  }

  private _handleReset() {
    if (!confirm('Reset all settings to defaults? This cannot be undone.')) return;
    this.dispatchEvent(new CustomEvent('settings-reset', {
      bubbles: true,
      composed: true,
      detail: { reportId: this.reportId },
    }));
  }

  private handleClose() {
    // Auto-save on close
    this.scheduleAutoSave();
    this.dispatchEvent(new CustomEvent('admin-close', { bubbles: true, composed: true }));
  }

  private handleCopySettings() {
    this.dispatchEvent(new CustomEvent('copy-settings-request', {
      bubbles: true, composed: true,
      detail: {
        targetReportId: this.reportId,
        availableReports: this.availableReports,
      },
    }));
  }

  private renderTabContent() {
    switch (this.activeTab) {
      case 'table-settings': return html`<phz-admin-table-settings
            .settings=${this.tableSettings}
            .columnFields=${this.fields ?? []}
            .columnTypes=${this.columnTypes ?? {}}></phz-admin-table-settings>`;
      case 'columns': return html`<phz-admin-columns .columns=${this.columns ?? []}
            .columnTypes=${this.columnTypes ?? {}}
            .statusColors=${this.statusColors ?? {}}
            .barThresholds=${this.barThresholds ?? []}
            .dateFormats=${this.dateFormats ?? {}}
            .linkTemplates=${this.linkTemplates ?? {}}
            .columnFormatting=${this.columnFormatting ?? {}}
            .numberFormats=${this.numberFormats ?? {}}></phz-admin-columns>`;
      case 'formatting': return html`<phz-admin-formatting .rules=${this.formattingRules ?? []}
            .fields=${this.fields ?? []}></phz-admin-formatting>`;
      case 'filters': return html`<phz-admin-filters .presets=${this.filterPresets ?? {}}></phz-admin-filters>`;
      case 'export': return html`<phz-admin-export></phz-admin-export>`;
    }
  }

  private get _saveButtonLabel(): string {
    if (this._saveState === 'saved') return '\u2713 Saved';
    return 'Save';
  }

  private _handleBackdropClick(e: MouseEvent) {
    // Close when clicking the backdrop, not the modal content
    if ((e.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.handleClose();
    }
  }

  render() {
    if (!this.open) return html``;

    return html`
      <div class="modal-backdrop" @click=${this._handleBackdropClick}>
        <div class="grid-admin" role="dialog" aria-modal="true" aria-label="Grid Admin">
          <div class="admin-header">
            <div style="display:flex;align-items:center">
              <h2 class="admin-title">Grid Settings</h2>
              ${this.reportName ? html`<span class="report-badge" title="${this.reportName}">${this.reportName}</span>` : ''}
            </div>
            <div class="admin-actions">
              <button class="save-btn ${this._saveState === 'saved' ? 'save-btn--saved' : ''}" @click=${this.handleSaveSettings} title="Save settings">${this._saveButtonLabel}</button>
              <button class="reset-btn" @click=${this._handleReset} title="Reset to defaults">Reset</button>
              ${(this.availableReports ?? []).length > 0 ? html`
                <button class="copy-btn" @click=${this.handleCopySettings} title="Copy settings from another report">Copy From...</button>
              ` : ''}
              <button class="close-btn" @click=${this.handleClose} aria-label="Close">&times;</button>
            </div>
          </div>

          <div class="phz-admin-tabs" role="tablist">
            ${this.tabs.map(tab => html`
              <button class="phz-admin-tab ${this.activeTab === tab.id ? 'phz-admin-tab--active' : ''}"
                      role="tab"
                      aria-selected=${this.activeTab === tab.id}
                      @click=${() => { this.activeTab = tab.id; }}>
                ${tab.label}
              </button>
            `)}
          </div>

          <div class="admin-body" role="tabpanel">
            ${this.renderTabContent()}
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'phz-grid-admin': PhzGridAdmin; }
}
