/**
 * @phozart/criteria — Criteria Admin
 *
 * Narrow vertical admin panel (320px) with 3 tabs: Fields, Rules, Settings.
 * Designed for side-panel placement following BI tool patterns (MicroStrategy, Cognos).
 *
 * - Fields: expand-to-edit cards (label, type, required, default, lock, reorder)
 * - Rules: field dependencies (stacked vertically) + shared presets
 * - Settings: behavior toggles + panel style
 *
 * Phz UI console mode: monochrome icons, warm neutrals, narrow-optimised layout.
 *
 * @deprecated Use `<phz-filter-designer>` for definition management and
 * `<phz-filter-configurator>` for artefact binding. This component remains
 * functional for backward compatibility.
 */

import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import type {
  CriteriaConfig,
  SelectionFieldDef,
  SelectionFieldType,
  SelectionFieldOption,
  CriterionDependency,
  CriteriaBehavior,
  FilterBarLayout,
  BarMode,
  BarDisplayMode,
  ButtonContent,
  DateRangeFieldConfig,
  DateGranularity,
  DatePresetGroup,
  BuiltinDatePresetId,
  WeekStartDay,
  WeekNumbering,
  ColumnDefinition,
  FieldPresenceConfig,
  CriteriaSelectionMode,
  SummaryStripLayout,
  OptionsSource,
  DataSet,
  FilterDefinition,
  FilterBinding,
  FilterRule,
  FilterDefinitionId,
  ArtefactId,
  SelectionPreset,
  FilterDataSource,
} from '@phozart/core';
import { filterDefinitionId, artefactId as toArtefactId } from '@phozart/core';
import { BUILTIN_DATE_PRESETS, DATE_PRESET_GROUP_LABELS, inferCriteriaType, deriveOptionsFromData, resolveOptionsSource } from '@phozart/engine';
import { criteriaStyles } from '@phozart/criteria/shared-styles';

const ALL_GRANULARITIES: { value: DateGranularity; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' },
];

const ALL_PRESET_GROUPS: { value: DatePresetGroup; label: string }[] = [
  { value: 'relative', label: 'Relative' },
  { value: 'rolling', label: 'Rolling' },
  { value: 'to_date', label: 'To Date' },
  { value: 'previous_complete', label: 'Previous Complete' },
];

type AdminTab = 'fields' | 'layout' | 'rules' | 'settings';

/** A resolved field merging FilterDefinition + FilterBinding (registry-backed) or a raw SelectionFieldDef (legacy) */
interface ResolvedField {
  field: SelectionFieldDef;
  /** If registry-backed, the original definition */
  definition?: FilterDefinition;
  /** If registry-backed, the original binding */
  binding?: FilterBinding;
}

const FIELD_TYPES: { value: SelectionFieldType; label: string }[] = [
  { value: 'single_select', label: 'Single Select' },
  { value: 'multi_select', label: 'Multi Select' },
  { value: 'chip_group', label: 'Chip Group' },
  { value: 'text', label: 'Text' },
  { value: 'period_picker', label: 'Period Picker' },
  { value: 'date_range', label: 'Date Range' },
  { value: 'numeric_range', label: 'Numeric Range' },
  { value: 'tree_select', label: 'Tree Select' },
  { value: 'search', label: 'Search' },
  { value: 'field_presence', label: 'Field Presence' },
];

/* ── Monochrome SVG Icons (Phosphor-style) ── */

const ICONS = {
  fields: html`<svg width="16" height="16" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><rect x="40" y="40" width="176" height="176" rx="8"/><line x1="40" y1="128" x2="216" y2="128"/><line x1="128" y1="40" x2="128" y2="216"/></svg>`,
  rules: html`<svg width="16" height="16" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><circle cx="80" cy="80" r="24"/><circle cx="176" cy="176" r="24"/><line x1="97" y1="97" x2="159" y2="159"/><polyline points="160,112 160,160 112,160"/></svg>`,
  settings: html`<svg width="16" height="16" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><circle cx="128" cy="128" r="40"/><path d="M130.06 20a8 8 0 0 1 7.88 6.71l3.78 22.68a88 88 0 0 1 20.93 12.08l21.6-8.28a8 8 0 0 1 9.7 3.39l20.3 35.17a8 8 0 0 1-1.82 10.1l-17.82 14.4a88 88 0 0 1 0 24.18l17.82 14.4a8 8 0 0 1 1.82 10.1l-20.3 35.17a8 8 0 0 1-9.7 3.39l-21.6-8.28a88 88 0 0 1-20.93 12.08l-3.78 22.68a8 8 0 0 1-7.88 6.71H125.94a8 8 0 0 1-7.88-6.71l-3.78-22.68a88 88 0 0 1-20.93-12.08l-21.6 8.28a8 8 0 0 1-9.7-3.39l-20.3-35.17a8 8 0 0 1 1.82-10.1l17.82-14.4a88 88 0 0 1 0-24.18l-17.82-14.4a8 8 0 0 1-1.82-10.1l20.3-35.17a8 8 0 0 1 9.7-3.39l21.6 8.28a88 88 0 0 1 20.93-12.08l3.78-22.68A8 8 0 0 1 125.94 20Z"/></svg>`,
  add: html`<svg width="14" height="14" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="20" stroke-linecap="round"><line x1="128" y1="40" x2="128" y2="216"/><line x1="40" y1="128" x2="216" y2="128"/></svg>`,
  remove: html`<svg width="12" height="12" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="24" stroke-linecap="round"><line x1="64" y1="64" x2="192" y2="192"/><line x1="192" y1="64" x2="64" y2="192"/></svg>`,
  arrowUp: html`<svg width="12" height="12" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"><line x1="128" y1="216" x2="128" y2="40"/><polyline points="64,104 128,40 192,104"/></svg>`,
  arrowDown: html`<svg width="12" height="12" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"><line x1="128" y1="40" x2="128" y2="216"/><polyline points="64,152 128,216 192,152"/></svg>`,
  chevronDown: html`<svg width="10" height="10" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"><polyline points="48,96 128,176 208,96"/></svg>`,
  chevronRight: html`<svg width="10" height="10" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"><polyline points="96,48 176,128 96,208"/></svg>`,
  arrowDownSmall: html`<svg width="12" height="12" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"><line x1="128" y1="40" x2="128" y2="216"/><polyline points="80,168 128,216 176,168"/></svg>`,
  lock: html`<svg width="12" height="12" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"><rect x="48" y="120" width="160" height="112" rx="8"/><path d="M80 120 V80 a48 48 0 0 1 96 0 v40"/></svg>`,
  drag: html`<svg width="12" height="12" viewBox="0 0 256 256" fill="none"><circle cx="92" cy="60" r="8" fill="currentColor"/><circle cx="164" cy="60" r="8" fill="currentColor"/><circle cx="92" cy="128" r="8" fill="currentColor"/><circle cx="164" cy="128" r="8" fill="currentColor"/><circle cx="92" cy="196" r="8" fill="currentColor"/><circle cx="164" cy="196" r="8" fill="currentColor"/></svg>`,
  presets: html`<svg width="14" height="14" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><rect x="40" y="40" width="176" height="176" rx="8"/><line x1="88" y1="104" x2="168" y2="104"/><line x1="88" y1="136" x2="168" y2="136"/><line x1="88" y1="168" x2="136" y2="168"/></svg>`,
  params: html`<svg width="16" height="16" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round"><line x1="40" y1="80" x2="216" y2="80"/><line x1="40" y1="176" x2="216" y2="176"/><circle cx="96" cy="80" r="16" fill="currentColor"/><circle cx="160" cy="176" r="16" fill="currentColor"/></svg>`,
  layout: html`<svg width="16" height="16" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><rect x="40" y="40" width="176" height="176" rx="8"/><line x1="40" y1="104" x2="216" y2="104"/><line x1="136" y1="104" x2="136" y2="216"/></svg>`,
};

