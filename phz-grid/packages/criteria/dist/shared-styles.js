/**
 * @phozart/criteria — Shared Styles
 *
 * Common CSS for selection criteria components. Uses phz-sc- prefix.
 * Console-mode Phz UI: warm neutrals, multi-layer shadows, 12-16px radii.
 */
import { css } from 'lit';
export const criteriaStyles = css `
  :host {
    display: block;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    color: var(--phz-color-text, #1C1917);
    box-sizing: border-box;
  }

  *, *::before, *::after { box-sizing: inherit; }

  /* ── Focus-Visible Ring (Accessibility) ── */
  :focus-visible {
    outline: 2px solid var(--phz-color-primary, #3B82F6);
    outline-offset: 2px;
  }

  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible {
    outline: none;
    border-color: var(--phz-color-primary, #3B82F6);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }

  /* ── SVG icon sizing ── */
  .phz-sc-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .phz-sc-icon svg {
    width: 100%;
    height: 100%;
  }

  .phz-sc-icon--20 { width: 20px; height: 20px; }

  /* Panel layout */
  .phz-sc-panel {
    background: var(--phz-color-surface-alt, #FAFAF9);
    border: 1px solid var(--phz-color-border-light, #E7E5E4);
    border-radius: 12px;
    position: relative;
  }

  .phz-sc-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--phz-color-surface, #FFFFFF);
    border-bottom: 1px solid var(--phz-color-border-light, #E7E5E4);
    border-radius: 12px 12px 0 0;
    cursor: pointer;
    user-select: none;
  }

  .phz-sc-panel-header:hover {
    background: #F5F5F4;
  }

  .phz-sc-panel-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--phz-color-text-secondary, #44403C);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .phz-sc-panel-toggle {
    font-size: 11px;
    color: var(--phz-color-text-muted, #78716C);
    transition: transform 0.2s;
  }

  .phz-sc-panel-toggle--expanded {
    transform: rotate(180deg);
  }

  /* Fields grid */
  .phz-sc-fields {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
    padding: 16px;
  }

  /* Action bar */
  .phz-sc-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border-top: 1px solid var(--phz-color-border-light, #E7E5E4);
    background: var(--phz-color-surface, #FFFFFF);
  }

  /* Buttons */
  .phz-sc-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid var(--phz-color-border, #D6D3D1);
    background: var(--phz-color-surface, #FFFFFF);
    color: var(--phz-color-text-secondary, #44403C);
    transition: all 0.15s;
  }

  .phz-sc-btn:hover {
    background: var(--phz-color-surface-hover, #F5F5F4);
    border-color: var(--phz-color-border-dark, #A8A29E);
  }

  .phz-sc-btn:focus-visible {
    outline: 2px solid #EF4444;
    outline-offset: 2px;
  }

  .phz-sc-btn--primary {
    background: var(--phz-color-text, #1C1917);
    color: var(--phz-color-surface, #FFFFFF);
    border-color: var(--phz-color-text, #1C1917);
  }

  .phz-sc-btn--primary:hover {
    background: var(--phz-color-text-secondary, #292524);
    border-color: var(--phz-color-text-secondary, #292524);
  }

  .phz-sc-btn--ghost {
    border-color: transparent;
    background: transparent;
  }

  .phz-sc-btn--ghost:hover {
    background: #F5F5F4;
  }

  /* Field wrapper */
  .phz-sc-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .phz-sc-field-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--phz-color-text-muted, #78716C);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .phz-sc-field-label--required::after {
    content: ' *';
    color: var(--phz-color-danger, #DC2626);
  }

  /* Inputs */
  .phz-sc-input {
    padding: 6px 10px;
    border: 1px solid var(--phz-color-border, #D6D3D1);
    border-radius: 8px;
    font-size: 13px;
    color: var(--phz-color-text, #1C1917);
    background: var(--phz-color-surface, #FFFFFF);
    outline: none;
    transition: border-color 0.15s;
    font-family: inherit;
  }

  .phz-sc-input:focus {
    border-color: #2563EB;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .phz-sc-input:disabled {
    background: #F5F5F4;
    color: #A8A29E;
    cursor: not-allowed;
  }

  .phz-sc-input::placeholder {
    color: #A8A29E;
  }

  /* Select */
  .phz-sc-select {
    padding: 6px 28px 6px 10px;
    border: 1px solid var(--phz-color-border, #D6D3D1);
    border-radius: 8px;
    font-size: 13px;
    color: var(--phz-color-text, #1C1917);
    background: var(--phz-color-surface, #FFFFFF) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2378716C'%3E%3Cpath d='M2 4l4 4 4-4'/%3E%3C/svg%3E") no-repeat right 8px center;
    appearance: none;
    cursor: pointer;
    outline: none;
    font-family: inherit;
  }

  .phz-sc-select:focus {
    border-color: #2563EB;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  /* Chips */
  .phz-sc-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .phz-sc-chip {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid var(--phz-color-border, #D6D3D1);
    background: var(--phz-color-surface, #FFFFFF);
    color: var(--phz-color-text-secondary, #44403C);
    transition: all 0.15s;
    font-family: inherit;
  }

  .phz-sc-chip:hover {
    background: var(--phz-color-surface-hover, #F5F5F4);
  }

  .phz-sc-chip--selected {
    background: #1C1917;
    color: #FFFFFF;
    border-color: #1C1917;
  }

  .phz-sc-chip--selected:hover {
    background: #292524;
  }

  /* Locked badge */
  .phz-sc-locked-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 500;
    background: #FEF3C7;
    color: #92400E;
  }

  /* Dropdown */
  .phz-sc-dropdown {
    position: absolute;
    z-index: 100;
    background: var(--phz-color-surface, #FFFFFF);
    border: 1px solid var(--phz-color-border-light, #E7E5E4);
    border-radius: 12px;
    box-shadow: 0 4px 8px rgba(28,25,23,0.08), 0 2px 4px rgba(28,25,23,0.04);
    max-height: 280px;
    overflow-y: auto;
    min-width: 200px;
  }

  .phz-sc-dropdown-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    font-size: 13px;
    cursor: pointer;
    color: var(--phz-color-text, #1C1917);
  }

  .phz-sc-dropdown-item:hover {
    background: var(--phz-color-surface-hover, #F5F5F4);
  }

  .phz-sc-dropdown-item--selected {
    background: #EFF6FF;
    color: #1D4ED8;
  }

  /* Preset badges */
  .phz-sc-preset-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 6px;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .phz-sc-preset-badge--personal {
    background: #DCFCE7;
    color: #166534;
  }

  .phz-sc-preset-badge--shared {
    background: #DBEAFE;
    color: #1E40AF;
  }

  /* Range slider */
  .phz-sc-range-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .phz-sc-range-input {
    width: 80px;
    padding: 4px 8px;
    border: 1px solid #D6D3D1;
    border-radius: 8px;
    font-size: 12px;
    text-align: center;
    font-family: inherit;
  }

  .phz-sc-range-input:focus {
    border-color: #2563EB;
    outline: none;
  }

  .phz-sc-range-sep {
    color: #A8A29E;
    font-size: 12px;
  }

  .phz-sc-range-unit {
    color: #78716C;
    font-size: 11px;
  }

  /* Slider track */
  .phz-sc-slider {
    width: 100%;
    margin: 4px 0;
    accent-color: #1C1917;
  }

  /* Tree view */
  .phz-sc-tree {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .phz-sc-tree-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    font-size: 13px;
    cursor: pointer;
    border-radius: 6px;
  }

  .phz-sc-tree-item:hover {
    background: #F5F5F4;
  }

  .phz-sc-tree-children {
    padding-left: 20px;
    list-style: none;
    margin: 0;
  }

  .phz-sc-tree-toggle {
    display: inline-flex;
    width: 16px;
    height: 16px;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: #78716C;
    cursor: pointer;
    flex-shrink: 0;
  }

  .phz-sc-tree-checkbox {
    accent-color: #1C1917;
  }

  /* Calendar */
  .phz-sc-calendar {
    padding: 8px;
  }

  .phz-sc-calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .phz-sc-calendar-title {
    font-size: 13px;
    font-weight: 600;
    color: #1C1917;
  }

  .phz-sc-calendar-nav {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    color: #78716C;
    border-radius: 6px;
    font-family: inherit;
  }

  .phz-sc-calendar-nav:hover {
    background: #F5F5F4;
  }

  .phz-sc-calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
  }

  .phz-sc-calendar-day-header {
    text-align: center;
    font-size: 10px;
    font-weight: 600;
    color: #A8A29E;
    padding: 4px;
  }

  .phz-sc-calendar-day {
    text-align: center;
    padding: 6px;
    font-size: 12px;
    border-radius: 6px;
    cursor: pointer;
    color: #1C1917;
  }

  .phz-sc-calendar-day:hover {
    background: #F5F5F4;
  }

  .phz-sc-calendar-day--today {
    font-weight: 700;
  }

  .phz-sc-calendar-day--selected {
    background: #1C1917;
    color: #FFFFFF;
  }

  .phz-sc-calendar-day--selected:hover {
    background: #292524;
    color: #FFFFFF;
  }

  .phz-sc-calendar-day--in-range {
    background: #F5F5F4;
  }

  .phz-sc-calendar-day--disabled {
    color: #D6D3D1;
    cursor: default;
  }

  .phz-sc-calendar-day--other-month {
    color: #D6D3D1;
  }

  /* ── Date Picker Two-Zone Layout ── */
  .phz-sc-dp-panel {
    position: fixed;
    z-index: 1010;
    background: #FFFFFF;
    border: 1px solid #E7E5E4;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(28,25,23,0.12), 0 2px 8px rgba(28,25,23,0.06);
    display: flex;
    min-width: 540px;
    max-width: calc(100vw - 32px);
    overflow: hidden;
  }

  .phz-sc-dp-zone1 {
    width: 200px;
    border-right: 1px solid #E7E5E4;
    padding: 8px 0;
    overflow-y: auto;
    max-height: 380px;
    flex-shrink: 0;
  }

  .phz-sc-dp-zone2 {
    flex: 1;
    padding: 12px;
    min-width: 320px;
  }

  .phz-sc-dp-group-label {
    font-size: 10px;
    font-weight: 700;
    color: #A8A29E;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 8px 12px 4px;
    margin-top: 4px;
  }

  .phz-sc-dp-group-label:first-child {
    margin-top: 0;
  }

  .phz-sc-dp-preset-btn {
    display: block;
    width: 100%;
    text-align: left;
    padding: 6px 12px;
    font-size: 13px;
    color: #44403C;
    background: none;
    border: none;
    cursor: pointer;
    transition: all 0.1s;
    font-family: inherit;
  }

  .phz-sc-dp-preset-btn:hover {
    background: #F5F5F4;
    color: #1C1917;
  }

  .phz-sc-dp-preset-btn--active {
    background: #1C1917;
    color: #FFFFFF;
  }

  .phz-sc-dp-preset-btn--active:hover {
    background: #292524;
    color: #FFFFFF;
  }

  /* Granularity tabs */
  .phz-sc-dp-gran-tabs {
    display: flex;
    gap: 0;
    margin-bottom: 12px;
    border: 1px solid #E7E5E4;
    border-radius: 8px;
    overflow: hidden;
  }

  .phz-sc-dp-gran-tab {
    flex: 1;
    padding: 6px 4px;
    font-size: 11px;
    font-weight: 600;
    text-align: center;
    cursor: pointer;
    border: none;
    background: #FAFAF9;
    color: #78716C;
    transition: all 0.15s;
    font-family: inherit;
    border-right: 1px solid #E7E5E4;
  }

  .phz-sc-dp-gran-tab:last-child {
    border-right: none;
  }

  .phz-sc-dp-gran-tab:hover {
    background: #F5F5F4;
    color: #44403C;
  }

  .phz-sc-dp-gran-tab--active {
    background: #1C1917;
    color: #FFFFFF;
  }

  .phz-sc-dp-gran-tab--active:hover {
    background: #292524;
  }

  /* Month/Quarter/Year grid selector */
  .phz-sc-dp-period-grid {
    display: grid;
    gap: 4px;
  }

  .phz-sc-dp-period-grid--months {
    grid-template-columns: repeat(4, 1fr);
  }

  .phz-sc-dp-period-grid--quarters {
    grid-template-columns: repeat(2, 1fr);
  }

  .phz-sc-dp-period-grid--years {
    grid-template-columns: repeat(4, 1fr);
  }

  .phz-sc-dp-period-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px 6px;
    font-size: 12px;
    font-weight: 500;
    border-radius: 8px;
    cursor: pointer;
    color: #44403C;
    border: 1px solid transparent;
    transition: all 0.1s;
    background: none;
    font-family: inherit;
  }

  .phz-sc-dp-period-cell:hover {
    background: #F5F5F4;
    border-color: #D6D3D1;
  }

  .phz-sc-dp-period-cell--selected {
    background: #1C1917;
    color: #FFFFFF;
    border-color: #1C1917;
  }

  .phz-sc-dp-period-cell--selected:hover {
    background: #292524;
    color: #FFFFFF;
  }

  .phz-sc-dp-period-cell--in-range {
    background: #F5F5F4;
    border-color: #E7E5E4;
  }

  .phz-sc-dp-period-cell--disabled {
    color: #D6D3D1;
    cursor: default;
  }

  /* Week number margin */
  .phz-sc-calendar-week-num {
    font-size: 10px;
    color: #A8A29E;
    text-align: right;
    padding: 6px 4px 6px 0;
    font-family: 'SF Mono', ui-monospace, monospace;
  }

  .phz-sc-calendar-grid--weeks {
    grid-template-columns: 28px repeat(7, 1fr);
  }

  .phz-sc-calendar-week-row {
    display: contents;
    cursor: pointer;
  }

  .phz-sc-calendar-week-row:hover .phz-sc-calendar-day {
    background: #F5F5F4;
  }

  .phz-sc-calendar-week-row--selected .phz-sc-calendar-day {
    background: #1C1917;
    color: #FFFFFF;
  }

  /* Comparison section */
  .phz-sc-dp-comparison {
    border-top: 1px solid #E7E5E4;
    padding-top: 10px;
    margin-top: 10px;
  }

  .phz-sc-dp-comp-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .phz-sc-dp-comp-label {
    font-size: 11px;
    font-weight: 600;
    color: #78716C;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .phz-sc-dp-comp-buttons {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  /* Timezone / info label */

  /* Admin tabs (vertical) */
  .phz-sc-tabs {
    display: flex;
    border-bottom: 1px solid #E7E5E4;
    gap: 0;
    background: #FFFFFF;
  }

  .phz-sc-tab {
    padding: 10px 16px;
    font-size: 12px;
    font-weight: 500;
    color: #78716C;
    cursor: pointer;
    border: none;
    background: none;
    border-bottom: 2px solid transparent;
    transition: all 0.15s;
    font-family: inherit;
  }

  .phz-sc-tab:hover {
    color: #44403C;
    background: #FAFAF9;
  }

  .phz-sc-tab--active {
    color: #1C1917;
    border-bottom-color: #1C1917;
  }

  /* Error message */
  .phz-sc-error {
    font-size: 11px;
    color: var(--phz-color-danger, #DC2626);
    margin-top: 2px;
  }

  /* ══════════════════════════════════════════════════
     Criteria Bar
     ══════════════════════════════════════════════════ */

  .phz-sc-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: var(--phz-color-surface, #FFFFFF);
    border: 1px solid var(--phz-color-border-light, #E7E5E4);
    border-radius: 10px;
    min-height: 42px;
    flex-wrap: wrap;
  }

  .phz-sc-bar-filters-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid #1C1917;
    background: #1C1917;
    color: #FFFFFF;
    transition: background 0.15s;
    font-family: inherit;
    white-space: nowrap;
  }

  .phz-sc-bar-filters-btn:hover { background: #292524; }

  .phz-sc-bar-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 9px;
    font-size: 10px;
    font-weight: 700;
    background: #EF4444;
    color: #FFFFFF;
    line-height: 1;
  }

  .phz-sc-bar-sep {
    width: 1px;
    height: 20px;
    background: #E7E5E4;
    flex-shrink: 0;
  }

  .phz-sc-bar-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px 3px 10px;
    border-radius: 6px;
    font-size: 12px;
    background: #F5F5F4;
    color: #44403C;
    border: 1px solid #E7E5E4;
    white-space: nowrap;
    max-width: 200px;
  }

  .phz-sc-bar-tag-label {
    font-weight: 600;
    color: #78716C;
    margin-right: 2px;
  }

  .phz-sc-bar-tag-value {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .phz-sc-bar-tag-remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 4px;
    border: none;
    background: none;
    cursor: pointer;
    color: #A8A29E;
    padding: 0;
    flex-shrink: 0;
    font-family: inherit;
  }

  .phz-sc-bar-tag-remove:hover { background: #E7E5E4; color: #44403C; }

  .phz-sc-bar-clear {
    font-size: 11px;
    font-weight: 500;
    color: var(--phz-color-danger, #DC2626);
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    font-family: inherit;
    white-space: nowrap;
    margin-left: auto;
  }

  .phz-sc-bar-clear:hover { background: #FEF2F2; }

  /* ══════════════════════════════════════════════════
     Filter Drawer
     ══════════════════════════════════════════════════ */

  .phz-sc-drawer-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(28, 25, 23, 0.4);
    z-index: 900;
    opacity: 0;
    transition: opacity 0.25s ease;
  }

  .phz-sc-drawer-backdrop--visible { opacity: 1; }

  .phz-sc-drawer-panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 901;
    background: var(--phz-color-surface-alt, #FAFAF9);
    border-left: 1px solid var(--phz-color-border-light, #E7E5E4);
    box-shadow: -8px 0 24px rgba(28, 25, 23, 0.08);
    display: flex;
    flex-direction: column;
    transform: translateX(100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .phz-sc-drawer-panel--open { transform: translateX(0); }
  .phz-sc-drawer-panel--no-transform { transform: none; }

  .phz-sc-drawer-resize {
    position: absolute;
    top: 0;
    left: -4px;
    bottom: 0;
    width: 8px;
    cursor: col-resize;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .phz-sc-drawer-resize::after {
    content: '';
    width: 3px;
    height: 32px;
    border-radius: 2px;
    background: transparent;
    transition: background 0.15s ease;
  }

  .phz-sc-drawer-resize:hover::after,
  .phz-sc-drawer-resize--active::after {
    background: #A8A29E;
  }

  .phz-sc-drawer-panel--resizing {
    transition: none;
    user-select: none;
  }

  .phz-sc-drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--phz-color-border-light, #E7E5E4);
    background: var(--phz-color-surface, #FFFFFF);
    flex-shrink: 0;
  }

  .phz-sc-drawer-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--phz-color-text, #1C1917);
  }

  .phz-sc-drawer-header-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .phz-sc-drawer-close,
  .phz-sc-drawer-pin {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: none;
    background: none;
    cursor: pointer;
    color: #78716C;
    font-family: inherit;
  }

  .phz-sc-drawer-close:hover,
  .phz-sc-drawer-pin:hover { background: #F5F5F4; color: #1C1917; }

  .phz-sc-drawer-pin--active {
    color: #2563EB;
    background: #EFF6FF;
  }

  .phz-sc-drawer-pin--active:hover {
    color: #1D4ED8;
    background: #DBEAFE;
  }

  /* Pinned sidebar mode — stays fixed to the right side, no overlay */
  .phz-sc-drawer-panel--pinned {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 100;
    transform: none;
    transition: none;
    box-shadow: -2px 0 8px rgba(28, 25, 23, 0.04);
    border-left: 1px solid #E7E5E4;
  }

  .phz-sc-drawer-body {
    flex: 1;
    overflow-y: auto;
    padding: 12px 0;
  }

  .phz-sc-drawer-footer {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    border-top: 1px solid var(--phz-color-border-light, #E7E5E4);
    background: var(--phz-color-surface, #FFFFFF);
    flex-shrink: 0;
  }

  .phz-sc-drawer-footer .phz-sc-btn { flex: 1; justify-content: center; }

  /* ══════════════════════════════════════════════════
     Filter Section (collapsible)
     ══════════════════════════════════════════════════ */

  .phz-sc-section {
    border-bottom: 1px solid #E7E5E4;
  }

  .phz-sc-section:last-child { border-bottom: none; }

  .phz-sc-section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    cursor: pointer;
    user-select: none;
    transition: background 0.1s;
  }

  .phz-sc-section-header:hover { background: #F5F5F4; }

  .phz-sc-section-chevron {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    color: #78716C;
    transition: transform 0.2s;
  }

  .phz-sc-section-chevron--expanded { transform: rotate(90deg); }

  .phz-sc-section-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--phz-color-text, #1C1917);
    flex: 1;
  }

  .phz-sc-section-required {
    color: var(--phz-color-danger, #DC2626);
    margin-left: 2px;
  }

  .phz-sc-section-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 9px;
    font-size: 10px;
    font-weight: 700;
    background: #2563EB;
    color: #FFFFFF;
    line-height: 1;
  }

  .phz-sc-section-body {
    padding: 0 20px 12px;
  }

  /* ══════════════════════════════════════════════════
     Expanded Modal
     ══════════════════════════════════════════════════ */

  .phz-sc-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(28, 25, 23, 0.5);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .phz-sc-modal-panel {
    background: var(--phz-color-surface, #FFFFFF);
    border-radius: 16px;
    box-shadow: 0 16px 48px rgba(28, 25, 23, 0.16);
    display: flex;
    width: 90vw;
    max-width: 960px;
    height: 80vh;
    max-height: 720px;
    overflow: hidden;
  }

  .phz-sc-modal-sidebar {
    width: 240px;
    border-right: 1px solid var(--phz-color-border-light, #E7E5E4);
    background: var(--phz-color-surface-alt, #FAFAF9);
    overflow-y: auto;
    flex-shrink: 0;
  }

  .phz-sc-modal-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .phz-sc-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #E7E5E4;
    flex-shrink: 0;
  }

  .phz-sc-modal-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--phz-color-text, #1C1917);
  }

  .phz-sc-modal-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: none;
    background: none;
    cursor: pointer;
    color: #78716C;
    font-family: inherit;
  }

  .phz-sc-modal-close:hover { background: #F5F5F4; color: #1C1917; }

  .phz-sc-modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
  }

  /* ══════════════════════════════════════════════════
     Studio Modal (Filter Definition Studio)
     ══════════════════════════════════════════════════ */

  .phz-sc-studio-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(28, 25, 23, 0.5);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .phz-sc-studio-modal-panel {
    background: var(--phz-color-surface, #FFFFFF);
    border-radius: 16px;
    box-shadow: 0 16px 48px rgba(28, 25, 23, 0.16);
    display: flex;
    flex-direction: column;
    width: 92vw;
    max-width: 1200px;
    height: 85vh;
    max-height: 800px;
    overflow: hidden;
  }

  .phz-sc-studio-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #E7E5E4;
    flex-shrink: 0;
  }

  .phz-sc-studio-modal-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--phz-color-text, #1C1917);
  }

  .phz-sc-studio-modal-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: none;
    background: none;
    cursor: pointer;
    color: #78716C;
    font-family: inherit;
    font-size: 16px;
  }

  .phz-sc-studio-modal-close:hover {
    background: #F5F5F4;
    color: #1C1917;
  }

  .phz-sc-studio-modal-body {
    flex: 1;
    overflow: hidden;
  }

  /* ══════════════════════════════════════════════════
     Chip Select
     ══════════════════════════════════════════════════ */

  .phz-sc-chip-sel {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .phz-sc-chip-sel-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 12px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid #D6D3D1;
    background: #FFFFFF;
    color: #44403C;
    transition: all 0.15s;
    font-family: inherit;
    user-select: none;
  }

  .phz-sc-chip-sel-item:hover { background: #F5F5F4; border-color: #A8A29E; }

  .phz-sc-chip-sel-item--active {
    background: #1C1917;
    color: #FFFFFF;
    border-color: #1C1917;
  }

  .phz-sc-chip-sel-item--active:hover { background: #292524; }

  .phz-sc-chip-sel-item--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  /* ══════════════════════════════════════════════════
     Match Filter Pill
     ══════════════════════════════════════════════════ */

  .phz-sc-match-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid;
    transition: all 0.15s;
    font-family: inherit;
    user-select: none;
  }

  .phz-sc-match-pill--all {
    border-color: #D6D3D1;
    color: #78716C;
    background: #FFFFFF;
  }

  .phz-sc-match-pill--all:hover { background: #F5F5F4; }

  .phz-sc-match-pill--matching {
    border-color: #86EFAC;
    color: #166534;
    background: #DCFCE7;
  }

  .phz-sc-match-pill--matching:hover { background: #BBF7D0; }

  .phz-sc-match-pill--non-matching {
    border-color: #FDE68A;
    color: #92400E;
    background: #FEF3C7;
  }

  .phz-sc-match-pill--non-matching:hover { background: #FDE68A; }

  /* ══════════════════════════════════════════════════
     Preset Sidebar
     ══════════════════════════════════════════════════ */

  .phz-sc-preset-sb {
    padding: 8px 0;
  }

  .phz-sc-preset-sb-group {
    font-size: 10px;
    font-weight: 700;
    color: #A8A29E;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 8px 16px 4px;
  }

  .phz-sc-preset-sb-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    cursor: pointer;
    font-size: 13px;
    color: #44403C;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    font-family: inherit;
    transition: background 0.1s;
  }

  .phz-sc-preset-sb-item:hover { background: #F5F5F4; }

  .phz-sc-preset-sb-item--active {
    background: #1C1917;
    color: #FFFFFF;
  }

  .phz-sc-preset-sb-item--active:hover { background: #292524; }

  /* ── Mobile Responsive ── */
  @media (max-width: 576px) {
    .phz-sc-bar {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
    }

    .phz-sc-drawer-panel {
      width: 100% !important;
      max-width: 100vw;
      border-left: none;
    }

    .phz-sc-drawer-resize {
      display: none;
    }
  }
`;
//# sourceMappingURL=shared-styles.js.map