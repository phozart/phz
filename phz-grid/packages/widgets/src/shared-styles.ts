/**
 * @phozart/widgets — Shared Styles
 *
 * Common CSS for all widget components. Uses phz-w- prefix.
 * Colors are exposed as CSS custom properties (--phz-w-*) for theming.
 * Set these properties on a parent element to override the defaults.
 */

import { css } from 'lit';

export const widgetBaseStyles = css`
  :host {
    display: block;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    color: var(--phz-w-text, #1C1917);
    box-sizing: border-box;
  }

  *,
  *::before,
  *::after {
    box-sizing: inherit;
  }

  /* Card base */
  .phz-w-card {
    background: var(--phz-w-bg, #FFFFFF);
    border: 1px solid var(--phz-w-border, #E7E5E4);
    border-radius: 8px;
    padding: 16px;
    transition: box-shadow 0.15s ease;
  }

  .phz-w-card:hover {
    box-shadow: 0 2px 8px rgba(28, 25, 23, 0.08);
  }

  /* Status colors */
  .phz-w-status--ok { color: #16A34A; }
  .phz-w-status--warn { color: #D97706; }
  .phz-w-status--crit { color: #DC2626; }
  .phz-w-status--unknown { color: var(--phz-w-text-muted, #A8A29E); }

  .phz-w-status-bg--ok { background-color: #F0FDF4; }
  .phz-w-status-bg--warn { background-color: #FFFBEB; }
  .phz-w-status-bg--crit { background-color: #FEF2F2; }
  .phz-w-status-bg--unknown { background-color: var(--phz-w-surface, #FAFAF9); }

  /* Typography */
  .phz-w-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--phz-w-text-secondary, #44403C);
    margin: 0 0 8px 0;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  .phz-w-value {
    font-size: 32px;
    font-weight: 700;
    line-height: 1.1;
    margin: 0;
  }

  .phz-w-value--compact {
    font-size: 24px;
  }

  .phz-w-value--minimal {
    font-size: 20px;
  }

  .phz-w-label {
    font-size: 12px;
    color: var(--phz-w-text-muted, #78716C);
    margin: 0;
  }

  /* Delta */
  .phz-w-delta {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    font-weight: 500;
  }

  .phz-w-delta--improving { color: #16A34A; }
  .phz-w-delta--declining { color: #DC2626; }

  /* Badge */
  .phz-w-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .phz-w-badge--ok { background: #F0FDF4; color: #16A34A; }
  .phz-w-badge--warn { background: #FFFBEB; color: #D97706; }
  .phz-w-badge--crit { background: #FEF2F2; color: #DC2626; }
  .phz-w-badge--unknown { background: var(--phz-w-surface, #FAFAF9); color: var(--phz-w-text-muted, #A8A29E); }

  /* Sparkline */
  .phz-w-sparkline {
    display: flex;
    align-items: flex-end;
    gap: 1px;
    height: 24px;
  }

  .phz-w-sparkline__bar {
    flex: 1;
    min-width: 3px;
    background: var(--phz-w-border, #D6D3D1);
    border-radius: 1px 1px 0 0;
    transition: background-color 0.15s ease;
  }

  /* Table base */
  .phz-w-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .phz-w-table th {
    text-align: left;
    padding: 8px 12px;
    font-weight: 600;
    color: var(--phz-w-text-secondary, #44403C);
    border-bottom: 2px solid var(--phz-w-border, #E7E5E4);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .phz-w-table td {
    padding: 8px 12px;
    border-bottom: 1px solid var(--phz-w-surface, #F5F5F4);
  }

  .phz-w-table tr:hover td {
    background: var(--phz-w-surface, #FAFAF9);
  }

  /* Status dot */
  .phz-w-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 6px;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .phz-w-value { font-size: 24px; }
    .phz-w-card { padding: 12px; }
  }

  /* Click targets */
  .phz-w-clickable {
    cursor: pointer;
  }

  .phz-w-clickable:focus-visible {
    outline: 2px solid #3B82F6;
    outline-offset: 2px;
  }

  /* SVG chart base */
  .phz-w-chart-svg {
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  /* Hidden but accessible */
  .phz-w-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* Tooltip */
  .phz-w-tooltip {
    position: absolute;
    z-index: 1000;
    padding: 6px 10px;
    background: #1C1917;
    color: #FFFFFF;
    font-size: 12px;
    font-weight: 500;
    border-radius: 6px;
    pointer-events: none;
    white-space: pre-line;
    box-shadow: 0 4px 12px rgba(28, 25, 23, 0.15);
    opacity: 0;
    transition: opacity 0.15s ease;
    max-width: 240px;
  }

  .phz-w-tooltip--visible {
    opacity: 1;
  }

  /* Widget states */
  .phz-w-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    text-align: center;
    min-height: 80px;
  }

  .phz-w-state__spinner {
    width: 24px;
    height: 24px;
    border: 3px solid var(--phz-w-border, #E7E5E4);
    border-top-color: #3B82F6;
    border-radius: 50%;
    animation: phz-spin 0.8s linear infinite;
    margin-bottom: 8px;
  }

  @keyframes phz-spin {
    to { transform: rotate(360deg); }
  }

  .phz-w-state__message {
    font-size: 13px;
    color: var(--phz-w-text-muted, #78716C);
    margin: 0;
  }

  .phz-w-state__error-message {
    font-size: 13px;
    color: #DC2626;
    margin: 0 0 8px 0;
  }

  .phz-w-state__retry-btn {
    padding: 4px 12px;
    border: 1px solid var(--phz-w-border, #D6D3D1);
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    background: var(--phz-w-bg, white);
    color: var(--phz-w-text-secondary, #44403C);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .phz-w-state__retry-btn:hover {
    background: var(--phz-w-surface, #FAFAF9);
    border-color: var(--phz-w-text-muted, #A8A29E);
  }

  .phz-w-state__retry-btn:focus-visible {
    outline: 2px solid #3B82F6;
    outline-offset: 2px;
  }
`;