@safeCustomElement('phz-criteria-admin')
export class PhzCriteriaAdmin extends LitElement {
  static styles = [criteriaStyles, css`
    :host { display: block; height: 100%; position: relative; }

    .phz-sc-admin {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #FFFFFF;
    }

    /* ── Resize handle (right edge) ── */
    .phz-sc-admin-resize {
      position: absolute;
      top: 0;
      right: -4px;
      bottom: 0;
      width: 8px;
      cursor: col-resize;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .phz-sc-admin-resize::after {
      content: '';
      width: 3px;
      height: 32px;
      border-radius: 2px;
      background: transparent;
      transition: background 0.15s ease;
    }

    .phz-sc-admin-resize:hover::after,
    .phz-sc-admin-resize--active::after {
      background: #A8A29E;
    }

    :host(.phz-sc-admin--resizing) {
      user-select: none;
    }

    /* ── Header ── */
    .phz-sc-admin-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px;
      border-bottom: 1px solid #E7E5E4;
      background: #FFFFFF;
      flex-shrink: 0;
    }

    .phz-sc-admin-header-icon {
      display: flex;
      align-items: center;
      color: #78716C;
    }

    .phz-sc-admin-title {
      font-size: 14px;
      font-weight: 700;
      color: #1C1917;
      margin: 0;
    }

    .phz-sc-admin-subtitle {
      font-size: 11px;
      color: #A8A29E;
      margin: 0;
    }

    /* ── Tab bar ── */
    .phz-sc-admin-tabs {
      display: flex;
      border-bottom: 1px solid #E7E5E4;
      background: #FAFAF9;
      flex-shrink: 0;
    }

    .phz-sc-admin-tab {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 8px;
      font-size: 11px;
      font-weight: 600;
      color: #78716C;
      cursor: pointer;
      border: none;
      background: none;
      border-bottom: 2px solid transparent;
      transition: all 0.15s;
      font-family: inherit;
      white-space: nowrap;
    }

    .phz-sc-admin-tab:hover {
      color: #44403C;
      background: #F5F5F4;
    }

    .phz-sc-admin-tab--active {
      color: #1C1917;
      border-bottom-color: #1C1917;
      background: #FFFFFF;
    }

    .phz-sc-admin-tab-icon {
      display: flex;
      align-items: center;
    }

    /* ── Tab body (scrollable) ── */
    .phz-sc-admin-body {
      flex: 1;
      overflow-y: auto;
      padding: 12px 16px;
    }

    /* ── Section label ── */
    .phz-sc-admin-section-label {
      font-size: 10px;
      font-weight: 700;
      color: #A8A29E;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin: 12px 0 8px;
    }

    .phz-sc-admin-section-label:first-child {
      margin-top: 0;
    }

    /* ── Field card (collapsed) ── */
    .phz-sc-field-card {
      border: 1px solid #E7E5E4;
      border-radius: 10px;
      margin-bottom: 6px;
      overflow: hidden;
      transition: border-color 0.15s, box-shadow 0.15s;
      background: #FAFAF9;
    }

    .phz-sc-field-card:hover {
      border-color: #D6D3D1;
    }

    .phz-sc-field-card--expanded {
      border-color: #A8A29E;
      box-shadow: 0 2px 4px rgba(28,25,23,0.06);
      background: #FFFFFF;
    }

    .phz-sc-field-card-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 10px;
      cursor: pointer;
      user-select: none;
      border: none;
      background: transparent;
      width: 100%;
      text-align: left;
      font-family: inherit;
      color: inherit;
    }

    .phz-sc-field-card-header:hover {
      background: #F5F5F4;
    }

    .phz-sc-field-card-drag {
      color: #D6D3D1;
      display: flex;
      align-items: center;
      cursor: grab;
      flex-shrink: 0;
    }

    .phz-sc-field-card-drag:hover {
      color: #78716C;
    }

    .phz-sc-field-card-name {
      flex: 1;
      font-size: 13px;
      font-weight: 500;
      color: #1C1917;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .phz-sc-field-card-type {
      font-size: 9px;
      font-weight: 600;
      color: #78716C;
      padding: 1px 6px;
      background: #F5F5F4;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      font-family: 'SF Mono', 'JetBrains Mono', ui-monospace, monospace;
      flex-shrink: 0;
    }

    .phz-sc-field-card-remove {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border: none;
      background: transparent;
      border-radius: 5px;
      cursor: pointer;
      color: #D6D3D1;
      transition: all 0.15s;
      flex-shrink: 0;
      opacity: 0;
      pointer-events: none;
    }

    .phz-sc-field-card:hover .phz-sc-field-card-remove,
    .phz-sc-field-card--expanded .phz-sc-field-card-remove {
      opacity: 1;
      pointer-events: auto;
    }

    .phz-sc-field-card-remove:hover {
      background: #FEF2F2;
      color: #DC2626;
    }

    .phz-sc-field-card-chevron {
      display: flex;
      align-items: center;
      color: #A8A29E;
      transition: transform 0.15s;
      flex-shrink: 0;
    }

    .phz-sc-field-card--expanded .phz-sc-field-card-chevron {
      transform: rotate(90deg);
    }

    /* ── Field card (expanded editor) ── */
    .phz-sc-field-card-body {
      padding: 8px 10px 12px;
      border-top: 1px solid #E7E5E4;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .phz-sc-field-form-row {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .phz-sc-field-form-label {
      font-size: 10px;
      font-weight: 600;
      color: #78716C;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .phz-sc-field-form-actions {
      display: flex;
      gap: 4px;
      padding-top: 4px;
      border-top: 1px solid #F5F5F4;
      margin-top: 4px;
    }

    /* ── Icon buttons ── */
    .phz-sc-icon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      color: #A8A29E;
      transition: all 0.15s;
      flex-shrink: 0;
    }

    .phz-sc-icon-btn:hover {
      background: #F5F5F4;
      color: #1C1917;
    }

    .phz-sc-icon-btn--danger:hover {
      background: #FEF2F2;
      color: #DC2626;
    }

    /* ── Toggle rows ── */
    .phz-sc-admin-toggle {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 0;
      border-bottom: 1px solid #F5F5F4;
    }

    .phz-sc-admin-toggle:last-child {
      border-bottom: none;
    }

    .phz-sc-toggle-switch {
      position: relative;
      width: 36px;
      height: 20px;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .phz-sc-toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
      position: absolute;
    }

    .phz-sc-toggle-track {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background: #D6D3D1;
      border-radius: 10px;
      transition: background 0.2s;
    }

    .phz-sc-toggle-track::after {
      content: '';
      position: absolute;
      width: 16px;
      height: 16px;
      left: 2px;
      top: 2px;
      background: white;
      border-radius: 50%;
      transition: transform 0.2s;
      box-shadow: 0 1px 2px rgba(28,25,23,0.12);
    }

    .phz-sc-toggle-switch input:checked + .phz-sc-toggle-track {
      background: #1C1917;
    }

    .phz-sc-toggle-switch input:checked + .phz-sc-toggle-track::after {
      transform: translateX(16px);
    }

    .phz-sc-toggle-text {
      flex: 1;
      min-width: 0;
    }

    .phz-sc-toggle-label {
      font-size: 13px;
      color: #44403C;
      cursor: pointer;
    }

    .phz-sc-toggle-desc {
      font-size: 11px;
      color: #A8A29E;
      line-height: 1.4;
    }

    /* ── Inline toggle (single-line) ── */
    .phz-sc-inline-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .phz-sc-inline-toggle-label {
      font-size: 12px;
      color: #57534E;
    }

    /* ── Dependency card (stacked) ── */
    .phz-sc-dep-card {
      border: 1px solid #E7E5E4;
      border-radius: 10px;
      padding: 10px;
      margin-bottom: 6px;
      background: #FAFAF9;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .phz-sc-dep-card-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .phz-sc-dep-card-label {
      font-size: 10px;
      font-weight: 600;
      color: #A8A29E;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      width: 38px;
      flex-shrink: 0;
    }

    .phz-sc-dep-arrow {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #A8A29E;
      padding: 0 0 0 38px;
    }

    /* ── Add button ── */
    .phz-sc-add-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px;
      border: 1px dashed #D6D3D1;
      border-radius: 10px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      color: #78716C;
      background: none;
      width: 100%;
      transition: all 0.15s;
      font-family: inherit;
    }

    .phz-sc-add-btn:hover {
      border-color: #1C1917;
      color: #1C1917;
      background: #FAFAF9;
    }

    /* ── Empty state ── */
    .phz-sc-empty {
      text-align: center;
      font-size: 12px;
      color: #A8A29E;
      padding: 20px 12px;
      line-height: 1.5;
    }

    .phz-sc-empty-icon {
      display: block;
      margin: 0 auto 6px;
      color: #D6D3D1;
    }

    /* ── Style selector ── */
    .phz-sc-style-group {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #F5F5F4;
    }

    /* ── Layout tab ── */
    .phz-sc-layout-section {
      margin-bottom: 16px;
    }

    .phz-sc-layout-section-title {
      font-size: 10px;
      font-weight: 700;
      color: #A8A29E;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin: 0 0 8px;
    }

    .phz-sc-layout-row {
      display: flex;
      flex-direction: column;
      gap: 3px;
      margin-bottom: 10px;
    }

    .phz-sc-layout-row-label {
      font-size: 10px;
      font-weight: 600;
      color: #78716C;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .phz-sc-color-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .phz-sc-color-input {
      width: 32px;
      height: 28px;
      border: 1px solid #E7E5E4;
      border-radius: 6px;
      padding: 2px;
      cursor: pointer;
      background: #FFFFFF;
      flex-shrink: 0;
    }

    .phz-sc-color-input::-webkit-color-swatch-wrapper { padding: 0; }
    .phz-sc-color-input::-webkit-color-swatch { border: none; border-radius: 4px; }

    .phz-sc-color-hex {
      flex: 1;
      min-width: 0;
    }

    .phz-sc-layout-preview {
      border: 1px solid #E7E5E4;
      border-radius: 10px;
      padding: 12px;
      background: #FAFAF9;
      margin-top: 8px;
    }

    .phz-sc-layout-preview-label {
      font-size: 9px;
      font-weight: 700;
      color: #A8A29E;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 8px;
    }

    .phz-sc-btn-group {
      display: flex;
      gap: 0;
      border: 1px solid #E7E5E4;
      border-radius: 8px;
      overflow: hidden;
    }

    .phz-sc-btn-group-item {
      flex: 1;
      padding: 6px 8px;
      font-size: 11px;
      font-weight: 500;
      color: #78716C;
      background: #FFFFFF;
      border: none;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.15s;
      border-right: 1px solid #E7E5E4;
      text-align: center;
      white-space: nowrap;
    }

    .phz-sc-btn-group-item:last-child { border-right: none; }
    .phz-sc-btn-group-item:hover { background: #F5F5F4; }
    .phz-sc-btn-group-item--active {
      background: #1C1917;
      color: #FFFFFF;
    }
    .phz-sc-btn-group-item--active:hover { background: #292524; }
  `];

  @property({ type: Object }) criteriaConfig: CriteriaConfig = { fields: [] };
  @property({ type: Array }) availableFields: string[] = [];
  @property({ type: Array }) columns: ColumnDefinition[] = [];
  @property({ type: Array }) data: Record<string, unknown>[] = [];
  @property({ type: Object }) dataSources?: Record<string, DataSet>;

  /** Central filter definitions from registry */
  @property({ type: Array }) filterDefinitions: FilterDefinition[] = [];

  /** Filter bindings for the current artefact */
  @property({ type: Array }) filterBindings: FilterBinding[] = [];

  /** Filter rules */
  @property({ type: Array }) filterRules: FilterRule[] = [];

  /** Shared presets */
  @property({ type: Array }) sharedPresets: SelectionPreset[] = [];

  /** User presets */
  @property({ type: Array }) userPresets: SelectionPreset[] = [];

  /** Current artefact ID (report/dashboard) */
  @property({ type: String }) artefactId: string = '';

  /** Enable drag-to-resize handle on the right edge */
  @property({ type: Boolean }) resizable = true;
  @property({ type: Number }) minWidth = 280;
  @property({ type: Number }) maxWidth = 800;

  @state() private _activeTab: AdminTab = 'fields';
  @state() private _expandedFieldIdx: number = -1;
  @state() private _showColumnPicker: boolean = false;
  @state() private _showDefinitionPicker: boolean = false;
  @state() private _resizing = false;
  @state() private _studioOpen = false;
  @state() private _editingDef?: FilterDefinition;

  private _startX = 0;
  private _startWidth = 0;
  private _deprecationWarned = false;

  connectedCallback(): void {
    super.connectedCallback();
    if (!this._deprecationWarned) {
      console.warn(
        '[phz-criteria-admin] Deprecated: use <phz-filter-designer> for definition management ' +
        'and <phz-filter-configurator> for artefact binding configuration.'
      );
      this._deprecationWarned = true;
    }
  }

  /* ── Resize logic ─────────────────────────────── */

  private _onResizeStart(e: PointerEvent) {
    e.preventDefault();
    this._resizing = true;
    this._startX = e.clientX;
    this._startWidth = this.getBoundingClientRect().width;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    this.classList.add('phz-sc-admin--resizing');
    document.addEventListener('pointermove', this._onResizeMove);
    document.addEventListener('pointerup', this._onResizeEnd);
  }

  private _onResizeMove = (e: PointerEvent) => {
    const delta = e.clientX - this._startX;
    const newWidth = Math.min(this.maxWidth, Math.max(this.minWidth, this._startWidth + delta));
    this.style.width = `${Math.round(newWidth)}px`;
  };

