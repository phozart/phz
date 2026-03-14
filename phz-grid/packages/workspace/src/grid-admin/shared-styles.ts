/**
 * @phozart/grid-admin — Shared Styles
 *
 * Common CSS for admin components. Uses phz-admin- prefix.
 * Design: Console-mode aesthetic with warm multi-layer shadows,
 * 12-16px radius, 12px+ typography, hover lift, focus rings.
 */

import { css } from 'lit';

export const adminBaseStyles = css`
  :host {
    display: block;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    color: var(--phz-color-text, #1C1917);
    box-sizing: border-box;

    /* Shadow tokens — warm multi-layer */
    --phz-admin-shadow-sm: 0 2px 4px rgba(28,25,23,0.06), 0 1px 2px rgba(28,25,23,0.04);
    --phz-admin-shadow-md: 0 4px 8px rgba(28,25,23,0.08), 0 2px 4px rgba(28,25,23,0.04);
    --phz-admin-shadow-lg: 0 8px 16px rgba(28,25,23,0.10), 0 4px 8px rgba(28,25,23,0.06);
    --phz-admin-shadow-hover: 0 8px 24px rgba(28,25,23,0.12), 0 4px 8px rgba(28,25,23,0.06);
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

  /* ── Panel ── */
  .phz-admin-panel {
    background: var(--phz-color-surface, #FFFFFF);
    height: 100%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    box-shadow: var(--phz-admin-shadow-lg);
  }

  .phz-admin-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--phz-color-border, #E7E5E4);
    position: sticky;
    top: 0;
    background: var(--phz-color-surface, white);
    z-index: 1;
  }

  .phz-admin-panel-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--phz-color-text, #1C1917);
    margin: 0;
  }

  .phz-admin-panel-body {
    padding: 20px;
    flex: 1;
  }

  /* ── Section ── */
  .phz-admin-section {
    margin-bottom: 24px;
  }

  .phz-admin-section-title {
    font-size: 12px;
    font-weight: 700;
    color: var(--phz-color-text-muted, #78716C);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 0 0 12px 0;
  }

  /* ── Form controls ── */
  .phz-admin-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }

  .phz-admin-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--phz-color-text-secondary, #44403C);
  }

  .phz-admin-input {
    padding: 8px 12px;
    border: 1px solid var(--phz-color-border, #D6D3D1);
    border-radius: 8px;
    font-size: 13px;
    background: var(--phz-color-surface, white);
    color: var(--phz-color-text, #1C1917);
    transition: border-color 0.15s ease;
  }

  .phz-admin-input:focus {
    outline: none;
    border-color: var(--phz-color-primary, #3B82F6);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
  }

  .phz-admin-select {
    padding: 8px 12px;
    border: 1px solid var(--phz-color-border, #D6D3D1);
    border-radius: 8px;
    font-size: 13px;
    background: var(--phz-color-surface, white);
    color: var(--phz-color-text, #1C1917);
  }

  .phz-admin-checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    cursor: pointer;
    min-height: 36px;
  }

  .phz-admin-checkbox input { cursor: pointer; }

  /* ── Buttons ── */
  .phz-admin-btn {
    padding: 8px 16px;
    border: 1px solid var(--phz-color-border, #D6D3D1);
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    background: var(--phz-color-surface, white);
    color: var(--phz-color-text-secondary, #44403C);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .phz-admin-btn:hover {
    background: var(--phz-color-surface-alt, #FAFAF9);
    box-shadow: var(--phz-admin-shadow-sm);
  }
  .phz-admin-btn--primary { background: var(--phz-color-primary, #3B82F6); color: white; border-color: var(--phz-color-primary, #3B82F6); }
  .phz-admin-btn--primary:hover { background: var(--phz-color-primary-hover, #2563EB); box-shadow: var(--phz-admin-shadow-md); }
  .phz-admin-btn--danger { color: var(--phz-color-danger, #DC2626); }
  .phz-admin-btn--danger:hover { background: var(--phz-color-danger-light, #FEF2F2); }

  .phz-admin-btn-group {
    display: flex;
    gap: 8px;
  }

  /* ── List items ── */
  .phz-admin-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .phz-admin-list-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-radius: 12px;
    margin-bottom: 6px;
    cursor: grab;
    box-shadow: var(--phz-admin-shadow-sm);
    background: var(--phz-color-surface, white);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .phz-admin-list-item:hover {
    transform: translateY(-2px);
    box-shadow: var(--phz-admin-shadow-md);
  }

  .phz-admin-list-item__label {
    font-size: 13px;
    color: var(--phz-color-text, #1C1917);
  }

  .phz-admin-list-item__actions {
    display: flex;
    gap: 4px;
  }

  /* ── Toggle switch (44px touch target) ── */
  .phz-admin-toggle {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
  }

  .phz-admin-toggle input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .phz-admin-toggle-slider {
    position: absolute;
    cursor: pointer;
    inset: 0;
    background: var(--phz-color-border, #D6D3D1);
    border-radius: 12px;
    transition: background 0.2s ease;
  }

  .phz-admin-toggle-slider::before {
    content: '';
    position: absolute;
    height: 20px;
    width: 20px;
    left: 2px;
    bottom: 2px;
    background: white;
    border-radius: 50%;
    transition: transform 0.2s ease;
    box-shadow: var(--phz-admin-shadow-sm);
  }

  .phz-admin-toggle input:checked + .phz-admin-toggle-slider { background: var(--phz-color-primary, #3B82F6); }
  .phz-admin-toggle input:checked + .phz-admin-toggle-slider::before { transform: translateX(20px); }

  /* ── Tabs ── */
  .phz-admin-tabs {
    display: flex;
    border-bottom: 2px solid var(--phz-color-border-light, #E7E5E4);
    overflow-x: auto;
  }

  .phz-admin-tab {
    padding: 10px 14px;
    font-size: 13px;
    font-weight: 600;
    color: var(--phz-color-text-muted, #78716C);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    white-space: nowrap;
    background: none;
    border-left: none;
    border-right: none;
    border-top: none;
    min-height: 44px;
    transition: color 0.15s ease;
  }

  .phz-admin-tab:hover { color: var(--phz-color-text-secondary, #44403C); }
  .phz-admin-tab--active { color: var(--phz-color-primary, #3B82F6); border-bottom-color: var(--phz-color-primary, #3B82F6); }

  /* ── Color picker ── */
  .phz-admin-color {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .phz-admin-color input[type="color"] {
    width: 32px;
    height: 32px;
    border: 1px solid var(--phz-color-border, #D6D3D1);
    border-radius: 8px;
    padding: 2px;
    cursor: pointer;
  }

  /* ── Mini grid preview ── */
  .phz-admin-preview {
    border-radius: 12px;
    padding: 12px;
    background: var(--phz-color-surface-alt, #FAFAF9);
    box-shadow: var(--phz-admin-shadow-sm);
    font-size: 12px;
    color: var(--phz-color-text-muted, #78716C);
    text-align: center;
  }

  /* ── Touch targets: 44px minimum ── */
  .phz-admin-btn { min-height: 44px; min-width: 44px; }
  .phz-admin-tab { min-height: 44px; }
  .phz-admin-checkbox { min-height: 44px; }
  .phz-admin-input { min-height: 44px; }
  .phz-admin-select { min-height: 44px; }
  .phz-admin-list-item { min-height: 44px; }

  /* ── Reduced Motion ── */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      transition-duration: 0.01ms !important;
      animation-duration: 0.01ms !important;
    }
  }
`;
