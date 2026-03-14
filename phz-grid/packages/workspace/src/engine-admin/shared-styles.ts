/**
 * @phozart/engine-admin — Shared Styles
 *
 * Common CSS for engine admin components. Uses phz-ea- prefix.
 */

import { css } from 'lit';

export const engineAdminStyles = css`
  :host {
    display: block;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    color: #1C1917;
    box-sizing: border-box;
  }

  *, *::before, *::after { box-sizing: inherit; }

  /* 3-panel layout */
  .phz-ea-layout {
    display: grid;
    grid-template-columns: 240px 1fr 320px;
    height: 100%;
    min-height: 500px;
  }

  .phz-ea-layout--two-panel {
    grid-template-columns: 280px 1fr;
  }

  .phz-ea-panel {
    border-right: 1px solid #E7E5E4;
    overflow-y: auto;
    padding: 16px;
  }

  .phz-ea-panel:last-child { border-right: none; }

  .phz-ea-panel-header {
    font-size: 11px;
    font-weight: 700;
    color: #78716C;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 0 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid #E7E5E4;
  }

  /* Step navigation */
  .phz-ea-steps {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .phz-ea-step {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    color: #78716C;
    background: none;
    border: none;
    text-align: left;
    width: 100%;
    transition: all 0.15s ease;
  }

  .phz-ea-step:hover { background: #FAFAF9; color: #44403C; }
  .phz-ea-step--active { background: #EFF6FF; color: #3B82F6; font-weight: 600; }
  .phz-ea-step--complete { color: #16A34A; }

  .phz-ea-step-number {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid currentColor;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    flex-shrink: 0;
  }

  .phz-ea-step--complete .phz-ea-step-number {
    background: #16A34A;
    border-color: #16A34A;
    color: white;
  }

  .phz-ea-step--complete .phz-ea-step-number::after { content: '✓'; }

  /* Form controls (same as grid-admin) */
  .phz-ea-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 14px;
  }

  .phz-ea-label {
    font-size: 12px;
    font-weight: 600;
    color: #44403C;
  }

  .phz-ea-input {
    padding: 7px 10px;
    border: 1px solid #D6D3D1;
    border-radius: 6px;
    font-size: 13px;
    background: white;
    color: #1C1917;
  }

  .phz-ea-input:focus { outline: none; border-color: #3B82F6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }

  .phz-ea-select {
    padding: 7px 10px;
    border: 1px solid #D6D3D1;
    border-radius: 6px;
    font-size: 13px;
    background: white;
  }

  .phz-ea-textarea {
    padding: 7px 10px;
    border: 1px solid #D6D3D1;
    border-radius: 6px;
    font-size: 13px;
    min-height: 60px;
    resize: vertical;
  }

  /* Buttons */
  .phz-ea-btn {
    padding: 7px 16px;
    border: 1px solid #D6D3D1;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    background: white;
    color: #44403C;
    cursor: pointer;
  }
  .phz-ea-btn:hover { background: #FAFAF9; }
  .phz-ea-btn--primary { background: #3B82F6; color: white; border-color: #3B82F6; }
  .phz-ea-btn--primary:hover { background: #2563EB; }
  .phz-ea-btn--danger { background: white; color: #DC2626; border-color: #FCA5A5; }
  .phz-ea-btn--danger:hover { background: #FEF2F2; }

  .phz-ea-btn-group { display: flex; gap: 8px; }

  /* Navigation bar */
  .phz-ea-nav-bar {
    display: flex;
    justify-content: space-between;
    padding: 12px 16px;
    border-top: 1px solid #E7E5E4;
    background: #FAFAF9;
  }

  /* Chips */
  .phz-ea-chip {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border: 1px solid #D6D3D1;
    border-radius: 16px;
    font-size: 12px;
    cursor: pointer;
    background: white;
  }
  .phz-ea-chip:hover { background: #F5F5F4; }
  .phz-ea-chip--active { background: #3B82F6; color: white; border-color: #3B82F6; }

  /* Radio group */
  .phz-ea-radio-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .phz-ea-radio {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    cursor: pointer;
  }

  /* Card tile (for widget catalog) */
  .phz-ea-tile {
    padding: 12px;
    border: 1px solid #E7E5E4;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .phz-ea-tile:hover { border-color: #3B82F6; background: #EFF6FF; }
  .phz-ea-tile__icon { font-size: 20px; margin-bottom: 4px; }
  .phz-ea-tile__label { font-size: 12px; font-weight: 600; color: #1C1917; }
  .phz-ea-tile__desc { font-size: 11px; color: #78716C; }

  /* Searchable list */
  .phz-ea-search {
    width: 100%;
    padding: 7px 10px;
    border: 1px solid #D6D3D1;
    border-radius: 6px;
    font-size: 13px;
    margin-bottom: 12px;
  }

  /* List */
  .phz-ea-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .phz-ea-list-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
  }
  .phz-ea-list-item:hover { background: #FAFAF9; }
  .phz-ea-list-item--active { background: #EFF6FF; color: #3B82F6; }

  /* Tabs */
  .phz-ea-tabs {
    display: flex;
    border-bottom: 2px solid #E7E5E4;
    overflow-x: auto;
  }

  .phz-ea-tab {
    padding: 10px 16px;
    font-size: 12px;
    font-weight: 600;
    color: #78716C;
    cursor: pointer;
    border: none;
    background: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    white-space: nowrap;
  }
  .phz-ea-tab:hover { color: #44403C; }
  .phz-ea-tab--active { color: #3B82F6; border-bottom-color: #3B82F6; }

  /* Threshold bar visualization */
  .phz-ea-threshold-bar {
    height: 8px;
    border-radius: 4px;
    display: flex;
    overflow: hidden;
    margin: 8px 0;
  }

  .phz-ea-threshold-zone {
    height: 100%;
    transition: width 0.2s ease;
  }

  /* Header bar */
  .phz-ea-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    background: #1C1917;
    color: white;
  }

  .phz-ea-header-title {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .phz-ea-header-subtitle {
    font-size: 11px;
    color: #A8A29E;
    margin-left: 8px;
    font-weight: 400;
    text-transform: none;
    letter-spacing: 0;
  }

  /* ── Touch targets: 44px minimum ── */
  .phz-ea-btn { min-height: 44px; min-width: 44px; }
  .phz-ea-tab { min-height: 44px; }
  .phz-ea-input { min-height: 44px; }
  .phz-ea-select { min-height: 44px; }
  .phz-ea-textarea { min-height: 60px; }
  .phz-ea-search { min-height: 44px; }
  .phz-ea-step { min-height: 44px; }
  .phz-ea-chip { min-height: 44px; }
  .phz-ea-radio { min-height: 44px; }
  .phz-ea-list-item { min-height: 44px; }
  .phz-ea-tile { min-height: 44px; }

  /* ── Responsive: 3-panel layout collapse ── */
  @media (max-width: 768px) {
    .phz-ea-layout {
      grid-template-columns: 1fr;
      grid-template-rows: auto 1fr;
    }
    .phz-ea-layout--two-panel {
      grid-template-columns: 1fr;
    }
    .phz-ea-panel {
      border-right: none;
      border-bottom: 1px solid #E7E5E4;
    }
    .phz-ea-panel:last-child { border-bottom: none; }
    .phz-ea-tabs { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .phz-ea-header { flex-wrap: wrap; gap: 8px; }
  }

  /* ── Reduced Motion ── */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      transition-duration: 0.01ms !important;
      animation-duration: 0.01ms !important;
    }
  }
`;