  private _onResizeEnd = () => {
    document.removeEventListener('pointermove', this._onResizeMove);
    document.removeEventListener('pointerup', this._onResizeEnd);
    this._resizing = false;
    this.classList.remove('phz-sc-admin--resizing');
    const currentWidth = Math.round(this.getBoundingClientRect().width);
    this.dispatchEvent(new CustomEvent('admin-resize', {
      bubbles: true, composed: true,
      detail: { width: currentWidth },
    }));
  };

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('pointermove', this._onResizeMove);
    document.removeEventListener('pointerup', this._onResizeEnd);
  }

  private _emit() {
    this.dispatchEvent(new CustomEvent('criteria-config-change', {
      detail: { config: { ...this.criteriaConfig } },
      bubbles: true, composed: true,
    }));
  }

  // --- Registry helpers ---

  /** Whether registry definitions are available for this admin */
  private get _isRegistryBacked(): boolean {
    return this.filterDefinitions.length > 0;
  }

  /** Artefact ID as branded type */
  private get _artId(): ArtefactId {
    return toArtefactId(this.artefactId);
  }

  /**
   * Resolved fields: merged view of FilterDefinition + FilterBinding (registry-backed)
   * or raw SelectionFieldDef from criteriaConfig (legacy fallback).
   */
  private get _resolvedFields(): ResolvedField[] {
    // If we have definitions + bindings → resolve from registry
    if (this._isRegistryBacked && this.filterBindings.length > 0) {
      const defMap = new Map(this.filterDefinitions.map(d => [d.id as string, d]));
      return this.filterBindings
        .filter(b => !this.artefactId || b.artefactId === this._artId)
        .sort((a, b) => a.order - b.order)
        .map(binding => {
          const def = defMap.get(binding.filterDefinitionId as string);
          if (!def || def.deprecated) return null;
          const field: SelectionFieldDef = {
            id: def.id as string,
            label: binding.labelOverride ?? def.label,
            type: def.type,
            dataField: def.dataField,
            options: def.options,
            treeOptions: def.treeOptions,
            dateRangeConfig: def.dateRangeConfig,
            numericRangeConfig: def.numericRangeConfig,
            searchConfig: def.searchConfig,
            fieldPresenceConfig: def.fieldPresenceConfig,
            defaultValue: binding.defaultValueOverride ?? def.defaultValue,
            required: binding.requiredOverride ?? def.required,
            selectionMode: def.selectionMode,
            dependsOn: def.dependsOn?.[0] as string | undefined,
            barConfig: binding.barConfigOverride,
          };
          return { field, definition: def, binding } as ResolvedField;
        })
        .filter((r): r is ResolvedField => r !== null);
    }

    // Legacy fallback: wrap each SelectionFieldDef
    return this.criteriaConfig.fields.map(field => ({ field }));
  }

  /** Definitions not yet bound to this artefact */
  private get _unboundDefinitions(): FilterDefinition[] {
    const boundIds = new Set(
      this.filterBindings
        .filter(b => !this.artefactId || b.artefactId === this._artId)
        .map(b => b.filterDefinitionId as string)
    );
    return this.filterDefinitions.filter(d => !d.deprecated && !boundIds.has(d.id as string));
  }

  // --- Binding event emitters ---

  private _emitBindingAdd(defId: FilterDefinitionId) {
    const order = this.filterBindings.filter(
      b => !this.artefactId || b.artefactId === this._artId
    ).length;
    this.dispatchEvent(new CustomEvent('binding-add', {
      detail: { filterDefinitionId: defId, artefactId: this._artId, order },
      bubbles: true, composed: true,
    }));
  }

  private _emitBindingRemove(defId: FilterDefinitionId) {
    this.dispatchEvent(new CustomEvent('binding-remove', {
      detail: { filterDefinitionId: defId, artefactId: this._artId },
      bubbles: true, composed: true,
    }));
  }

  private _emitBindingUpdate(defId: FilterDefinitionId, patch: Partial<Omit<FilterBinding, 'filterDefinitionId' | 'artefactId'>>) {
    this.dispatchEvent(new CustomEvent('binding-update', {
      detail: { filterDefinitionId: defId, artefactId: this._artId, patch },
      bubbles: true, composed: true,
    }));
  }

  private _emitBindingReorder(orderedIds: FilterDefinitionId[]) {
    this.dispatchEvent(new CustomEvent('binding-reorder', {
      detail: { artefactId: this._artId, orderedIds },
      bubbles: true, composed: true,
    }));
  }

  private _emitDefinitionCreate(definition: FilterDefinition) {
    this.dispatchEvent(new CustomEvent('definition-create', {
      detail: { definition },
      bubbles: true, composed: true,
    }));
  }

  // --- Column helpers ---

  /** Columns not yet used as criteria fields */
  private get _unusedColumns(): ColumnDefinition[] {
    const usedFields = new Set(this.criteriaConfig.fields.map(f => f.dataField ?? f.id));
    return (this.columns ?? []).filter(c => !usedFields.has(c.field));
  }

  /** Whether we have column metadata to drive the picker */
  private get _hasColumns(): boolean {
    return (this.columns ?? []).length > 0;
  }

  // --- Fields ---

  private _addField() {
    const id = `field_${Date.now()}`;
    const newField: SelectionFieldDef = { id, label: 'New Field', type: 'single_select' };
    const fields = [...this.criteriaConfig.fields, newField];
    this.criteriaConfig = { ...this.criteriaConfig, fields };
    this._expandedFieldIdx = fields.length - 1;
    this._showColumnPicker = false;
    this._emit();
  }

  private _addFieldFromColumn(col: ColumnDefinition) {
    const options = deriveOptionsFromData(this.data, col.field);
    const suggestedType = inferCriteriaType(col.type, options.length);
    const label = col.header ?? col.field;

    const newField: SelectionFieldDef = {
      id: col.field,
      label,
      type: suggestedType,
      dataField: col.field,
      ...(suggestedType === 'numeric_range' ? {
        numericRangeConfig: (() => {
          const vals = (this.data ?? []).map(r => Number(r[col.field])).filter(n => !isNaN(n));
          const min = vals.reduce((m, v) => v < m ? v : m, Infinity);
          const max = vals.reduce((m, v) => v > m ? v : m, -Infinity);
          return { min, max, step: Math.round((max - min) / 20) || 1, showSlider: true };
        })(),
      } : {}),
      ...(suggestedType === 'search' ? {
        searchConfig: { minChars: 2, debounceMs: 200, maxSuggestions: 10 },
        options,
      } : {}),
      ...((suggestedType === 'single_select' || suggestedType === 'multi_select' || suggestedType === 'chip_group') ? { options } : {}),
    };

    const fields = [...this.criteriaConfig.fields, newField];
    this.criteriaConfig = { ...this.criteriaConfig, fields };
    this._expandedFieldIdx = fields.length - 1;
    this._showColumnPicker = false;
    this._emit();
  }

  private _removeField(idx: number) {
    const fields = [...this.criteriaConfig.fields];
    fields.splice(idx, 1);
    this.criteriaConfig = { ...this.criteriaConfig, fields };
    if (this._expandedFieldIdx === idx) this._expandedFieldIdx = -1;
    else if (this._expandedFieldIdx > idx) this._expandedFieldIdx--;
    this._emit();
  }

  private _updateField(idx: number, updates: Partial<SelectionFieldDef>) {
    const fields = [...this.criteriaConfig.fields];
    fields[idx] = { ...fields[idx], ...updates };
    this.criteriaConfig = { ...this.criteriaConfig, fields };
    this._emit();
  }

  private _updateDateConfig(idx: number, updates: Partial<DateRangeFieldConfig>) {
    const field = this.criteriaConfig.fields[idx];
    const current = field.dateRangeConfig ?? {};
    this._updateField(idx, { dateRangeConfig: { ...current, ...updates } });
  }

  private _toggleGranularity(idx: number, gran: DateGranularity) {
    const field = this.criteriaConfig.fields[idx];
    const current = field.dateRangeConfig?.availableGranularities ?? ['day', 'week', 'month', 'quarter', 'year'];
    const newGrans = current.includes(gran)
      ? current.filter(g => g !== gran)
      : [...current, gran];
    if (newGrans.length === 0) return; // must have at least one
    this._updateDateConfig(idx, { availableGranularities: newGrans });
  }

  private _togglePresetGroup(idx: number, group: DatePresetGroup) {
    const field = this.criteriaConfig.fields[idx];
    const current = field.dateRangeConfig?.availablePresetGroups ?? ['relative', 'rolling', 'to_date', 'previous_complete'];
    const newGroups = current.includes(group)
      ? current.filter(g => g !== group)
      : [...current, group];
    this._updateDateConfig(idx, { availablePresetGroups: newGroups });
  }

  private _updatePresenceConfig(idx: number, updates: Partial<FieldPresenceConfig>) {
    const field = this.criteriaConfig.fields[idx];
    const current = field.fieldPresenceConfig ?? { fields: [] };
    this._updateField(idx, { fieldPresenceConfig: { ...current, ...updates } });
  }

  private _togglePresenceField(idx: number, colField: string) {
    const field = this.criteriaConfig.fields[idx];
    const current = field.fieldPresenceConfig?.fields ?? [];
    const newFields = current.includes(colField)
      ? current.filter(f => f !== colField)
      : [...current, colField];
    this._updatePresenceConfig(idx, { fields: newFields });
  }

  private _supportsSelectionMode(type: SelectionFieldType): boolean {
    return ['single_select', 'multi_select', 'chip_group', 'tree_select', 'search'].includes(type);
  }

  private _supportsOptions(type: SelectionFieldType): boolean {
    return ['single_select', 'multi_select', 'chip_group', 'search'].includes(type);
  }

  private _getDataSetNames(): string[] {
    return Object.keys(this.dataSources ?? {});
  }

  private _getDataSetColumns(dataSetId: string): string[] {
    const ds = this.dataSources?.[dataSetId];
    if (!ds) return [];
    return ds.columns.map(c => c.field);
  }

  private _toFilterDataSources(): FilterDataSource[] {
    if (!this.dataSources) return [];
    return Object.entries(this.dataSources ?? {}).map(([id, ds]) => ({
      id,
      name: ds.meta?.source ?? id,
      columns: ds.columns.map(c => c.field),
      sampleRows: ds.rows.slice(0, 5),
    }));
  }

  private _getOptionsMode(field: SelectionFieldDef): 'manual' | 'data_column' | 'external' {
    if (field.optionsSource) return 'external';
    if (!field.options?.length && field.dataField) return 'data_column';
    return 'manual';
  }

  private _updateOptionsSource(idx: number, updates: Partial<OptionsSource>) {
    const field = this.criteriaConfig.fields[idx];
    const current = field.optionsSource ?? { dataSetId: '', valueField: '' };
    this._updateField(idx, { optionsSource: { ...current, ...updates } });
  }

  private _defaultSelectionMode(type: SelectionFieldType): CriteriaSelectionMode {
    return type === 'single_select' ? 'single' : 'multiple';
  }

  private _moveField(idx: number, direction: -1 | 1) {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= this.criteriaConfig.fields.length) return;
    const fields = [...this.criteriaConfig.fields];
    [fields[idx], fields[newIdx]] = [fields[newIdx], fields[idx]];
    this.criteriaConfig = { ...this.criteriaConfig, fields };
    if (this._expandedFieldIdx === idx) this._expandedFieldIdx = newIdx;
    else if (this._expandedFieldIdx === newIdx) this._expandedFieldIdx = idx;
    this._emit();
  }

  private _toggleFieldExpand(idx: number) {
    this._expandedFieldIdx = this._expandedFieldIdx === idx ? -1 : idx;
  }

  /** Reorder a registry-backed binding field by emitting binding-reorder */
  private _moveBindingField(idx: number, direction: -1 | 1) {
    const resolved = this._resolvedFields;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= resolved.length) return;

    const orderedIds = resolved.map(r => {
      if (r.binding) return r.binding.filterDefinitionId;
      return filterDefinitionId(r.field.id);
    });
    [orderedIds[idx], orderedIds[newIdx]] = [orderedIds[newIdx], orderedIds[idx]];
    this._emitBindingReorder(orderedIds);

    if (this._expandedFieldIdx === idx) this._expandedFieldIdx = newIdx;
    else if (this._expandedFieldIdx === newIdx) this._expandedFieldIdx = idx;
  }

  // --- Dependencies ---

  private _addDependency() {
    const fields = this.criteriaConfig.fields;
    if (fields.length < 2) return;
    const dep: CriterionDependency = { parentFieldId: fields[0].id, childFieldId: fields[1].id };
    this.criteriaConfig = {
      ...this.criteriaConfig,
      dependencies: [...(this.criteriaConfig.dependencies ?? []), dep],
    };
    this._emit();
  }

  private _removeDependency(idx: number) {
    const deps = [...(this.criteriaConfig.dependencies ?? [])];
    deps.splice(idx, 1);
    this.criteriaConfig = { ...this.criteriaConfig, dependencies: deps };
    this._emit();
  }

  private _updateDependency(idx: number, field: 'parentFieldId' | 'childFieldId', value: string) {
    const deps = [...(this.criteriaConfig.dependencies ?? [])];
    deps[idx] = { ...deps[idx], [field]: value };
    this.criteriaConfig = { ...this.criteriaConfig, dependencies: deps };
    this._emit();
  }

  // --- Behavior ---

  private _updateBehavior(updates: Partial<CriteriaBehavior>) {
    this.criteriaConfig = {
      ...this.criteriaConfig,
      behavior: { ...(this.criteriaConfig.behavior ?? {}), ...updates },
    };
    this._emit();
  }

  // --- Layout ---

  private get _layout(): FilterBarLayout {
    return this.criteriaConfig.behavior?.layout ?? {};
  }

  private _updateLayout(updates: Partial<FilterBarLayout>) {
    const current = this._layout;
    this._updateBehavior({ layout: { ...current, ...updates } });
  }

  private get _summaryLayout(): SummaryStripLayout {
    return this._layout.summaryStrip ?? {};
  }

  private _updateSummaryLayout(updates: Partial<SummaryStripLayout>) {
    const current = this._summaryLayout;
    this._updateLayout({ summaryStrip: { ...current, ...updates } });
  }

  // ── Render: Fields Tab ──

  private _renderFieldCard(field: SelectionFieldDef, idx: number) {
    const expanded = this._expandedFieldIdx === idx;
    const typeLabel = FIELD_TYPES.find(t => t.value === field.type)?.label ?? field.type;
    const shortType = typeLabel.split(' ').map(w => w[0]).join('');

    return html`
      <div class="phz-sc-field-card ${expanded ? 'phz-sc-field-card--expanded' : ''}">
        <button class="phz-sc-field-card-header" @click=${() => this._toggleFieldExpand(idx)}>
          <span class="phz-sc-field-card-drag" @click=${(e: Event) => e.stopPropagation()}>${ICONS.drag}</span>
          <span class="phz-sc-field-card-name">${field.label}</span>
          ${field.fieldRole === 'parameter' ? html`<span class="phz-sc-field-card-type" style="background:#EFF6FF; color:#1D4ED8">PARAM</span>` : nothing}
          <span class="phz-sc-field-card-type" title=${typeLabel}>${shortType}</span>
          ${field.required ? html`<span style="color:#DC2626; font-size:12px; font-weight:700; flex-shrink:0">*</span>` : nothing}
          <button class="phz-sc-field-card-remove" @click=${(e: Event) => { e.stopPropagation(); this._removeField(idx); }} title="Remove field">${ICONS.remove}</button>
          <span class="phz-sc-field-card-chevron">${expanded ? ICONS.chevronDown : ICONS.chevronRight}</span>
        </button>

        ${expanded ? html`
          <div class="phz-sc-field-card-body">
            <div class="phz-sc-field-form-row">
              <label class="phz-sc-field-form-label">Data column</label>
              ${field.fieldRole === 'parameter' ? html`
                <input class="phz-sc-input" placeholder="Column name (optional)"
                  style="font-family:'SF Mono',ui-monospace,monospace; font-size:12px"
                  .value=${field.dataField ?? ''}
                  @change=${(e: Event) => this._updateField(idx, { dataField: (e.target as HTMLInputElement).value || undefined })} />
              ` : html`
                <div style="font-size:12px; color:#57534E; font-family:'SF Mono',ui-monospace,monospace; padding:4px 0">${field.dataField ?? '—'}</div>
              `}
            </div>

            <div class="phz-sc-field-form-row">
              <label class="phz-sc-field-form-label">Label</label>
              <input class="phz-sc-input" .value=${field.label}
                @change=${(e: Event) => this._updateField(idx, { label: (e.target as HTMLInputElement).value })} />
            </div>

            <div class="phz-sc-field-form-row">
              <label class="phz-sc-field-form-label">Type</label>
              <select class="phz-sc-select"
                @change=${(e: Event) => this._updateField(idx, { type: (e.target as HTMLSelectElement).value as SelectionFieldType })}>
                ${FIELD_TYPES.map(t => html`
                  <option value=${t.value} ?selected=${field.type === t.value}>${t.label}</option>
                `)}
              </select>
            </div>

            <div class="phz-sc-field-form-row">
              <label class="phz-sc-field-form-label">Role</label>
              <select class="phz-sc-select"
                @change=${(e: Event) => {
                  const role = (e.target as HTMLSelectElement).value as 'parameter' | 'filter';
                  this._updateField(idx, { fieldRole: role === 'filter' ? undefined : role });
                }}>
                <option value="filter" ?selected=${(field.fieldRole ?? 'filter') === 'filter'}>Filter</option>
                <option value="parameter" ?selected=${field.fieldRole === 'parameter'}>Parameter</option>
              </select>
            </div>

            ${this._supportsSelectionMode(field.type) ? html`
              <div class="phz-sc-field-form-row">
                <label class="phz-sc-field-form-label">Selection Mode</label>
                <div class="phz-sc-btn-group">
                  <button class="phz-sc-btn-group-item ${(field.selectionMode ?? this._defaultSelectionMode(field.type)) === 'single' ? 'phz-sc-btn-group-item--active' : ''}"
                    @click=${() => this._updateField(idx, { selectionMode: 'single' })}>Single</button>
                  <button class="phz-sc-btn-group-item ${(field.selectionMode ?? this._defaultSelectionMode(field.type)) === 'multiple' ? 'phz-sc-btn-group-item--active' : ''}"
                    @click=${() => this._updateField(idx, { selectionMode: 'multiple' })}>Multiple</button>
                  <button class="phz-sc-btn-group-item ${(field.selectionMode ?? this._defaultSelectionMode(field.type)) === 'none' ? 'phz-sc-btn-group-item--active' : ''}"
                    @click=${() => this._updateField(idx, { selectionMode: 'none' })}>None</button>
                </div>
              </div>
            ` : nothing}

            <div class="phz-sc-field-form-row">
              <label class="phz-sc-field-form-label">Default value</label>
              <input class="phz-sc-input" placeholder="None"
                .value=${field.defaultValue ? String(field.defaultValue) : ''}
                @change=${(e: Event) => this._updateField(idx, { defaultValue: (e.target as HTMLInputElement).value || null })} />
            </div>

            <div style="display:flex; gap:16px; align-items:center; padding-top:4px">
              <div class="phz-sc-inline-toggle">
                <label class="phz-sc-toggle-switch">
                  <input type="checkbox" ?checked=${!!field.required}
                    @change=${(e: Event) => this._updateField(idx, { required: (e.target as HTMLInputElement).checked })} />
                  <span class="phz-sc-toggle-track"></span>
                </label>
                <span class="phz-sc-inline-toggle-label">Required</span>
              </div>
              <div class="phz-sc-inline-toggle">
                <label class="phz-sc-toggle-switch">
                  <input type="checkbox" ?checked=${!!field.lockedValue}
                    @change=${(e: Event) => {
                      const locked = (e.target as HTMLInputElement).checked;
                      this._updateField(idx, { lockedValue: locked ? (field.defaultValue ?? '') : null });
                    }} />
                  <span class="phz-sc-toggle-track"></span>
                </label>
                <span class="phz-sc-inline-toggle-label">${ICONS.lock} Lock</span>
              </div>
            </div>

            ${field.type === 'date_range' ? this._renderDateConfig(field, idx) : nothing}
            ${field.type === 'field_presence' ? this._renderPresenceConfig(field, idx) : nothing}
            ${this._supportsOptions(field.type) ? this._renderOptionsSourceConfig(field, idx) : nothing}

            <div class="phz-sc-field-form-actions">
              <button class="phz-sc-icon-btn" @click=${() => this._moveField(idx, -1)} title="Move up">${ICONS.arrowUp}</button>
              <button class="phz-sc-icon-btn" @click=${() => this._moveField(idx, 1)} title="Move down">${ICONS.arrowDown}</button>
              <div style="flex:1"></div>
              <button class="phz-sc-icon-btn phz-sc-icon-btn--danger" @click=${() => this._removeField(idx)} title="Delete field">${ICONS.remove}</button>
            </div>
          </div>
        ` : nothing}
      </div>
    `;
  }

  private _renderDateConfig(field: SelectionFieldDef, idx: number) {
    const dc = field.dateRangeConfig ?? {};
    const activeGrans = dc.availableGranularities ?? ['day', 'week', 'month', 'quarter', 'year'];
    const activeGroups = dc.availablePresetGroups ?? ['relative', 'rolling', 'to_date', 'previous_complete'];

    return html`
      <div style="border-top:1px solid #F5F5F4; padding-top:8px; margin-top:4px">
        <div class="phz-sc-field-form-label" style="margin-bottom:6px">Date Configuration</div>

        <div class="phz-sc-field-form-row">
          <label class="phz-sc-field-form-label">Granularities</label>
          <div class="phz-sc-chips">
            ${ALL_GRANULARITIES.map(g => html`
              <button class="phz-sc-chip ${activeGrans.includes(g.value) ? 'phz-sc-chip--selected' : ''}"
                @click=${() => this._toggleGranularity(idx, g.value)}
                style="font-size:11px; padding:3px 8px"
              >${g.label}</button>
            `)}
          </div>
        </div>

        <div class="phz-sc-field-form-row">
          <label class="phz-sc-field-form-label">Preset groups</label>
          <div class="phz-sc-chips">
            ${ALL_PRESET_GROUPS.map(g => html`
              <button class="phz-sc-chip ${activeGroups.includes(g.value) ? 'phz-sc-chip--selected' : ''}"
                @click=${() => this._togglePresetGroup(idx, g.value)}
                style="font-size:11px; padding:3px 8px"
              >${g.label}</button>
            `)}
          </div>
        </div>

        <div class="phz-sc-field-form-row">
          <label class="phz-sc-field-form-label">Default preset</label>
          <select class="phz-sc-select"
            @change=${(e: Event) => {
              const val = (e.target as HTMLSelectElement).value;
              this._updateDateConfig(idx, { defaultPresetId: val ? val as BuiltinDatePresetId : undefined });
            }}>
            <option value="">None</option>
            ${BUILTIN_DATE_PRESETS.filter(p => p.id !== 'same-period-last-year').map(p => html`
              <option value=${p.id} ?selected=${dc.defaultPresetId === p.id}>${p.label}</option>
            `)}
          </select>
        </div>

        <div style="display:flex; gap:16px; flex-wrap:wrap; padding-top:4px">
          <div class="phz-sc-inline-toggle">
            <label class="phz-sc-toggle-switch">
              <input type="checkbox" ?checked=${!!dc.comparisonEnabled}
                @change=${(e: Event) => this._updateDateConfig(idx, { comparisonEnabled: (e.target as HTMLInputElement).checked })} />
              <span class="phz-sc-toggle-track"></span>
            </label>
            <span class="phz-sc-inline-toggle-label">Comparison</span>
          </div>
        </div>

        <div style="display:flex; gap:8px; margin-top:6px">
          <div class="phz-sc-field-form-row" style="flex:1">
            <label class="phz-sc-field-form-label">Week start</label>
            <select class="phz-sc-select"
              @change=${(e: Event) => this._updateDateConfig(idx, { weekStartDay: (e.target as HTMLSelectElement).value as WeekStartDay })}>
              <option value="monday" ?selected=${(dc.weekStartDay ?? 'monday') === 'monday'}>Monday</option>
              <option value="sunday" ?selected=${dc.weekStartDay === 'sunday'}>Sunday</option>
            </select>
          </div>
          <div class="phz-sc-field-form-row" style="flex:1">
            <label class="phz-sc-field-form-label">Week numbering</label>
            <select class="phz-sc-select"
              @change=${(e: Event) => this._updateDateConfig(idx, { weekNumbering: (e.target as HTMLSelectElement).value as WeekNumbering })}>
              <option value="iso" ?selected=${(dc.weekNumbering ?? 'iso') === 'iso'}>ISO</option>
              <option value="sequential" ?selected=${dc.weekNumbering === 'sequential'}>Sequential</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }

  private _renderPresenceConfig(field: SelectionFieldDef, idx: number) {
    const pc = field.fieldPresenceConfig ?? { fields: [] };
    const activeFields = pc.fields;
    const allCols = (this.columns ?? []).length > 0 ? (this.columns ?? []) : [];

    return html`
      <div style="border-top:1px solid #F5F5F4; padding-top:8px; margin-top:4px">
        <div class="phz-sc-field-form-label" style="margin-bottom:6px">Monitored Columns</div>
        <div class="phz-sc-chips">
          ${allCols.map(col => html`
            <button class="phz-sc-chip ${activeFields.includes(col.field) ? 'phz-sc-chip--selected' : ''}"
              @click=${() => this._togglePresenceField(idx, col.field)}
              style="font-size:11px; padding:3px 8px"
            >${col.header ?? col.field}</button>
          `)}
        </div>
        ${allCols.length === 0 ? html`<div style="font-size:11px; color:#A8A29E; padding:4px 0">Load data to see available columns</div>` : nothing}

        <div style="padding-top:6px">
          <div class="phz-sc-inline-toggle">
            <label class="phz-sc-toggle-switch">
              <input type="checkbox" ?checked=${!!pc.compact}
                @change=${(e: Event) => this._updatePresenceConfig(idx, { compact: (e.target as HTMLInputElement).checked })} />
              <span class="phz-sc-toggle-track"></span>
            </label>
            <span class="phz-sc-inline-toggle-label">Compact</span>
          </div>
        </div>
      </div>
    `;
  }

  private _renderOptionsSourceConfig(field: SelectionFieldDef, idx: number) {
    const mode = this._getOptionsMode(field);
    const dsNames = this._getDataSetNames();
    const hasDataSources = dsNames.length > 0;
    const src = field.optionsSource;
    const dsColumns = src?.dataSetId ? this._getDataSetColumns(src.dataSetId) : [];

    // Preview: count resolved options
    let previewCount = 0;
    if (mode === 'external' && src?.dataSetId && src?.valueField && this.dataSources) {
      const resolved = resolveOptionsSource(src, this.dataSources);
      previewCount = resolved.length;
    }

    return html`
      <div style="border-top:1px solid #F5F5F4; padding-top:8px; margin-top:4px">
        <div class="phz-sc-field-form-label" style="margin-bottom:6px">Options Source</div>

        <div class="phz-sc-btn-group" style="margin-bottom:8px">
          <button class="phz-sc-btn-group-item ${mode === 'manual' ? 'phz-sc-btn-group-item--active' : ''}"
            @click=${() => {
              this._updateField(idx, { optionsSource: undefined });
            }}>Manual</button>
          <button class="phz-sc-btn-group-item ${mode === 'data_column' ? 'phz-sc-btn-group-item--active' : ''}"
            @click=${() => {
              this._updateField(idx, { optionsSource: undefined, options: [] });
            }}>Data Column</button>
          <button class="phz-sc-btn-group-item ${mode === 'external' ? 'phz-sc-btn-group-item--active' : ''}"
            ?disabled=${!hasDataSources}
            title=${!hasDataSources ? 'No dataSources provided' : ''}
            @click=${() => {
              if (!hasDataSources) return;
              const firstDs = dsNames[0];
              const firstCol = this._getDataSetColumns(firstDs)[0] ?? '';
              this._updateField(idx, { optionsSource: { dataSetId: firstDs, valueField: firstCol }, options: undefined });
            }}>External</button>
        </div>

        ${mode === 'external' && src ? html`
          <div class="phz-sc-field-form-row">
            <label class="phz-sc-field-form-label">Dataset</label>
            <select class="phz-sc-select"
              @change=${(e: Event) => {
                const dsId = (e.target as HTMLSelectElement).value;
                const cols = this._getDataSetColumns(dsId);
                this._updateOptionsSource(idx, { dataSetId: dsId, valueField: cols[0] ?? '', labelField: undefined });
              }}>
              ${dsNames.map(n => html`<option value=${n} ?selected=${src.dataSetId === n}>${n}</option>`)}
            </select>
          </div>

          <div class="phz-sc-field-form-row">
            <label class="phz-sc-field-form-label">Value Field</label>
            <select class="phz-sc-select"
              @change=${(e: Event) => this._updateOptionsSource(idx, { valueField: (e.target as HTMLSelectElement).value })}>
              ${dsColumns.map(c => html`<option value=${c} ?selected=${src.valueField === c}>${c}</option>`)}
            </select>
          </div>

          <div class="phz-sc-field-form-row">
            <label class="phz-sc-field-form-label">Label Field</label>
            <select class="phz-sc-select"
              @change=${(e: Event) => {
                const val = (e.target as HTMLSelectElement).value;
                this._updateOptionsSource(idx, { labelField: val || undefined });
              }}>
              <option value="" ?selected=${!src.labelField}>Same as value</option>
              ${dsColumns.map(c => html`<option value=${c} ?selected=${src.labelField === c}>${c}</option>`)}
            </select>
          </div>

          <div class="phz-sc-field-form-row">
            <label class="phz-sc-field-form-label">Sort By</label>
            <div class="phz-sc-btn-group">
              <button class="phz-sc-btn-group-item ${(src.sortBy ?? 'label') === 'label' ? 'phz-sc-btn-group-item--active' : ''}"
                @click=${() => this._updateOptionsSource(idx, { sortBy: 'label' })}>Label</button>
              <button class="phz-sc-btn-group-item ${src.sortBy === 'value' ? 'phz-sc-btn-group-item--active' : ''}"
                @click=${() => this._updateOptionsSource(idx, { sortBy: 'value' })}>Value</button>
              <button class="phz-sc-btn-group-item ${src.sortBy === 'none' ? 'phz-sc-btn-group-item--active' : ''}"
                @click=${() => this._updateOptionsSource(idx, { sortBy: 'none' })}>None</button>
            </div>
          </div>

          ${previewCount > 0 ? html`
            <div style="font-size:11px; color:#57534E; padding:4px 0; display:flex; align-items:center; gap:4px">
              <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#22C55E"></span>
              ${previewCount} option${previewCount !== 1 ? 's' : ''} resolved
            </div>
          ` : nothing}
        ` : nothing}

        ${mode === 'data_column' ? html`
          <div style="font-size:11px; color:#A8A29E; padding:2px 0; line-height:1.4">
            Options will be derived from the data column <strong style="color:#57534E">${field.dataField ?? field.id}</strong> at runtime
          </div>
        ` : nothing}
      </div>
    `;
  }

  private _renderFieldsTab() {
    const resolved = this._resolvedFields;

    return html`
      ${resolved.length === 0 ? html`
        <div class="phz-sc-empty">
          <span class="phz-sc-empty-icon">${ICONS.fields}</span>
          ${this._isRegistryBacked
            ? html`No filter definitions bound to this report.<br>Use "Add" to select from the registry.`
            : this._hasColumns
              ? html`Select columns from the dataset to create criteria fields`
              : html`No fields defined yet`}
        </div>
      ` : html`
        ${resolved.map((r, i) =>
          r.definition
            ? this._renderBindingFieldCard(r, i)
            : this._renderFieldCard(r.field, i)
        )}
      `}

      ${this._renderFieldAdder()}
    `;
  }

  /** Renders the "Add" button/picker appropriate to the current mode */
  private _renderFieldAdder() {
    // Registry-backed: definition picker
    if (this._isRegistryBacked) {
      return this._renderDefinitionPicker();
    }

    // Legacy: column picker or plain add
    const unused = this._unusedColumns;
    if (this._hasColumns) {
      if (this._showColumnPicker) {
        return html`
          <div style="border:1px solid #E7E5E4; border-radius:10px; overflow:hidden; margin-top:4px">
            <div style="padding:8px 10px; font-size:10px; font-weight:700; color:#A8A29E; text-transform:uppercase; letter-spacing:0.04em; background:#FAFAF9; border-bottom:1px solid #E7E5E4; display:flex; align-items:center; justify-content:space-between">
              Select column
              <button class="phz-sc-icon-btn" style="width:20px; height:20px" @click=${() => { this._showColumnPicker = false; }}>${ICONS.remove}</button>
            </div>
            ${unused.length === 0 ? html`
              <div style="padding:12px; font-size:12px; color:#A8A29E; text-align:center">All columns already added</div>
            ` : html`
              <div style="max-height:200px; overflow-y:auto">
                ${unused.map(col => html`
                  <button style="display:flex; align-items:center; gap:8px; width:100%; padding:7px 10px; border:none; background:none; cursor:pointer; font-family:inherit; font-size:12px; color:#44403C; text-align:left; transition:background 0.1s"
                    @mouseover=${(e: Event) => { (e.currentTarget as HTMLElement).style.background = '#F5F5F4'; }}
                    @mouseout=${(e: Event) => { (e.currentTarget as HTMLElement).style.background = ''; }}
                    @click=${() => this._addFieldFromColumn(col)}
                  >
                    <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">${col.header ?? col.field}</span>
                    <span style="font-size:9px; font-family:'SF Mono',ui-monospace,monospace; color:#A8A29E; text-transform:uppercase">${col.type ?? 'string'}</span>
                  </button>
                `)}
              </div>
            `}
          </div>
        `;
      }
      return html`<button class="phz-sc-add-btn" @click=${() => { this._showColumnPicker = true; }}>${ICONS.add} Add Column</button>`;
    }

    return html`<button class="phz-sc-add-btn" @click=${this._addField}>${ICONS.add} Add Field</button>`;
  }

  /** Registry definition picker — lists unbound definitions with "Create New" at the bottom */
  private _renderDefinitionPicker() {
    const unbound = this._unboundDefinitions;

    if (!this._showDefinitionPicker) {
      return html`<button class="phz-sc-add-btn" @click=${() => { this._showDefinitionPicker = true; }}>${ICONS.add} Add Filter</button>`;
    }

    return html`
      <div style="border:1px solid #E7E5E4; border-radius:10px; overflow:hidden; margin-top:4px">
        <div style="padding:8px 10px; font-size:10px; font-weight:700; color:#A8A29E; text-transform:uppercase; letter-spacing:0.04em; background:#FAFAF9; border-bottom:1px solid #E7E5E4; display:flex; align-items:center; justify-content:space-between">
          Select definition
          <button class="phz-sc-icon-btn" style="width:20px; height:20px" @click=${() => { this._showDefinitionPicker = false; }}>${ICONS.remove}</button>
        </div>
        ${unbound.length === 0 ? html`
          <div style="padding:12px; font-size:12px; color:#A8A29E; text-align:center">All definitions already bound</div>
        ` : html`
          <div style="max-height:200px; overflow-y:auto">
            ${unbound.map(def => {
              const typeLabel = FIELD_TYPES.find(t => t.value === def.type)?.label ?? def.type;
              return html`
                <button style="display:flex; align-items:center; gap:8px; width:100%; padding:7px 10px; border:none; background:none; cursor:pointer; font-family:inherit; font-size:12px; color:#44403C; text-align:left; transition:background 0.1s"
                  @mouseover=${(e: Event) => { (e.currentTarget as HTMLElement).style.background = '#F5F5F4'; }}
                  @mouseout=${(e: Event) => { (e.currentTarget as HTMLElement).style.background = ''; }}
                  @click=${() => { this._emitBindingAdd(def.id); this._showDefinitionPicker = false; }}
                >
                  <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">${def.label}</span>
                  <span style="font-size:9px; font-family:'SF Mono',ui-monospace,monospace; color:#A8A29E; text-transform:uppercase">${typeLabel}</span>
                  ${def.dataField ? html`<span style="font-size:9px; color:#D6D3D1; font-family:'SF Mono',ui-monospace,monospace">${def.dataField}</span>` : nothing}
                </button>
              `;
            })}
          </div>
        `}
        <button style="display:flex; align-items:center; gap:6px; width:100%; padding:8px 10px; border:none; border-top:1px solid #E7E5E4; background:#FAFAF9; cursor:pointer; font-family:inherit; font-size:12px; color:#78716C; text-align:left; transition:background 0.1s"
          @mouseover=${(e: Event) => { (e.currentTarget as HTMLElement).style.background = '#F5F5F4'; }}
          @mouseout=${(e: Event) => { (e.currentTarget as HTMLElement).style.background = '#FAFAF9'; }}
          @click=${() => { this._showDefinitionPicker = false; this._editingDef = undefined; this._studioOpen = true; }}
        >
          ${ICONS.add} Create New Definition\u2026
        </button>
      </div>
    `;
  }

  /** Render a field card for a registry-backed (definition+binding) resolved field */
  private _renderBindingFieldCard(resolved: ResolvedField, idx: number) {
    const { field, definition, binding } = resolved;
    const expanded = this._expandedFieldIdx === idx;
    const typeLabel = FIELD_TYPES.find(t => t.value === field.type)?.label ?? field.type;
    const shortType = typeLabel.split(' ').map(w => w[0]).join('');
    const hasOverrides = !!(binding?.labelOverride || binding?.defaultValueOverride !== undefined || binding?.requiredOverride !== undefined);

    return html`
      <div class="phz-sc-field-card ${expanded ? 'phz-sc-field-card--expanded' : ''}">
        <button class="phz-sc-field-card-header" @click=${() => this._toggleFieldExpand(idx)}>
          <span class="phz-sc-field-card-drag" @click=${(e: Event) => e.stopPropagation()}>${ICONS.drag}</span>
          <span class="phz-sc-field-card-name">${field.label}</span>
          <span class="phz-sc-field-card-type" title=${typeLabel}>${shortType}</span>
          ${field.required ? html`<span style="color:#DC2626; font-size:12px; font-weight:700; flex-shrink:0">*</span>` : nothing}
          ${hasOverrides ? html`<span style="font-size:9px; color:#D97706; font-weight:600; flex-shrink:0" title="Has binding overrides">OVR</span>` : nothing}
          <button class="phz-sc-field-card-remove" @click=${(e: Event) => { e.stopPropagation(); if (binding) this._emitBindingRemove(binding.filterDefinitionId); }} title="Unbind filter">${ICONS.remove}</button>
          <span class="phz-sc-field-card-chevron">${expanded ? ICONS.chevronDown : ICONS.chevronRight}</span>
        </button>

        ${expanded && definition && binding ? html`
          <div class="phz-sc-field-card-body">
            <!-- Read-only definition summary -->
            <div style="background:#F5F5F4; border-radius:8px; padding:8px 10px; margin-bottom:4px">
              <div style="font-size:9px; font-weight:700; color:#A8A29E; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:4px">Definition (read-only)</div>
              <div style="font-size:12px; color:#57534E; display:flex; flex-direction:column; gap:2px">
                <div><span style="color:#A8A29E">Type:</span> ${typeLabel}</div>
                ${definition.dataField ? html`<div><span style="color:#A8A29E">Data field:</span> <span style="font-family:'SF Mono',ui-monospace,monospace; font-size:11px">${definition.dataField}</span></div>` : nothing}
                <div><span style="color:#A8A29E">Session:</span> ${definition.sessionBehavior}</div>
                ${definition.required ? html`<div><span style="color:#A8A29E">Required:</span> Yes</div>` : nothing}
              </div>
            </div>

            <!-- Editable binding overrides -->
            <div class="phz-sc-admin-section-label">Binding Overrides</div>

            <div class="phz-sc-field-form-row">
              <label class="phz-sc-field-form-label">Label Override</label>
              <input class="phz-sc-input" placeholder=${definition.label}
                .value=${binding.labelOverride ?? ''}
                @change=${(e: Event) => {
                  const val = (e.target as HTMLInputElement).value;
                  this._emitBindingUpdate(binding.filterDefinitionId, { labelOverride: val || undefined });
                }} />
            </div>

            <div class="phz-sc-field-form-row">
              <label class="phz-sc-field-form-label">Default Value Override</label>
              <input class="phz-sc-input" placeholder="Use definition default"
                .value=${binding.defaultValueOverride ? String(binding.defaultValueOverride) : ''}
                @change=${(e: Event) => {
                  const val = (e.target as HTMLInputElement).value;
                  this._emitBindingUpdate(binding.filterDefinitionId, { defaultValueOverride: val || undefined });
                }} />
            </div>

            <div style="display:flex; gap:16px; align-items:center; padding-top:4px">
              <div class="phz-sc-inline-toggle">
                <label class="phz-sc-toggle-switch">
                  <input type="checkbox" ?checked=${binding.requiredOverride ?? definition.required ?? false}
                    @change=${(e: Event) => {
                      this._emitBindingUpdate(binding.filterDefinitionId, { requiredOverride: (e.target as HTMLInputElement).checked });
                    }} />
                  <span class="phz-sc-toggle-track"></span>
                </label>
                <span class="phz-sc-inline-toggle-label">Required</span>
              </div>
              <div class="phz-sc-inline-toggle">
                <label class="phz-sc-toggle-switch">
                  <input type="checkbox" ?checked=${binding.visible}
                    @change=${(e: Event) => {
                      this._emitBindingUpdate(binding.filterDefinitionId, { visible: (e.target as HTMLInputElement).checked });
                    }} />
                  <span class="phz-sc-toggle-track"></span>
                </label>
                <span class="phz-sc-inline-toggle-label">Visible</span>
              </div>
            </div>

            <div class="phz-sc-field-form-actions">
              <button class="phz-sc-icon-btn" @click=${() => this._moveBindingField(idx, -1)} title="Move up">${ICONS.arrowUp}</button>
              <button class="phz-sc-icon-btn" @click=${() => this._moveBindingField(idx, 1)} title="Move down">${ICONS.arrowDown}</button>
              <div style="flex:1"></div>
              <button class="phz-sc-icon-btn phz-sc-icon-btn--danger" @click=${() => this._emitBindingRemove(binding.filterDefinitionId)} title="Unbind">${ICONS.remove}</button>
            </div>
          </div>
        ` : nothing}
      </div>
    `;
  }

  // ── Render: Rules Tab ──

  private _renderRulesTab() {
    const deps = this.criteriaConfig.dependencies ?? [];
    const resolved = this._resolvedFields;
    const fields = resolved.map(r => r.field);

    return html`
      <div class="phz-sc-admin-section-label">Dependencies</div>
      ${fields.length < 2 ? html`
        <div class="phz-sc-empty">
          <span class="phz-sc-empty-icon">${ICONS.rules}</span>
          Add at least 2 fields to create dependencies
        </div>
      ` : html`
        ${deps.map((dep, idx) => html`
          <div class="phz-sc-dep-card">
            <div class="phz-sc-dep-card-row">
              <span class="phz-sc-dep-card-label">From</span>
              <select class="phz-sc-select" style="flex:1"
                @change=${(e: Event) => this._updateDependency(idx, 'parentFieldId', (e.target as HTMLSelectElement).value)}>
                ${fields.map(f => html`<option value=${f.id} ?selected=${dep.parentFieldId === f.id}>${f.label}</option>`)}
              </select>
            </div>
            <div class="phz-sc-dep-arrow">${ICONS.arrowDownSmall}</div>
            <div class="phz-sc-dep-card-row">
              <span class="phz-sc-dep-card-label">To</span>
              <select class="phz-sc-select" style="flex:1"
                @change=${(e: Event) => this._updateDependency(idx, 'childFieldId', (e.target as HTMLSelectElement).value)}>
                ${fields.map(f => html`<option value=${f.id} ?selected=${dep.childFieldId === f.id}>${f.label}</option>`)}
              </select>
            </div>
            <div style="display:flex; justify-content:flex-end">
              <button class="phz-sc-icon-btn phz-sc-icon-btn--danger" @click=${() => this._removeDependency(idx)} title="Remove">${ICONS.remove}</button>
            </div>
          </div>
        `)}
        <button class="phz-sc-add-btn" @click=${this._addDependency}>${ICONS.add} Add Dependency</button>
      `}

      ${this.filterRules.length > 0 ? html`
        <div class="phz-sc-admin-section-label" style="margin-top:16px">Filter Rules</div>
        <phz-rule-admin
          .rules=${this.filterRules}
          .definitions=${this.filterDefinitions}
        ></phz-rule-admin>
      ` : nothing}
    `;
  }

  // ── Render: Layout Tab ──

  private _renderLayoutTab() {
    const ly = this._layout;
    const topMode: BarMode = ly.barMode ?? 'button';
    const barMode = ly.barDisplayMode ?? 'full';
    const btnContent = ly.buttonContent ?? 'icon-text';
    const btnLabel = ly.buttonLabel ?? 'Filters';
    const btnBg = ly.buttonBgColor ?? '#1C1917';
    const btnText = ly.buttonTextColor ?? '#FFFFFF';
    const containerBg = ly.containerBgColor ?? '#FFFFFF';
    const containerBorder = ly.containerBorderColor ?? '#E7E5E4';
    const containerRadius = ly.containerBorderRadius ?? 10;
    const containerShadow = ly.containerShadow ?? 'none';
    const buttonOnly = ly.buttonOnly ?? false;
    const showSummary = ly.showSummaryStrip ?? true;
    const summaryPlaceholder = ly.summaryPlaceholder ?? 'No filters applied';

    // Preview filter icon
    const previewIcon = html`<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1.75 3h10.5M3.5 7h7M5.25 11h3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;

    return html`
      <!-- Bar Mode -->
      <div class="phz-sc-layout-section">
        <div class="phz-sc-layout-section-title">Bar Mode</div>
        <div class="phz-sc-btn-group">
          <button class="phz-sc-btn-group-item ${topMode === 'button' ? 'phz-sc-btn-group-item--active' : ''}"
            @click=${() => this._updateLayout({ barMode: 'button' })}>Button</button>
          <button class="phz-sc-btn-group-item ${topMode === 'summary' ? 'phz-sc-btn-group-item--active' : ''}"
            @click=${() => this._updateLayout({ barMode: 'summary' })}>Summary Bar</button>
        </div>
        <div style="font-size:10px; color:#A8A29E; margin-top:4px; line-height:1.4">
          ${topMode === 'button' ? 'Shows a Filters button with badge and optional tags' : 'Shows a clickable text summary of active filter values'}
        </div>
      </div>

      ${topMode === 'button' ? html`
        <!-- Display Mode (Button sub-option) -->
        <div class="phz-sc-layout-section">
          <div class="phz-sc-layout-section-title">Display Mode</div>
          <div class="phz-sc-btn-group">
            <button class="phz-sc-btn-group-item ${barMode === 'full' ? 'phz-sc-btn-group-item--active' : ''}"
              @click=${() => this._updateLayout({ barDisplayMode: 'full' })}>Full Bar</button>
            <button class="phz-sc-btn-group-item ${barMode === 'compact' ? 'phz-sc-btn-group-item--active' : ''}"
              @click=${() => this._updateLayout({ barDisplayMode: 'compact' })}>Compact</button>
          </div>
          <div style="font-size:10px; color:#A8A29E; margin-top:4px; line-height:1.4">
            ${barMode === 'full' ? 'Shows filter button, active filter tags, and clear button' : 'Shows only the filter button with count badge'}
          </div>
        </div>

        <!-- Button Content -->
        <div class="phz-sc-layout-section">
          <div class="phz-sc-layout-section-title">Button Content</div>
          <div class="phz-sc-btn-group">
            <button class="phz-sc-btn-group-item ${btnContent === 'icon-text' ? 'phz-sc-btn-group-item--active' : ''}"
              @click=${() => this._updateLayout({ buttonContent: 'icon-text' })}>Icon + Text</button>
            <button class="phz-sc-btn-group-item ${btnContent === 'icon-only' ? 'phz-sc-btn-group-item--active' : ''}"
              @click=${() => this._updateLayout({ buttonContent: 'icon-only' })}>Icon Only</button>
            <button class="phz-sc-btn-group-item ${btnContent === 'text-only' ? 'phz-sc-btn-group-item--active' : ''}"
              @click=${() => this._updateLayout({ buttonContent: 'text-only' })}>Text Only</button>
          </div>
        </div>

        <!-- Button Label -->
        <div class="phz-sc-layout-section">
          <div class="phz-sc-layout-row">
            <label class="phz-sc-layout-row-label">Button Label</label>
            <input class="phz-sc-input" .value=${btnLabel}
              @change=${(e: Event) => this._updateLayout({ buttonLabel: (e.target as HTMLInputElement).value || 'Filters' })} />
          </div>
        </div>

        <!-- Button Colors -->
        <div class="phz-sc-layout-section">
          <div class="phz-sc-layout-section-title">Button Style</div>
          <div class="phz-sc-layout-row">
            <label class="phz-sc-layout-row-label">Background</label>
            <div class="phz-sc-color-row">
              <input type="color" class="phz-sc-color-input" .value=${btnBg}
                @input=${(e: Event) => this._updateLayout({ buttonBgColor: (e.target as HTMLInputElement).value })} />
              <input class="phz-sc-input phz-sc-color-hex" .value=${btnBg}
                @change=${(e: Event) => {
                  const v = (e.target as HTMLInputElement).value;
                  if (/^#[0-9A-Fa-f]{6}$/.test(v)) this._updateLayout({ buttonBgColor: v });
                }} />
            </div>
          </div>
          <div class="phz-sc-layout-row">
            <label class="phz-sc-layout-row-label">Text / Icon</label>
            <div class="phz-sc-color-row">
              <input type="color" class="phz-sc-color-input" .value=${btnText}
                @input=${(e: Event) => this._updateLayout({ buttonTextColor: (e.target as HTMLInputElement).value })} />
              <input class="phz-sc-input phz-sc-color-hex" .value=${btnText}
                @change=${(e: Event) => {
                  const v = (e.target as HTMLInputElement).value;
                  if (/^#[0-9A-Fa-f]{6}$/.test(v)) this._updateLayout({ buttonTextColor: v });
                }} />
            </div>
          </div>
        </div>

        <!-- Container Style -->
        <div class="phz-sc-layout-section">
          <div class="phz-sc-layout-section-title">Container</div>

          <div class="phz-sc-admin-toggle" style="padding-top:0">
            <label class="phz-sc-toggle-switch">
              <input type="checkbox" ?checked=${buttonOnly}
                @change=${(e: Event) => this._updateLayout({ buttonOnly: (e.target as HTMLInputElement).checked })} />
              <span class="phz-sc-toggle-track"></span>
            </label>
            <div class="phz-sc-toggle-text">
              <div class="phz-sc-toggle-label">Button only</div>
              <div class="phz-sc-toggle-desc">Hide the surrounding bar container for inline embedding</div>
            </div>
          </div>

          ${!buttonOnly ? html`
            <div class="phz-sc-layout-row">
              <label class="phz-sc-layout-row-label">Background</label>
              <div class="phz-sc-color-row">
                <input type="color" class="phz-sc-color-input" .value=${containerBg}
                  @input=${(e: Event) => this._updateLayout({ containerBgColor: (e.target as HTMLInputElement).value })} />
                <input class="phz-sc-input phz-sc-color-hex" .value=${containerBg}
                  @change=${(e: Event) => {
                    const v = (e.target as HTMLInputElement).value;
                    if (/^#[0-9A-Fa-f]{6}$/.test(v)) this._updateLayout({ containerBgColor: v });
                  }} />
              </div>
            </div>
            <div class="phz-sc-layout-row">
              <label class="phz-sc-layout-row-label">Border</label>
              <div class="phz-sc-color-row">
                <input type="color" class="phz-sc-color-input" .value=${containerBorder || '#E7E5E4'}
                  @input=${(e: Event) => this._updateLayout({ containerBorderColor: (e.target as HTMLInputElement).value })} />
                <input class="phz-sc-input phz-sc-color-hex" .value=${containerBorder}
                  @change=${(e: Event) => {
                    const v = (e.target as HTMLInputElement).value;
                    if (/^#[0-9A-Fa-f]{6}$/.test(v) || v === '') this._updateLayout({ containerBorderColor: v });
                  }} />
              </div>
            </div>
            <div class="phz-sc-layout-row">
              <label class="phz-sc-layout-row-label">Border Radius</label>
              <div style="display:flex; align-items:center; gap:8px">
                <input type="range" min="0" max="24" step="1" .value=${String(containerRadius)}
                  style="flex:1; accent-color:#1C1917"
                  @input=${(e: Event) => this._updateLayout({ containerBorderRadius: Number((e.target as HTMLInputElement).value) })} />
                <span style="font-size:12px; color:#57534E; font-family:'SF Mono',ui-monospace,monospace; min-width:32px; text-align:right">${containerRadius}px</span>
              </div>
            </div>
            <div class="phz-sc-layout-row">
              <label class="phz-sc-layout-row-label">Shadow</label>
              <div class="phz-sc-btn-group">
                <button class="phz-sc-btn-group-item ${containerShadow === 'none' ? 'phz-sc-btn-group-item--active' : ''}"
                  @click=${() => this._updateLayout({ containerShadow: 'none' })}>None</button>
                <button class="phz-sc-btn-group-item ${containerShadow === 'sm' ? 'phz-sc-btn-group-item--active' : ''}"
                  @click=${() => this._updateLayout({ containerShadow: 'sm' })}>Small</button>
                <button class="phz-sc-btn-group-item ${containerShadow === 'md' ? 'phz-sc-btn-group-item--active' : ''}"
                  @click=${() => this._updateLayout({ containerShadow: 'md' })}>Medium</button>
                <button class="phz-sc-btn-group-item ${containerShadow === 'lg' ? 'phz-sc-btn-group-item--active' : ''}"
                  @click=${() => this._updateLayout({ containerShadow: 'lg' })}>Large</button>
              </div>
            </div>
          ` : nothing}
        </div>

        <!-- Summary Strip -->
        <div class="phz-sc-layout-section">
          <div class="phz-sc-layout-section-title">Summary Strip</div>
          <div class="phz-sc-admin-toggle" style="padding-top:0">
            <label class="phz-sc-toggle-switch">
              <input type="checkbox" ?checked=${showSummary}
                @change=${(e: Event) => {
                  const checked = (e.target as HTMLInputElement).checked;
                  const currentLayout = this._layout;
                  this._updateBehavior({
                    showSummaryStrip: checked,
                    layout: { ...currentLayout, showSummaryStrip: checked },
                  });
                }} />
              <span class="phz-sc-toggle-track"></span>
            </label>
            <div class="phz-sc-toggle-text">
              <div class="phz-sc-toggle-label">Show summary strip</div>
              <div class="phz-sc-toggle-desc">Display a status bar below the criteria bar</div>
            </div>
          </div>

          ${showSummary ? html`
            ${this._renderSummaryStripStyles()}
          ` : nothing}
        </div>

        <!-- Live Preview (Button mode) -->
        <div class="phz-sc-layout-preview">
          <div class="phz-sc-layout-preview-label">Preview</div>
          <div style="
            ${!buttonOnly ? `background:${containerBg}; border:1px solid ${containerBorder || 'transparent'}; border-radius:${containerRadius}px; padding:8px 16px; min-height:42px; box-shadow:${containerShadow === 'sm' ? '0 1px 2px rgba(28,25,23,0.06)' : containerShadow === 'md' ? '0 2px 8px rgba(28,25,23,0.1), 0 1px 3px rgba(28,25,23,0.06)' : containerShadow === 'lg' ? '0 4px 16px rgba(28,25,23,0.12), 0 2px 6px rgba(28,25,23,0.08)' : 'none'};` : ''}
            display:flex; align-items:center; gap:8px; flex-wrap:wrap;
          ">
            <button style="
              display:inline-flex; align-items:center; gap:6px;
              padding:5px 12px; border-radius:8px; font-size:12px; font-weight:600;
              cursor:default; border:1px solid ${btnBg};
              background:${btnBg}; color:${btnText};
              font-family:inherit; white-space:nowrap;
            ">
              ${btnContent !== 'text-only' ? previewIcon : nothing}
              ${btnContent !== 'icon-only' ? btnLabel : nothing}
              <span style="display:inline-flex; align-items:center; justify-content:center; min-width:18px; height:18px; padding:0 5px; border-radius:9px; font-size:10px; font-weight:700; background:#EF4444; color:#FFFFFF; line-height:1">3</span>
            </button>
            ${barMode === 'full' && !buttonOnly ? html`
              <span style="width:1px; height:20px; background:${containerBorder || '#E7E5E4'}; flex-shrink:0"></span>
              <span style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px 3px 10px; border-radius:6px; font-size:12px; background:#F5F5F4; color:#44403C; border:1px solid #E7E5E4; white-space:nowrap">
                <span style="font-weight:600; color:#78716C; margin-right:2px">Region:</span>North
              </span>
              <span style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px 3px 10px; border-radius:6px; font-size:12px; background:#F5F5F4; color:#44403C; border:1px solid #E7E5E4; white-space:nowrap">
                <span style="font-weight:600; color:#78716C; margin-right:2px">Status:</span>Active
              </span>
              <span style="font-size:11px; color:#DC2626; margin-left:auto; white-space:nowrap">Clear all</span>
            ` : nothing}
          </div>
        </div>
      ` : html`
        <!-- Summary Bar Config -->

        <!-- Summary Fields -->
        <div class="phz-sc-layout-section">
          <div class="phz-sc-layout-section-title">Summary Fields</div>
          <div style="font-size:10px; color:#A8A29E; margin-bottom:8px; line-height:1.4">
            Choose which fields display their values on the summary bar
          </div>
          ${this.criteriaConfig.fields.map((field, idx) => html`
            <div class="phz-sc-admin-toggle" style="padding:4px 0">
              <label class="phz-sc-toggle-switch">
                <input type="checkbox" ?checked=${field.barConfig?.showOnSummary ?? false}
                  @change=${(e: Event) => {
                    const checked = (e.target as HTMLInputElement).checked;
                    this._updateField(idx, {
                      barConfig: { ...field.barConfig, showOnSummary: checked },
                    });
                  }} />
                <span class="phz-sc-toggle-track"></span>
              </label>
              <div class="phz-sc-toggle-text">
                <div class="phz-sc-toggle-label">${field.label}</div>
                <div class="phz-sc-toggle-desc">${field.type}</div>
              </div>
            </div>
          `)}
        </div>

        <!-- Placeholder Text -->
        <div class="phz-sc-layout-section">
          <div class="phz-sc-layout-row">
            <label class="phz-sc-layout-row-label">Placeholder Text</label>
            <input class="phz-sc-input" .value=${summaryPlaceholder}
              @change=${(e: Event) => this._updateLayout({ summaryPlaceholder: (e.target as HTMLInputElement).value || 'No filters applied' })} />
          </div>
          <div style="font-size:10px; color:#A8A29E; margin-top:4px; line-height:1.4">
            Shown when no filters are active
          </div>
        </div>

        <!-- Summary Colors -->
        <div class="phz-sc-layout-section">
          <div class="phz-sc-layout-section-title">Summary Colors</div>
          ${this._renderSummaryStripStyles()}
        </div>

        <!-- Live Preview (Summary mode) -->
        ${this._renderSummaryBarPreview()}
      `}
    `;
  }

  private _renderSummaryBarPreview() {
    const sl = this._summaryLayout;
    const defBg = sl.bgColor ?? '#FAFAF9';
    const defText = sl.textColor ?? '#78716C';
    const defBorder = sl.borderColor ?? '#E7E5E4';
    const actBg = sl.activeBgColor ?? '#EFF6FF';
    const actText = sl.activeTextColor ?? '#1D4ED8';
    const actBorder = sl.activeBorderColor ?? '#2563EB';
    const radius = sl.borderRadius ?? 8;
    const placeholder = this._layout.summaryPlaceholder ?? 'No filters applied';

    const summaryFields = this.criteriaConfig.fields.filter(f => f.barConfig?.showOnSummary);
    const previewText = summaryFields.length > 0
      ? summaryFields.slice(0, 3).map(f => `${f.label}: Sample`).join(' \u2022 ')
      : 'Region: North \u2022 Status: Active';

    const filterIcon = html`<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1.75 3h10.5M3.5 7h7M5.25 11h3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;

    return html`
      <div class="phz-sc-layout-preview">
        <div class="phz-sc-layout-preview-label">Preview</div>
        <div style="display:flex; flex-direction:column; gap:6px">
          <div style="padding:8px 12px; font-size:12px; border-radius:${radius}px; background:${defBg}; color:${defText}; border:1px solid ${defBorder}; display:flex; align-items:center; gap:8px; cursor:pointer">
            <span style="flex-shrink:0; display:flex; align-items:center; opacity:0.7">${filterIcon}</span>
            ${placeholder}
          </div>
          <div style="padding:8px 12px; font-size:12px; border-radius:${radius}px; background:${actBg}; color:${actText}; border:1px solid ${actBorder}; display:flex; align-items:center; gap:8px; cursor:pointer">
            <span style="flex-shrink:0; display:flex; align-items:center; opacity:0.7">${filterIcon}</span>
            <span style="flex:1">${previewText}</span>
            <span style="font-size:11px; opacity:0.8">Clear all</span>
          </div>
        </div>
      </div>
    `;
  }

  // ── Render: Summary Strip Styles ──

  private _renderSummaryStripStyles() {
    const sl = this._summaryLayout;
    const defBg = sl.bgColor ?? '#FAFAF9';
    const defText = sl.textColor ?? '#78716C';
    const defBorder = sl.borderColor ?? '#E7E5E4';
    const actBg = sl.activeBgColor ?? '#EFF6FF';
    const actText = sl.activeTextColor ?? '#1D4ED8';
    const actBorder = sl.activeBorderColor ?? '#2563EB';
    const radius = sl.borderRadius ?? 8;

    return html`
      <div style="margin-top:8px">
        <div class="phz-sc-layout-row-label" style="margin-bottom:6px">Default State</div>
        <div class="phz-sc-layout-row">
          <label class="phz-sc-layout-row-label">Background</label>
          <div class="phz-sc-color-row">
            <input type="color" class="phz-sc-color-input" .value=${defBg}
              @input=${(e: Event) => this._updateSummaryLayout({ bgColor: (e.target as HTMLInputElement).value })} />
            <input class="phz-sc-input phz-sc-color-hex" .value=${defBg}
              @change=${(e: Event) => {
                const v = (e.target as HTMLInputElement).value;
                if (/^#[0-9A-Fa-f]{6}$/.test(v)) this._updateSummaryLayout({ bgColor: v });
              }} />
          </div>
        </div>
        <div class="phz-sc-layout-row">
          <label class="phz-sc-layout-row-label">Text</label>
          <div class="phz-sc-color-row">
            <input type="color" class="phz-sc-color-input" .value=${defText}
              @input=${(e: Event) => this._updateSummaryLayout({ textColor: (e.target as HTMLInputElement).value })} />
            <input class="phz-sc-input phz-sc-color-hex" .value=${defText}
              @change=${(e: Event) => {
                const v = (e.target as HTMLInputElement).value;
                if (/^#[0-9A-Fa-f]{6}$/.test(v)) this._updateSummaryLayout({ textColor: v });
              }} />
          </div>
        </div>
        <div class="phz-sc-layout-row">
          <label class="phz-sc-layout-row-label">Border</label>
          <div class="phz-sc-color-row">
            <input type="color" class="phz-sc-color-input" .value=${defBorder}
              @input=${(e: Event) => this._updateSummaryLayout({ borderColor: (e.target as HTMLInputElement).value })} />
            <input class="phz-sc-input phz-sc-color-hex" .value=${defBorder}
              @change=${(e: Event) => {
                const v = (e.target as HTMLInputElement).value;
                if (/^#[0-9A-Fa-f]{6}$/.test(v)) this._updateSummaryLayout({ borderColor: v });
              }} />
          </div>
        </div>

        <div class="phz-sc-layout-row-label" style="margin-top:10px; margin-bottom:6px">Active State (filters applied)</div>
        <div class="phz-sc-layout-row">
          <label class="phz-sc-layout-row-label">Background</label>
          <div class="phz-sc-color-row">
            <input type="color" class="phz-sc-color-input" .value=${actBg}
              @input=${(e: Event) => this._updateSummaryLayout({ activeBgColor: (e.target as HTMLInputElement).value })} />
            <input class="phz-sc-input phz-sc-color-hex" .value=${actBg}
              @change=${(e: Event) => {
                const v = (e.target as HTMLInputElement).value;
                if (/^#[0-9A-Fa-f]{6}$/.test(v)) this._updateSummaryLayout({ activeBgColor: v });
              }} />
          </div>
        </div>
        <div class="phz-sc-layout-row">
          <label class="phz-sc-layout-row-label">Text</label>
          <div class="phz-sc-color-row">
            <input type="color" class="phz-sc-color-input" .value=${actText}
              @input=${(e: Event) => this._updateSummaryLayout({ activeTextColor: (e.target as HTMLInputElement).value })} />
            <input class="phz-sc-input phz-sc-color-hex" .value=${actText}
              @change=${(e: Event) => {
                const v = (e.target as HTMLInputElement).value;
                if (/^#[0-9A-Fa-f]{6}$/.test(v)) this._updateSummaryLayout({ activeTextColor: v });
              }} />
          </div>
        </div>
        <div class="phz-sc-layout-row">
          <label class="phz-sc-layout-row-label">Border</label>
          <div class="phz-sc-color-row">
            <input type="color" class="phz-sc-color-input" .value=${actBorder}
              @input=${(e: Event) => this._updateSummaryLayout({ activeBorderColor: (e.target as HTMLInputElement).value })} />
            <input class="phz-sc-input phz-sc-color-hex" .value=${actBorder}
              @change=${(e: Event) => {
                const v = (e.target as HTMLInputElement).value;
                if (/^#[0-9A-Fa-f]{6}$/.test(v)) this._updateSummaryLayout({ activeBorderColor: v });
              }} />
          </div>
        </div>

        <div class="phz-sc-layout-row" style="margin-top:4px">
          <label class="phz-sc-layout-row-label">Border Radius</label>
          <div style="display:flex; align-items:center; gap:8px">
            <input type="range" min="0" max="24" step="1" .value=${String(radius)}
              style="flex:1; accent-color:#1C1917"
              @input=${(e: Event) => this._updateSummaryLayout({ borderRadius: Number((e.target as HTMLInputElement).value) })} />
            <span style="font-size:12px; color:#57534E; font-family:'SF Mono',ui-monospace,monospace; min-width:32px; text-align:right">${radius}px</span>
          </div>
        </div>

        <!-- Mini preview -->
        <div class="phz-sc-layout-preview" style="margin-top:10px">
          <div class="phz-sc-layout-preview-label">Summary Preview</div>
          <div style="display:flex; flex-direction:column; gap:6px">
            <div style="padding:8px 12px; font-size:12px; border-radius:${radius}px; background:${defBg}; color:${defText}; border:1px solid ${defBorder}">
              Showing all 20 rows
            </div>
            <div style="padding:8px 12px; font-size:12px; border-radius:${radius}px; background:${actBg}; color:${actText}; border:1px solid ${actBorder}">
              Showing 8 of 20 rows &bull; Region: North
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ── Render: Settings Tab ──

  private _renderSettingsTab() {
    const b = this.criteriaConfig.behavior ?? {};
    const hasPresets = (this.sharedPresets?.length ?? 0) + (this.userPresets?.length ?? 0) > 0;

    return html`
      <div class="phz-sc-admin-toggle">
        <label class="phz-sc-toggle-switch">
          <input type="checkbox" ?checked=${b.autoApply}
            @change=${(e: Event) => this._updateBehavior({ autoApply: (e.target as HTMLInputElement).checked })} />
          <span class="phz-sc-toggle-track"></span>
        </label>
        <div class="phz-sc-toggle-text">
          <div class="phz-sc-toggle-label">Auto-apply</div>
          <div class="phz-sc-toggle-desc">Filter immediately on change</div>
        </div>
      </div>

      <div class="phz-sc-admin-toggle">
        <label class="phz-sc-toggle-switch">
          <input type="checkbox" ?checked=${b.showPresetManager !== false}
            @change=${(e: Event) => this._updateBehavior({ showPresetManager: (e.target as HTMLInputElement).checked })} />
          <span class="phz-sc-toggle-track"></span>
        </label>
        <div class="phz-sc-toggle-text">
          <div class="phz-sc-toggle-label">Preset manager</div>
          <div class="phz-sc-toggle-desc">Save and load filter presets</div>
        </div>
      </div>

      <div class="phz-sc-admin-toggle">
        <label class="phz-sc-toggle-switch">
          <input type="checkbox" ?checked=${b.showResetButton !== false}
            @change=${(e: Event) => this._updateBehavior({ showResetButton: (e.target as HTMLInputElement).checked })} />
          <span class="phz-sc-toggle-track"></span>
        </label>
        <div class="phz-sc-toggle-text">
          <div class="phz-sc-toggle-label">Reset button</div>
          <div class="phz-sc-toggle-desc">Clear all criteria at once</div>
        </div>
      </div>

      <div class="phz-sc-style-group">
        <div class="phz-sc-admin-section-label">Panel style</div>
        <select class="phz-sc-select" style="width:100%"
          @change=${(e: Event) => this._updateBehavior({ panelStyle: (e.target as HTMLSelectElement).value as CriteriaBehavior['panelStyle'] })}>
          <option value="expanded" ?selected=${b.panelStyle === 'expanded'}>Expanded</option>
          <option value="collapsed" ?selected=${b.panelStyle === 'collapsed'}>Collapsed</option>
          <option value="floating" ?selected=${b.panelStyle === 'floating'}>Floating</option>
        </select>
      </div>

      ${hasPresets ? html`
        <div class="phz-sc-admin-section-label" style="margin-top:16px">Presets</div>
        <phz-preset-admin
          .sharedPresets=${this.sharedPresets}
          .userPresets=${this.userPresets}
        ></phz-preset-admin>
      ` : nothing}
    `;
  }

  // ── Main Render (Unified) ──

  render() {
    const resolved = this._resolvedFields;
    const fieldCount = resolved.length;
    const deps = this.criteriaConfig.dependencies ?? [];
    const presets = this.criteriaConfig.presets ?? [];
    const rulesCount = deps.length + presets.length + this.filterRules.length;

    const tabs: { id: AdminTab; label: string; icon: unknown; count: number | null }[] = [
      { id: 'fields', label: 'Fields', icon: ICONS.fields, count: fieldCount },
      { id: 'layout', label: 'Layout', icon: ICONS.layout, count: null },
      { id: 'rules', label: 'Rules', icon: ICONS.rules, count: rulesCount },
      { id: 'settings', label: 'Settings', icon: ICONS.settings, count: null },
    ];

    return html`
      ${this.resizable ? html`
        <div
          class="phz-sc-admin-resize${this._resizing ? ' phz-sc-admin-resize--active' : ''}"
          @pointerdown=${this._onResizeStart}
          aria-hidden="true"
        ></div>
      ` : nothing}
      <div class="phz-sc-admin">
        <div class="phz-sc-admin-header">
          <span class="phz-sc-admin-header-icon">${ICONS.settings}</span>
          <div>
            <h2 class="phz-sc-admin-title">Criteria</h2>
            <p class="phz-sc-admin-subtitle">${fieldCount} field${fieldCount !== 1 ? 's' : ''}${this._isRegistryBacked ? ' · registry' : ''}</p>
          </div>
        </div>

        <div class="phz-sc-admin-tabs">
          ${tabs.map(t => html`
            <button
              class="phz-sc-admin-tab ${this._activeTab === t.id ? 'phz-sc-admin-tab--active' : ''}"
              @click=${() => { this._activeTab = t.id; }}
            >
              <span class="phz-sc-admin-tab-icon">${t.icon}</span>
              ${t.label}
              ${t.count !== null ? html`<span style="font-size:10px; color:#A8A29E; font-family:'SF Mono',ui-monospace,monospace">${t.count}</span>` : nothing}
            </button>
          `)}
        </div>

        <div class="phz-sc-admin-body">
          ${this._activeTab === 'fields' ? this._renderFieldsTab() : nothing}
          ${this._activeTab === 'layout' ? this._renderLayoutTab() : nothing}
          ${this._activeTab === 'rules' ? this._renderRulesTab() : nothing}
          ${this._activeTab === 'settings' ? this._renderSettingsTab() : nothing}
        </div>
      </div>

      ${this._studioOpen ? html`
        <phz-slide-over
          .open=${this._studioOpen}
          heading=${this._editingDef ? 'Edit Filter Definition' : 'New Filter Definition'}
          @slide-close=${() => { this._studioOpen = false; this._editingDef = undefined; }}
        >
          <phz-filter-studio
            .definition=${this._editingDef}
            .availableColumns=${this.availableFields}
            .data=${this.data}
            .dataSources=${this._toFilterDataSources()}
            @filter-studio-save=${(e: CustomEvent) => {
              this._studioOpen = false;
              const def = e.detail?.definition;
              if (def) this._emitDefinitionCreate(def);
              this._editingDef = undefined;
            }}
            @filter-studio-cancel=${() => { this._studioOpen = false; this._editingDef = undefined; }}
          ></phz-filter-studio>
        </phz-slide-over>
      ` : nothing}
    `;
  }
}
