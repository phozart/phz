import { css } from 'lit';
export const phzGridStyles = css `
  :host {
    display: flex;
    flex-direction: column;
    height: 100%;
    contain: style;
    font-family: var(--phz-font-family-base, 'SF Pro Display', 'Inter', system-ui, -apple-system, sans-serif);
    font-size: var(--phz-font-size-base, 0.875rem);
    color: var(--phz-grid-text, #1C1917);
    background: var(--phz-grid-bg, #FEFDFB);
    border-radius: var(--phz-border-radius-lg, 16px);
    box-shadow: var(--phz-shadow-lg, 0 10px 25px rgba(28,25,23,0.10), 0 4px 10px rgba(28,25,23,0.05));
    overflow: hidden;
    --_row-height: var(--phz-row-height, 42px);
    --_cell-padding: var(--phz-cell-padding, 8px 12px);
    --_cell-overflow: var(--phz-cell-overflow, visible);
    --_cell-white-space: var(--phz-cell-white-space, normal);
    --_cell-word-break: var(--phz-cell-word-break, break-word);
    --_cell-text-overflow: var(--phz-cell-text-overflow, clip);
    --_font-mono: var(--phz-font-family-mono, 'SF Mono', 'JetBrains Mono', 'Fira Code', ui-monospace, monospace);
    --_font-sans: var(--phz-font-family-base, 'SF Pro Display', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, system-ui, sans-serif);
  }

  :host([density="comfortable"]) {
    --_row-height: var(--phz-row-height-comfortable, 52px);
    --_cell-padding: 14px 16px;
    --_cell-overflow: visible;
    --_cell-white-space: normal;
    --_cell-word-break: break-word;
    --_cell-text-overflow: clip;
  }
  :host([density="compact"]) {
    --_row-height: var(--phz-row-height-compact, 42px);
    --_cell-padding: 8px 12px;
    --_cell-overflow: hidden;
    --_cell-white-space: nowrap;
    --_cell-word-break: normal;
    --_cell-text-overflow: ellipsis;
  }
  :host([density="dense"]) {
    --_row-height: var(--phz-row-height-dense, 34px);
    --_cell-padding: 5px 8px;
    --_cell-overflow: hidden;
    --_cell-white-space: nowrap;
    --_cell-word-break: normal;
    --_cell-text-overflow: ellipsis;
  }

  * { box-sizing: border-box; }

  .phz-header-bar {
    background: var(--phz-header-bar-bg, #1C1917);
    color: white;
    padding: 0 24px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #292524;
  }
  .phz-header-bar__left { display: flex; align-items: center; gap: 10px; }
  .phz-header-bar__logo {
    width: 22px; height: 22px; border-radius: 6px;
    background: linear-gradient(135deg, #3B82F6, #8B5CF6);
    display: flex; align-items: center; justify-content: center;
  }
  .phz-header-bar__title { font-weight: 600; font-size: 14px; letter-spacing: 0.04em; }
  .phz-header-bar__divider { color: #A8A29E; }
  .phz-header-bar__subtitle { color: #A8A29E; font-size: 13px; }
  .phz-header-bar__right { display: flex; align-items: center; gap: 12px; }
  .phz-header-bar__records {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; font-family: var(--_font-mono); color: #A8A29E;
  }
  .phz-header-bar__dot { width: 7px; height: 7px; border-radius: 50%; background: #A8A29E; }

  .phz-selection-bar {
    padding: 8px 24px;
    background: #EFF6FF;
    border-bottom: 1px solid #BFDBFE;
    display: flex; align-items: center;
    justify-content: space-between;
    animation: phz-slide-down 200ms ease;
  }
  .phz-selection-bar__count { font-size: 13px; color: #1D4ED8; font-weight: 500; }
  .phz-selection-bar__actions { display: flex; gap: 6px; }
  .phz-selection-bar__btn {
    padding: 4px 12px; font-size: 12px; border-radius: 6px;
    cursor: pointer; font-weight: 500; font-family: inherit;
    transition: all 100ms;
  }
  .phz-selection-bar__btn--default { border: 1px solid #BFDBFE; background: white; color: #1D4ED8; }
  .phz-selection-bar__btn--danger { border: 1px solid #FECACA; background: #FEF2F2; color: #DC2626; }
  .phz-selection-bar__btn--secondary { border: 1px solid #E7E5E4; background: white; color: #57534E; }
  .phz-selection-bar__group { display: flex; gap: 6px; align-items: center; }
  .phz-selection-bar__separator { width: 1px; height: 20px; background: #BFDBFE; margin: 0 4px; }

  .phz-data-cell--in-range {
    background: rgba(59, 130, 246, 0.1) !important;
    outline: 1px solid rgba(59, 130, 246, 0.3);
    outline-offset: -1px;
  }

  .phz-grid__container { overflow: auto; position: relative; background: white; contain: strict; -webkit-overflow-scrolling: touch; }
  .phz-grid__container::-webkit-scrollbar { height: 6px; width: 6px; }
  .phz-grid__container::-webkit-scrollbar-track { background: transparent; }
  .phz-grid__container::-webkit-scrollbar-thumb { background: #D6D3D1; border-radius: 3px; }
  .phz-grid__container::-webkit-scrollbar-thumb:hover { background: #A8A29E; }

  .phz-table { width: 100%; border-collapse: collapse; min-width: 800px; table-layout: fixed; }
  .phz-grid__body:focus { outline: none; }
  .phz-thead-row { border-bottom: 2px solid #E7E5E4; }

  .phz-header-cell {
    padding: var(--_cell-padding);
    text-align: var(--phz-header-text-align, left);
    font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.03em;
    color: var(--phz-header-text, #A8A29E);
    background: var(--phz-header-bg, transparent);
    cursor: var(--phz-sort-cursor, pointer); user-select: none;
    position: relative; white-space: var(--phz-header-white-space, normal);
    vertical-align: bottom; line-height: 1.4;
  }
  .phz-header-cell:hover { color: #57534E; }

  .phz-thead-row--group .phz-group-header-cell {
    padding: 6px 12px; text-align: center;
    font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.08em;
    color: #78716C; border-bottom: 2px solid #44403C;
    border-right: 1px solid #E7E5E4;
  }
  .phz-thead-row--group .phz-group-header-cell:last-child { border-right: none; }

  .phz-header-inner {
    display: flex; align-items: center; gap: 4px;
    justify-content: var(--phz-header-justify, flex-start);
  }
  .phz-sort-icon { flex-shrink: 0; }

  .phz-filter-btn {
    background: none; border: none; cursor: pointer; padding: 2px;
    display: var(--phz-filter-icon-display, flex); margin-left: 2px;
    opacity: 0; transition: opacity 150ms;
  }
  .phz-filter-btn--active { opacity: 1; }
  .phz-header-cell:hover .phz-filter-btn,
  .phz-header-cell:focus-within .phz-filter-btn { opacity: 1; }

  .phz-resize-handle {
    position: absolute; top: 0; right: 0;
    width: 8px; height: 100%;
    cursor: col-resize;
    background: transparent; z-index: 1;
  }
  .phz-resize-handle::after {
    content: '';
    position: absolute; top: 25%; bottom: 25%; right: 3px;
    width: 2px; background: transparent;
    border-radius: 1px; transition: background 150ms;
  }
  .phz-resize-handle:hover::after { background: var(--phz-color-primary, #3B82F6); }

  .phz-col-filter-dropdown {
    position: absolute; top: 100%; left: 0; z-index: 100;
    background: white; border-radius: 12px;
    border: 1px solid #E7E5E4;
    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
    padding: 8px; min-width: 180; max-height: 260px;
    overflow-y: auto;
  }
  .phz-col-filter-dropdown__header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 4px 8px; margin-bottom: 4px;
  }
  .phz-col-filter-dropdown__title {
    font-size: 11px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.05em; color: #A8A29E;
  }
  .phz-col-filter-dropdown__clear {
    width: 100%; padding: 5px 8px; font-size: 11px; color: #3B82F6;
    background: none; border: none; cursor: pointer; text-align: left; font-weight: 500;
  }
  .phz-col-filter-dropdown__item {
    display: flex; align-items: center; gap: 8px;
    padding: 5px 8px; border-radius: 6px;
    cursor: pointer; font-size: 13px; color: #1C1917;
  }
  .phz-col-filter-dropdown__item:hover { background: #F5F5F4; }
  .phz-col-filter-dropdown__item--active { background: #F5F4F2; }
  .phz-col-filter-dropdown__checkbox { accent-color: #3B82F6; width: 14px; height: 14px; }

  .phz-data-row { height: var(--_row-height); transition: background 100ms ease; }

  :host([grid-lines="horizontal"]) .phz-data-row,
  :host([grid-lines="both"]) .phz-data-row {
    border-bottom: var(--phz-grid-line-width, 1px) solid var(--phz-grid-line-color, #E7E5E4);
  }
  :host([grid-lines="vertical"]) .phz-data-cell,
  :host([grid-lines="both"]) .phz-data-cell {
    border-right: var(--phz-grid-line-width, 1px) solid var(--phz-grid-line-color, #E7E5E4);
  }
  :host([grid-lines="vertical"]) .phz-data-cell:last-child,
  :host([grid-lines="both"]) .phz-data-cell:last-child { border-right: none; }

  :host([hover-highlight]) .phz-data-row:hover { background: rgba(59, 130, 246, 0.04); }
  :host([row-banding]) .phz-data-row:nth-child(even) { background: var(--phz-banding-color, #FAFAF9); }
  :host([row-banding][hover-highlight]) .phz-data-row:nth-child(even):hover { filter: brightness(0.97); }
  .phz-data-row--selected { background: #EFF6FF !important; }
  .phz-data-row--selected:hover { background: #EFF6FF !important; }

  .phz-data-cell {
    padding: var(--_cell-padding);
    font-family: var(--phz-cell-font-family, inherit);
    font-size: var(--phz-cell-font-size, 13px);
    font-weight: var(--phz-cell-font-weight, normal);
    font-style: var(--phz-cell-font-style, normal);
    text-decoration: var(--phz-cell-text-decoration, none);
    text-align: var(--phz-cell-text-align, left);
    overflow: var(--_cell-overflow, visible);
    white-space: var(--_cell-white-space, normal);
    word-break: var(--_cell-word-break, break-word);
    text-overflow: var(--_cell-text-overflow, clip);
    vertical-align: var(--phz-cell-vertical-align, middle);
    position: relative;
    contain: content;
    max-height: var(--_row-height);
    line-height: 1.3;
  }
  .phz-data-cell:focus-visible {
    outline: 2px solid var(--phz-focus-ring-color, #3B82F6);
    outline-offset: -2px;
  }
  .phz-data-cell--mono {
    font-family: var(--_font-mono);
    font-size: 12px;
    letter-spacing: -0.01em;
    font-variant-numeric: tabular-nums;
    color: #57534E;
  }
  .phz-data-cell--center { text-align: center; }
  .phz-data-cell--right { text-align: right; }

  /* ── Column Pinning ── */
  .phz-header-cell--pinned-left,
  .phz-header-cell--pinned-right,
  .phz-data-cell--pinned-left,
  .phz-data-cell--pinned-right {
    z-index: 2;
    background: var(--phz-grid-bg, #FEFDFB);
  }
  .phz-header-cell--pinned-left,
  .phz-header-cell--pinned-right {
    z-index: 3;
    background: var(--phz-header-bg, #FEFDFB);
  }
  .phz-header-cell--pinned-last-left,
  .phz-data-cell--pinned-last-left {
    box-shadow: 2px 0 4px rgba(0,0,0,0.08);
  }
  .phz-header-cell--pinned-first-right,
  .phz-data-cell--pinned-first-right {
    box-shadow: -2px 0 4px rgba(0,0,0,0.08);
  }
  .phz-data-row--selected .phz-data-cell--pinned-left,
  .phz-data-row--selected .phz-data-cell--pinned-right {
    background: #EFF6FF;
  }
  :host([row-banding]) .phz-data-row:nth-child(even) .phz-data-cell--pinned-left,
  :host([row-banding]) .phz-data-row:nth-child(even) .phz-data-cell--pinned-right {
    background: var(--phz-banding-color, #FAFAF9);
  }
  :host([hover-highlight]) .phz-data-row:hover .phz-data-cell--pinned-left,
  :host([hover-highlight]) .phz-data-row:hover .phz-data-cell--pinned-right {
    background: #FAF9F7;
  }

  .phz-row-actions-cell { padding: 0 8px; text-align: center; vertical-align: middle; white-space: nowrap; }
  .phz-row-actions-cell button + button { margin-left: 4px; }
  .phz-row-action-btn {
    background: none; border: 1px solid #E7E5E4; border-radius: 6px;
    padding: 4px; cursor: pointer; color: #A8A29E;
    display: inline-flex; transition: all 100ms ease; opacity: 0;
  }
  .phz-data-row:hover .phz-row-action-btn { opacity: 1; }
  .phz-row-action-btn:hover { color: #3B82F6; border-color: #3B82F6; background: rgba(59,130,246,0.06); }
  .phz-row-action-btn--danger:hover { color: #EF4444; border-color: #EF4444; background: rgba(239,68,68,0.06); }

  .phz-checkbox-cell { width: 44px; text-align: center; vertical-align: middle; }
  .phz-checkbox {
    width: 18px; height: 18px; border-radius: 5px;
    border: 1.5px solid #D6D3D1;
    background: transparent;
    display: inline-flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 150ms ease;
    outline: none; padding: 0;
  }
  .phz-checkbox:focus-visible { outline: 2px solid var(--phz-color-primary, #3B82F6); outline-offset: 2px; }
  .phz-checkbox--checked { border-color: #3B82F6; background: #3B82F6; }

  .phz-status-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 3px 10px; border-radius: 8px;
    font-size: 12px; font-family: var(--_font-mono);
    font-weight: 500; letter-spacing: 0.01em; line-height: 18px;
  }
  .phz-status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

  .phz-activity-bar { display: flex; align-items: center; gap: 8px; width: 100%; }
  .phz-activity-track { flex: 1; height: 6px; border-radius: 3px; background: #F5F4F2; overflow: hidden; }
  .phz-activity-fill { height: 100%; border-radius: 3px; transition: width 600ms cubic-bezier(0.0, 0.0, 0.2, 1); }
  .phz-activity-label { font-size: 11px; font-family: var(--_font-mono); color: #78716C; min-width: 28px; text-align: right; font-weight: 600; }

  .phz-cell-editor {
    width: 100%; padding: 4px 6px; border-radius: 6px;
    border: 1.5px solid #3B82F6;
    font-size: 13px; background: white; outline: none;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
    font-family: inherit;
  }
  .phz-cell-editor--mono { font-family: var(--_font-mono); }
  .phz-cell-editor--select {
    width: 100%; padding: 4px 6px; border-radius: 6px;
    border: 1.5px solid #3B82F6;
    font-size: 12px; font-family: var(--_font-mono); background: white; outline: none;
  }

  .phz-aggregation-row { border-top: 2px solid #E7E5E4; background: #F5F5F4; }
  .phz-aggregation-cell {
    padding: var(--_cell-padding); font-weight: 600;
    font-size: 0.8125rem; color: #44403C;
    overflow: visible; white-space: normal;
    font-variant-numeric: tabular-nums;
  }
  .phz-aggregation-cell--mono { font-family: var(--_font-mono); font-size: 0.75rem; }
  .phz-aggregation-label { font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.05em; color: #A8A29E; margin-right: 6px; }
  .phz-aggregation-row--top { border-top: none; border-bottom: 2px solid #E7E5E4; background: #F5F5F4; }
  .phz-data-cell--drillable { cursor: pointer; }
  .phz-data-cell--drillable:hover { background: rgba(59, 130, 246, 0.06); }

  .phz-group-row { background: #F5F5F4; font-weight: 600; font-size: 0.8125rem; cursor: pointer; transition: background 100ms; }
  .phz-group-row:hover { background: #EEEEEC; }
  .phz-group-chevron { transition: transform 200ms ease; font-size: 12px; color: #78716C; width: 16px; text-align: center; display: inline-block; }
  .phz-group-chevron--expanded { transform: rotate(90deg); }
  .phz-group-value { }
  .phz-group-count { font-size: 0.6875rem; color: #A8A29E; font-weight: 400; font-variant-numeric: tabular-nums; }
  .phz-group-cell { padding: var(--_cell-padding); background: #F5F5F4; border-bottom: 1px solid #E7E5E4; cursor: pointer; }
  .phz-group-cell--label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .phz-group-cell--repeat { color: #A8A29E; font-size: 0.75rem; font-weight: 400; }
  .phz-group-col-header {
    background: var(--phz-header-bg, #F5F5F4);
    padding: var(--_cell-padding);
    font-weight: 600; font-size: 0.6875rem;
    text-transform: uppercase; letter-spacing: 0.03em;
    color: #78716C; border-bottom: 2px solid #E7E5E4; white-space: nowrap;
  }
  .phz-group-col-cell { padding: var(--_cell-padding); color: #78716C; font-size: 0.8125rem; border-bottom: 1px solid #E7E5E4; }
  .phz-group-totals-row td { padding: var(--_cell-padding); background: #FAFAF9; border-bottom: 1px solid #E7E5E4; font-variant-numeric: tabular-nums; font-size: 0.75rem; color: #57534E; }
  .phz-group-totals-label { font-weight: 600; color: #78716C; font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.03em; }
  .phz-group-agg-fn { font-size: 0.5625rem; text-transform: uppercase; letter-spacing: 0.05em; color: #A8A29E; margin-right: 4px; }
  .phz-group-agg { font-size: 0.6875rem; color: #78716C; font-weight: 400; font-variant-numeric: tabular-nums; margin-left: 8px; }
  .phz-group-agg__label { color: #A8A29E; }
  .phz-group-agg__sep { color: #D6D3D1; margin: 0 4px; }

  .phz-data-cell--anomaly { position: relative; }
  .phz-data-cell--anomaly::after { content: ''; position: absolute; top: 4px; right: 4px; width: 6px; height: 6px; border-radius: 50%; background: #F59E0B; }
  .phz-data-cell--anomaly-high::after { background: #EF4444; }

  .phz-footer { padding: 10px 24px; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #E7E5E4; background: #FAF9F7; flex-wrap: wrap; gap: 8px; }
  .phz-footer__info { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #57534E; }
  .phz-footer__range { font-family: var(--_font-mono); font-size: 12px; }
  .phz-footer__filter-info { font-size: 11px; color: #3B82F6; font-family: var(--_font-mono); }
  .phz-footer__controls { display: flex; align-items: center; gap: 6px; }
  .phz-page-size-select { padding: 5px 8px; border-radius: 8px; border: 1px solid #E7E5E4; font-size: 12px; font-family: var(--_font-mono); background: white; color: #57534E; cursor: pointer; outline: none; }
  .phz-page-size-select:focus { border-color: #3B82F6; }
  .phz-pagination {
    display: flex; align-items: center; justify-content: flex-end; gap: 16px;
    padding: 12px 24px; border-top: 1px solid #E7E5E4; background: #FAF9F7; flex-wrap: wrap;
  }
  .phz-pagination--left { justify-content: flex-start; }
  .phz-pagination--center { justify-content: center; }
  .phz-pagination__info {
    font-size: 13px; color: #78716C; font-family: var(--_font-mono);
    font-variant-numeric: tabular-nums; display: flex; align-items: center; gap: 6px;
  }
  .phz-pagination__rows { font-weight: 500; color: #57534E; }
  .phz-pagination__sep { color: #D6D3D1; }
  .phz-pagination__controls { display: flex; align-items: center; gap: 12px; }
  .phz-pagination__size-label {
    display: flex; align-items: center; gap: 6px;
    font-size: 13px; color: #78716C; font-family: var(--_font-mono);
  }
  .phz-pagination__size {
    padding: 6px 10px; border-radius: 8px; border: 1px solid #E7E5E4;
    font-size: 13px; font-family: var(--_font-mono); background: white; color: #57534E;
    cursor: pointer; outline: none; min-width: 56px;
  }
  .phz-pagination__size:focus { border-color: #3B82F6; }
  .phz-pagination__nav { display: flex; align-items: center; gap: 4px; }
  .phz-pagination__btn {
    width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center;
    background: white; border: 1px solid #E7E5E4; border-radius: 8px;
    cursor: pointer; color: #57534E; font-size: 15px; transition: all 100ms ease; font-family: inherit;
  }
  .phz-pagination__btn:disabled { color: #D6D3D1; cursor: default; border-color: #F5F5F4; background: transparent; }
  .phz-pagination__btn:not(:disabled):hover { background: #F5F5F4; border-color: #D6D3D1; }
  .phz-pagination__page {
    width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center;
    background: #1C1917; color: white; border-radius: 8px;
    font-family: var(--_font-mono); font-size: 13px; font-weight: 600;
  }
  .phz-page-btn { padding: 5px 10px; background: white; border: none; border-left: 1px solid #E7E5E4; cursor: pointer; color: #57534E; font-size: 13px; transition: all 100ms ease; font-family: inherit; }
  .phz-page-btn:first-child { border-left: none; }
  .phz-page-btn:disabled { color: #D6D3D1; cursor: default; }
  .phz-page-btn--active { background: #1C1917; color: white; font-family: var(--_font-mono); font-size: 12px; font-weight: 600; }
  .phz-page-btn:not(:disabled):hover { background: #F5F5F4; }
  .phz-page-btn--active:hover { background: #1C1917; }

  .phz-empty-state { text-align: center; padding: 48px; color: #A8A29E; }
  .phz-empty-state__icon { margin-bottom: 8px; color: #D6D3D1; }
  .phz-empty-state__text { font-size: 14px; }
  .phz-retry-btn { margin-top: 12px; padding: 6px 16px; border: 1px solid #D6D3D1; border-radius: 6px; background: white; cursor: pointer; font-size: 13px; }
  .phz-retry-btn:hover { background: #FAFAF9; }

  .phz-loading-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(254,253,251,0.7); z-index: 20; backdrop-filter: blur(2px); }
  .phz-loading-spinner { width: 32px; height: 32px; border: 3px solid #E7E5E4; border-top-color: #3B82F6; border-radius: 50%; animation: phz-spin 0.8s linear infinite; }
  .phz-loading-spinner--small { width: 14px; height: 14px; border-width: 2px; }
  @keyframes phz-spin { to { transform: rotate(360deg); } }

  .phz-progress-bar { display: flex; align-items: center; gap: 8px; padding: 6px 12px; font-size: 12px; color: var(--phz-text-secondary, #78716C); border-top: 1px solid var(--phz-border-default, #E7E5E4); background: var(--phz-bg-subtle, #FAFAF9); }

  .phz-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #1C1917; color: white; padding: 10px 20px; border-radius: 12px; font-size: 13px; font-weight: 500; box-shadow: 0 8px 30px rgba(0,0,0,0.2); z-index: 300; animation: phz-fade-in-up 200ms ease; display: flex; align-items: center; gap: 8px; }
  .phz-toast__dot { width: 6px; height: 6px; border-radius: 50%; background: #22C55E; }
  .phz-toast__icon { flex-shrink: 0; animation: phz-icon-pop 400ms ease; }
  .phz-toast--success .phz-toast__icon { color: #34D399; }
  .phz-toast--error .phz-toast__icon { color: #F87171; }
  .phz-toast--info .phz-toast__icon { color: #60A5FA; }
  .phz-toast__message { flex: 1; }
  .phz-toast__close { background: none; border: none; color: rgba(255,255,255,0.6); cursor: pointer; padding: 0 0 0 4px; font-size: 16px; line-height: 1; display: flex; align-items: center; }
  .phz-toast__close:hover { color: white; }
  @keyframes phz-icon-pop { 0% { transform: scale(0.6); opacity: 0; } 50% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }

  .phz-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border-width: 0; }

  @keyframes phz-fade-in-up {
    from { opacity: 0; transform: translateX(-50%) translateY(8px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  @keyframes phz-slide-down {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .phz-data-row, .phz-sort-icon, .phz-activity-fill, .phz-resize-handle::after, .phz-group-chevron { transition: none !important; }
    .phz-loading-spinner { animation-duration: 2s; }
    .phz-toast { animation: none; }
    .phz-toast__icon { animation: none; }
  }

  .phz-col-panel { position: absolute; top: 100%; right: 0; z-index: 100; background: white; border-radius: 12px; border: 1px solid #E7E5E4; box-shadow: 0 8px 30px rgba(0,0,0,0.12); padding: 8px; min-width: 200px; }
  .phz-col-panel__header { display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; margin-bottom: 4px; }
  .phz-col-panel__title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #A8A29E; }
  .phz-col-panel__item { display: flex; align-items: center; gap: 8px; padding: 5px 8px; border-radius: 6px; cursor: pointer; font-size: 13px; color: #1C1917; }
  .phz-col-panel__checkbox { accent-color: #3B82F6; width: 14px; height: 14px; }
  .phz-col-panel__export-btn { display: block; width: 100%; text-align: left; padding: 7px 12px; border: none; background: none; font-size: 13px; font-family: inherit; color: #1C1917; border-radius: 6px; cursor: pointer; }
  .phz-col-panel__export-btn:hover { background: rgba(59, 130, 246, 0.08); }
  .phz-export-csv { display: var(--phz-export-csv-display, block); }
  .phz-export-excel { display: var(--phz-export-excel-display, block); }
  .phz-export-options { padding: 4px 4px 0; }
  .phz-export-option { display: flex; align-items: center; gap: 6px; padding: 4px 8px; font-size: 12px; color: #44403C; cursor: pointer; border-radius: 4px; }
  .phz-export-option:hover { background: #F5F5F4; }
  .phz-export-option input { accent-color: #3B82F6; width: 13px; height: 13px; cursor: pointer; }
  .phz-icon-btn { background: none; border: none; cursor: pointer; padding: 2px; color: #78716C; display: flex; }

  .phz-virtual-sentinel { width: 100%; }
  .phz-data-row--skeleton .phz-data-cell { padding: var(--_cell-padding); }
  .phz-skeleton-shimmer { height: 14px; border-radius: 4px; background: linear-gradient(90deg, #E7E5E4 25%, #F5F5F4 50%, #E7E5E4 75%); background-size: 200% 100%; animation: phz-shimmer 1.5s ease-in-out infinite; }
  @keyframes phz-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  .phz-footer__loading-indicator { color: #3B82F6; font-size: 12px; margin-left: 8px; }
  @media (prefers-reduced-motion: reduce) { .phz-skeleton-shimmer { animation: none; background: #E7E5E4; } }

  /* ── Dark Mode (Phozart Console) ──
   * Warm stone palette dark variant.
   * Layers: #0C0A09 (header bar) → #1C1917 (base) → #211E1B (banding) → #292524 (elevated) → #44403C (borders)
   * Text: #F5F5F4 (primary) → #D6D3D1 (secondary) → #A8A29E (muted) → #78716C (faint)
   */
  :host([theme="dark"]) {
    --phz-grid-text: #F5F5F4;
    --phz-grid-bg: #1C1917;
    --phz-header-text: #D6D3D1;
    --phz-header-bg: #292524;
    --phz-header-bar-bg: #0C0A09;
    --phz-grid-line-color: #44403C;
    --phz-banding-color: #211E1B;
    color: #F5F5F4;
    background: #1C1917;
    box-shadow: 0 10px 25px rgba(0,0,0,0.25), 0 4px 10px rgba(0,0,0,0.15);
  }

  /* Container & scrollbar */
  :host([theme="dark"]) .phz-grid__container { background: #1C1917; border-top: 1px solid #292524; }
  :host([theme="dark"]) .phz-grid__container::-webkit-scrollbar-thumb { background: #57534E; border-radius: 4px; }
  :host([theme="dark"]) .phz-grid__container::-webkit-scrollbar-thumb:hover { background: #78716C; }

  /* Header bar — darkest layer, console frame */
  :host([theme="dark"]) .phz-header-bar { background: #0C0A09; border-bottom: 1px solid #292524; }
  :host([theme="dark"]) .phz-header-bar__subtitle { color: #78716C; }
  :host([theme="dark"]) .phz-header-bar__records { color: #78716C; }
  :host([theme="dark"]) .phz-header-bar__dot { background: #57534E; }

  /* Column headers — elevated surface */
  :host([theme="dark"]) .phz-thead-row { border-bottom: 1px solid #44403C; }
  :host([theme="dark"]) .phz-header-cell { color: #A8A29E; }
  :host([theme="dark"]) .phz-header-cell:hover { color: #F5F5F4; background: rgba(255,255,255,0.03); }

  /* Data rows — always have subtle warm separator */
  :host([theme="dark"]) .phz-data-row { border-bottom: 1px solid #292524; }
  :host([theme="dark"]) .phz-data-cell { color: #D6D3D1; }
  :host([theme="dark"]) .phz-data-cell--mono { color: #A8A29E; font-variant-numeric: tabular-nums; }

  /* Hover — perceptible lift */
  :host([theme="dark"]) .phz-data-row:hover { background: rgba(255,255,255,0.03); }
  :host([theme="dark"][hover-highlight]) .phz-data-row:hover { background: #292524; }

  /* Banding — visible warm alternation */
  :host([theme="dark"][row-banding]) .phz-data-row:nth-child(even) { background: #211E1B; }
  :host([theme="dark"][row-banding][hover-highlight]) .phz-data-row:nth-child(even):hover { background: #292524; }

  /* Pinned column backgrounds follow banding/hover */
  :host([theme="dark"][row-banding]) .phz-data-row:nth-child(even) .phz-data-cell--pinned-left,
  :host([theme="dark"][row-banding]) .phz-data-row:nth-child(even) .phz-data-cell--pinned-right { background: #211E1B; }
  :host([theme="dark"][hover-highlight]) .phz-data-row:hover .phz-data-cell--pinned-left,
  :host([theme="dark"][hover-highlight]) .phz-data-row:hover .phz-data-cell--pinned-right { background: #292524; }

  /* Selection — blue tint, high contrast */
  :host([theme="dark"]) .phz-data-row--selected { background: #172554 !important; }
  :host([theme="dark"]) .phz-data-row--selected:hover { background: #1E3A5F !important; }
  :host([theme="dark"]) .phz-data-row--selected .phz-data-cell { color: #BFDBFE; }
  :host([theme="dark"]) .phz-selection-bar { background: #172554; border-bottom: 1px solid #1E40AF; }
  :host([theme="dark"]) .phz-selection-bar__count { color: #93C5FD; }
  :host([theme="dark"]) .phz-selection-bar__btn--default { background: #1E3A5F; color: #93C5FD; border-color: #2563EB; }
  :host([theme="dark"]) .phz-selection-bar__btn--default:hover { background: #2563EB; color: #FFFFFF; }
  :host([theme="dark"]) .phz-selection-bar__btn--secondary { background: #292524; color: #A8A29E; border-color: #44403C; }
  :host([theme="dark"]) .phz-selection-bar__btn--secondary:hover { background: #44403C; color: #D6D3D1; }

  /* Footer & pagination — elevated surface */
  :host([theme="dark"]) .phz-footer { background: #211E1B; border-top: 1px solid #292524; }
  :host([theme="dark"]) .phz-footer__info { color: #78716C; }
  :host([theme="dark"]) .phz-page-btn { background: #292524; color: #A8A29E; border-color: #44403C; }
  :host([theme="dark"]) .phz-page-btn:not(:disabled):hover { background: #44403C; color: #D6D3D1; }
  :host([theme="dark"]) .phz-page-btn--active { background: #F5F5F4; color: #1C1917; }
  :host([theme="dark"]) .phz-page-btn--active:hover { background: #F5F5F4; }
  :host([theme="dark"]) .phz-page-btn:disabled { color: #44403C; }
  :host([theme="dark"]) .phz-page-size-select { background: #292524; color: #A8A29E; border-color: #44403C; }
  :host([theme="dark"]) .phz-pagination { border-color: #292524; }

  /* Dropdowns & panels — floating dark surfaces */
  :host([theme="dark"]) .phz-col-filter-dropdown { background: #292524; border-color: #44403C; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
  :host([theme="dark"]) .phz-col-filter-dropdown__item { color: #D6D3D1; }
  :host([theme="dark"]) .phz-col-filter-dropdown__item:hover { background: #44403C; color: #F5F5F4; }
  :host([theme="dark"]) .phz-col-panel { background: #292524; border-color: #44403C; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
  :host([theme="dark"]) .phz-col-panel__item { color: #D6D3D1; }
  :host([theme="dark"]) .phz-col-panel__export-btn { color: #D6D3D1; }
  :host([theme="dark"]) .phz-col-panel__export-btn:hover { background: rgba(59, 130, 246, 0.15); color: #93C5FD; }

  /* Cell editing */
  :host([theme="dark"]) .phz-cell-editor { background: #292524; color: #F5F5F4; border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.2); }

  /* Empty & loading states */
  :host([theme="dark"]) .phz-empty-state { color: #78716C; }
  :host([theme="dark"]) .phz-empty-state__icon { color: #44403C; }
  :host([theme="dark"]) .phz-loading-overlay { background: rgba(12, 10, 9, 0.75); }
  :host([theme="dark"]) .phz-loading-spinner { border-color: #44403C; border-top-color: #3B82F6; }
  :host([theme="dark"]) .phz-progress-bar { color: #A8A29E; border-top-color: #44403C; background: #1C1917; }
  :host([theme="dark"]) .phz-skeleton-shimmer { background: linear-gradient(90deg, #292524 25%, #44403C 50%, #292524 75%); background-size: 200% 100%; }

  /* Aggregation & groups */
  :host([theme="dark"]) .phz-aggregation-row { background: #211E1B; border-top: 1px solid #44403C; }
  :host([theme="dark"]) .phz-aggregation-row--top { border-bottom: 1px solid #44403C; background: #211E1B; }
  :host([theme="dark"]) .phz-aggregation-cell { color: #D6D3D1; font-weight: 500; }
  :host([theme="dark"]) .phz-group-row { background: #211E1B; border-bottom: 1px solid #292524; }
  :host([theme="dark"]) .phz-group-row:hover { background: #292524; }
  :host([theme="dark"]) .phz-group-cell { background: #211E1B; border-bottom-color: #44403C; }
  :host([theme="dark"]) .phz-group-col-header { background: #292524; color: #A8A29E; border-bottom-color: #44403C; }
  :host([theme="dark"]) .phz-group-col-cell { color: #A8A29E; border-bottom-color: #44403C; }
  :host([theme="dark"]) .phz-group-totals-row td { background: #211E1B; border-bottom-color: #44403C; color: #A8A29E; }
  :host([theme="dark"]) .phz-thead-row--group .phz-group-header-cell { color: #A8A29E; border-bottom-color: #44403C; border-right-color: #292524; }

  /* Interactive elements */
  :host([theme="dark"]) .phz-retry-btn { background: #292524; color: #A8A29E; border-color: #44403C; }
  :host([theme="dark"]) .phz-retry-btn:hover { background: #44403C; color: #D6D3D1; }
  :host([theme="dark"]) .phz-row-action-btn { border-color: #44403C; color: #57534E; }
  :host([theme="dark"]) .phz-row-action-btn:hover { border-color: #3B82F6; color: #3B82F6; background: rgba(59,130,246,0.08); }
  :host([theme="dark"]) .phz-checkbox { border-color: #57534E; }
  :host([theme="dark"]) .phz-checkbox:checked { border-color: #3B82F6; background: #3B82F6; }
  :host([theme="dark"]) .phz-activity-track { background: #44403C; }
  :host([theme="dark"]) .phz-export-option { color: #D6D3D1; }
  :host([theme="dark"]) .phz-export-option:hover { background: #44403C; color: #F5F5F4; }
  :host([theme="dark"]) .phz-toast { background: #292524; color: #F5F5F4; border: 1px solid #44403C; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
  :host([theme="dark"]) .phz-toast__close { color: rgba(245,245,244,0.5); }
  :host([theme="dark"]) .phz-toast__close:hover { color: #F5F5F4; }

  /* Pinned columns */
  :host([theme="dark"]) .phz-data-cell--pinned-left,
  :host([theme="dark"]) .phz-data-cell--pinned-right { background: #1C1917; }
  :host([theme="dark"]) .phz-header-cell--pinned-left,
  :host([theme="dark"]) .phz-header-cell--pinned-right { background: #292524; }
  :host([theme="dark"]) .phz-header-cell--pinned-last-left,
  :host([theme="dark"]) .phz-data-cell--pinned-last-left { box-shadow: 2px 0 8px rgba(0,0,0,0.3); }
  :host([theme="dark"]) .phz-header-cell--pinned-first-right,
  :host([theme="dark"]) .phz-data-cell--pinned-first-right { box-shadow: -2px 0 8px rgba(0,0,0,0.3); }
  :host([theme="dark"]) .phz-data-row--selected .phz-data-cell--pinned-left,
  :host([theme="dark"]) .phz-data-row--selected .phz-data-cell--pinned-right { background: #172554; }

  /* ── High Contrast (WCAG AAA) ── */
  :host([theme="high-contrast"]) {
    --phz-grid-text: #000000;
    --phz-grid-bg: #FFFFFF;
    --phz-header-text: #FFFFFF;
    --phz-header-bg: #000000;
    --phz-header-bar-bg: #000000;
    --phz-grid-line-color: #000000;
    --phz-banding-color: #F5F5F5;
    --phz-color-primary: #0000EE;
    color: #000000;
    background: #FFFFFF;
    box-shadow: 0 0 0 2px #000000;
    border-radius: 0;
  }
  :host([theme="high-contrast"]) .phz-grid__container { background: #FFFFFF; border-top: 2px solid #000000; }
  :host([theme="high-contrast"]) .phz-header-bar { background: #000000; color: #FFFFFF; border-bottom: 2px solid #000000; }
  :host([theme="high-contrast"]) .phz-header-bar__subtitle { color: #E5E5E5; }
  :host([theme="high-contrast"]) .phz-header-bar__records { color: #E5E5E5; }
  :host([theme="high-contrast"]) .phz-header-bar__dot { background: #FFFFFF; }
  :host([theme="high-contrast"]) .phz-thead-row { border-bottom: 2px solid #000000; }
  :host([theme="high-contrast"]) .phz-header-cell { color: #000000; font-weight: 700; }
  :host([theme="high-contrast"]) .phz-header-cell:hover { color: #000000; background: #E5E5E5; }
  :host([theme="high-contrast"]) .phz-data-row { border-bottom: 1px solid #000000; }
  :host([theme="high-contrast"]) .phz-data-cell { color: #000000; }
  :host([theme="high-contrast"]) .phz-data-cell--mono { color: #000000; }
  :host([theme="high-contrast"]) .phz-data-row:hover { background: #E5E5E5; }
  :host([theme="high-contrast"][hover-highlight]) .phz-data-row:hover { background: #E5E5E5; }
  :host([theme="high-contrast"][row-banding]) .phz-data-row:nth-child(even) { background: #F5F5F5; }
  :host([theme="high-contrast"]) .phz-data-row--selected { background: #BFDBFE !important; }
  :host([theme="high-contrast"]) .phz-data-row--selected:hover { background: #93C5FD !important; }
  :host([theme="high-contrast"]) .phz-selection-bar { background: #BFDBFE; border-bottom: 2px solid #000000; }
  :host([theme="high-contrast"]) .phz-selection-bar__count { color: #000000; }
  :host([theme="high-contrast"]) .phz-footer { background: #F5F5F5; border-top: 2px solid #000000; }
  :host([theme="high-contrast"]) .phz-footer__info { color: #000000; }
  :host([theme="high-contrast"]) .phz-pagination { border-color: #000000; }
  :host([theme="high-contrast"]) .phz-pagination__info { color: #000000; }
  :host([theme="high-contrast"]) .phz-pagination__btn { border-color: #000000; color: #000000; background: #FFFFFF; }
  :host([theme="high-contrast"]) .phz-pagination__btn:not(:disabled):hover { background: #E5E5E5; }
  :host([theme="high-contrast"]) .phz-pagination__btn:disabled { color: #A3A3A3; border-color: #A3A3A3; }
  :host([theme="high-contrast"]) .phz-pagination__page { background: #000000; color: #FFFFFF; }
  :host([theme="high-contrast"]) .phz-pagination__size { border-color: #000000; color: #000000; }
  :host([theme="high-contrast"]) .phz-page-btn { border-color: #000000; color: #000000; }
  :host([theme="high-contrast"]) .phz-page-btn:not(:disabled):hover { background: #E5E5E5; }
  :host([theme="high-contrast"]) .phz-page-btn--active { background: #000000; color: #FFFFFF; }
  :host([theme="high-contrast"]) .phz-col-filter-dropdown { background: #FFFFFF; border: 2px solid #000000; }
  :host([theme="high-contrast"]) .phz-col-panel { background: #FFFFFF; border: 2px solid #000000; }
  :host([theme="high-contrast"]) .phz-cell-editor { border: 2px solid #0000EE; }
  :host([theme="high-contrast"]) .phz-checkbox { border: 2px solid #000000; }
  :host([theme="high-contrast"]) .phz-checkbox--checked { border-color: #0000EE; background: #0000EE; }
  :host([theme="high-contrast"]) .phz-filter-btn { color: #000000; }

  /* ── Dark pagination overrides ── */
  :host([theme="dark"]) .phz-pagination { background: #211E1B; border-top: 1px solid #292524; }
  :host([theme="dark"]) .phz-pagination__info { color: #78716C; }
  :host([theme="dark"]) .phz-pagination__rows { color: #A8A29E; }
  :host([theme="dark"]) .phz-pagination__sep { color: #44403C; }
  :host([theme="dark"]) .phz-pagination__size-label { color: #78716C; }
  :host([theme="dark"]) .phz-pagination__btn { background: #292524; color: #A8A29E; border-color: #44403C; }
  :host([theme="dark"]) .phz-pagination__btn:not(:disabled):hover { background: #44403C; color: #D6D3D1; border-color: #57534E; }
  :host([theme="dark"]) .phz-pagination__btn:disabled { color: #44403C; background: transparent; border-color: #292524; }
  :host([theme="dark"]) .phz-pagination__size { background: #292524; color: #A8A29E; border-color: #44403C; }
  :host([theme="dark"]) .phz-pagination__page { background: #F5F5F4; color: #1C1917; }

  /* ── Auto Dark Mode (system preference) — mirrors theme="dark" ── */
  @media (prefers-color-scheme: dark) {
    :host(:not([theme])) {
      --phz-grid-text: #F5F5F4;
      --phz-grid-bg: #1C1917;
      --phz-header-text: #D6D3D1;
      --phz-header-bg: #292524;
      --phz-header-bar-bg: #0C0A09;
      --phz-grid-line-color: #44403C;
      --phz-banding-color: #211E1B;
      color: #F5F5F4;
      background: #1C1917;
      box-shadow: 0 10px 25px rgba(0,0,0,0.25), 0 4px 10px rgba(0,0,0,0.15);
    }
    :host(:not([theme])) .phz-grid__container { background: #1C1917; border-top: 1px solid #292524; }
    :host(:not([theme])) .phz-grid__container::-webkit-scrollbar-thumb { background: #57534E; border-radius: 4px; }
    :host(:not([theme])) .phz-grid__container::-webkit-scrollbar-thumb:hover { background: #78716C; }
    :host(:not([theme])) .phz-header-bar { background: #0C0A09; border-bottom: 1px solid #292524; }
    :host(:not([theme])) .phz-thead-row { border-bottom: 1px solid #44403C; }
    :host(:not([theme])) .phz-header-cell { color: #A8A29E; }
    :host(:not([theme])) .phz-header-cell:hover { color: #F5F5F4; background: rgba(255,255,255,0.03); }
    :host(:not([theme])) .phz-data-row { border-bottom: 1px solid #292524; }
    :host(:not([theme])) .phz-data-cell { color: #D6D3D1; }
    :host(:not([theme])) .phz-data-cell--mono { color: #A8A29E; font-variant-numeric: tabular-nums; }
    :host(:not([theme])) .phz-data-row:hover { background: rgba(255,255,255,0.03); }
    :host(:not([theme])[hover-highlight]) .phz-data-row:hover { background: #292524; }
    :host(:not([theme])[row-banding]) .phz-data-row:nth-child(even) { background: #211E1B; }
    :host(:not([theme])[row-banding][hover-highlight]) .phz-data-row:nth-child(even):hover { background: #292524; }
    :host(:not([theme])[row-banding]) .phz-data-row:nth-child(even) .phz-data-cell--pinned-left,
    :host(:not([theme])[row-banding]) .phz-data-row:nth-child(even) .phz-data-cell--pinned-right { background: #211E1B; }
    :host(:not([theme])[hover-highlight]) .phz-data-row:hover .phz-data-cell--pinned-left,
    :host(:not([theme])[hover-highlight]) .phz-data-row:hover .phz-data-cell--pinned-right { background: #292524; }
    :host(:not([theme])) .phz-data-row--selected { background: #172554 !important; }
    :host(:not([theme])) .phz-data-row--selected:hover { background: #1E3A5F !important; }
    :host(:not([theme])) .phz-data-row--selected .phz-data-cell { color: #BFDBFE; }
    :host(:not([theme])) .phz-selection-bar { background: #172554; border-bottom: 1px solid #1E40AF; }
    :host(:not([theme])) .phz-selection-bar__count { color: #93C5FD; }
    :host(:not([theme])) .phz-selection-bar__btn--default { background: #1E3A5F; color: #93C5FD; border-color: #2563EB; }
    :host(:not([theme])) .phz-selection-bar__btn--secondary { background: #292524; color: #A8A29E; border-color: #44403C; }
    :host(:not([theme])) .phz-footer { background: #211E1B; border-top: 1px solid #292524; }
    :host(:not([theme])) .phz-footer__info { color: #78716C; }
    :host(:not([theme])) .phz-page-btn { background: #292524; color: #A8A29E; border-color: #44403C; }
    :host(:not([theme])) .phz-page-btn:not(:disabled):hover { background: #44403C; color: #D6D3D1; }
    :host(:not([theme])) .phz-page-btn--active { background: #F5F5F4; color: #1C1917; }
    :host(:not([theme])) .phz-page-btn--active:hover { background: #F5F5F4; }
    :host(:not([theme])) .phz-page-btn:disabled { color: #44403C; }
    :host(:not([theme])) .phz-page-size-select { background: #292524; color: #A8A29E; border-color: #44403C; }
    :host(:not([theme])) .phz-pagination { border-color: #292524; }
    :host(:not([theme])) .phz-col-filter-dropdown { background: #292524; border-color: #44403C; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
    :host(:not([theme])) .phz-col-filter-dropdown__item { color: #D6D3D1; }
    :host(:not([theme])) .phz-col-filter-dropdown__item:hover { background: #44403C; color: #F5F5F4; }
    :host(:not([theme])) .phz-col-panel { background: #292524; border-color: #44403C; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
    :host(:not([theme])) .phz-col-panel__item { color: #D6D3D1; }
    :host(:not([theme])) .phz-col-panel__export-btn { color: #D6D3D1; }
    :host(:not([theme])) .phz-col-panel__export-btn:hover { background: rgba(59, 130, 246, 0.15); color: #93C5FD; }
    :host(:not([theme])) .phz-cell-editor { background: #292524; color: #F5F5F4; border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.2); }
    :host(:not([theme])) .phz-empty-state { color: #78716C; }
    :host(:not([theme])) .phz-empty-state__icon { color: #44403C; }
    :host(:not([theme])) .phz-loading-overlay { background: rgba(12, 10, 9, 0.75); }
    :host(:not([theme])) .phz-loading-spinner { border-color: #44403C; border-top-color: #3B82F6; }
    :host(:not([theme])) .phz-progress-bar { color: #A8A29E; border-top-color: #44403C; background: #1C1917; }
    :host(:not([theme])) .phz-skeleton-shimmer { background: linear-gradient(90deg, #292524 25%, #44403C 50%, #292524 75%); background-size: 200% 100%; }
    :host(:not([theme])) .phz-aggregation-row { background: #211E1B; border-top: 1px solid #44403C; }
    :host(:not([theme])) .phz-aggregation-row--top { border-bottom: 1px solid #44403C; background: #211E1B; }
    :host(:not([theme])) .phz-aggregation-cell { color: #D6D3D1; font-weight: 500; }
    :host(:not([theme])) .phz-group-row { background: #211E1B; border-bottom: 1px solid #292524; }
    :host(:not([theme])) .phz-group-row:hover { background: #292524; }
    :host(:not([theme])) .phz-group-cell { background: #211E1B; border-bottom-color: #44403C; }
    :host(:not([theme])) .phz-group-col-header { background: #292524; color: #A8A29E; border-bottom-color: #44403C; }
    :host(:not([theme])) .phz-group-col-cell { color: #A8A29E; border-bottom-color: #44403C; }
    :host(:not([theme])) .phz-group-totals-row td { background: #211E1B; border-bottom-color: #44403C; color: #A8A29E; }
    :host(:not([theme])) .phz-thead-row--group .phz-group-header-cell { color: #A8A29E; border-bottom-color: #44403C; border-right-color: #292524; }
    :host(:not([theme])) .phz-retry-btn { background: #292524; color: #A8A29E; border-color: #44403C; }
    :host(:not([theme])) .phz-retry-btn:hover { background: #44403C; color: #D6D3D1; }
    :host(:not([theme])) .phz-row-action-btn { border-color: #44403C; color: #57534E; }
    :host(:not([theme])) .phz-row-action-btn:hover { border-color: #3B82F6; color: #3B82F6; background: rgba(59,130,246,0.08); }
    :host(:not([theme])) .phz-checkbox { border-color: #57534E; }
    :host(:not([theme])) .phz-activity-track { background: #44403C; }
    :host(:not([theme])) .phz-export-option { color: #D6D3D1; }
    :host(:not([theme])) .phz-export-option:hover { background: #44403C; color: #F5F5F4; }
    :host(:not([theme])) .phz-toast { background: #292524; color: #F5F5F4; border: 1px solid #44403C; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
    :host(:not([theme])) .phz-data-cell--pinned-left,
    :host(:not([theme])) .phz-data-cell--pinned-right { background: #1C1917; }
    :host(:not([theme])) .phz-header-cell--pinned-left,
    :host(:not([theme])) .phz-header-cell--pinned-right { background: #292524; }
    :host(:not([theme])) .phz-header-cell--pinned-last-left,
    :host(:not([theme])) .phz-data-cell--pinned-last-left { box-shadow: 2px 0 8px rgba(0,0,0,0.3); }
    :host(:not([theme])) .phz-header-cell--pinned-first-right,
    :host(:not([theme])) .phz-data-cell--pinned-first-right { box-shadow: -2px 0 8px rgba(0,0,0,0.3); }
    :host(:not([theme])) .phz-data-row--selected .phz-data-cell--pinned-left,
    :host(:not([theme])) .phz-data-row--selected .phz-data-cell--pinned-right { background: #172554; }
  }

  /* ── Summary / Totals Row ── */
  .phz-summary-row {
    position: sticky;
    bottom: 0;
    z-index: 2;
  }
  .phz-summary-row td {
    background: var(--phz-summary-bg, var(--phz-bg-surface, #f8fafc));
    color: var(--phz-summary-text, var(--phz-text-primary, #1e293b));
    font-weight: var(--phz-summary-font-weight, 600);
    border-top: 2px solid var(--phz-border-default, #e2e8f0);
    padding: var(--_cell-padding, 8px 12px);
    font-size: inherit;
  }
  .phz-summary-label {
    color: var(--phz-text-secondary, #64748b);
    font-weight: 400;
    margin-right: 8px;
  }

  /* ── Mobile Responsive ── */
  @media (max-width: 576px) {
    .phz-header-cell:first-child,
    .phz-data-cell:first-child {
      position: sticky;
      left: 0;
      z-index: 2;
      background: inherit;
    }

    :host([density="comfortable"]) {
      --_row-height: var(--phz-row-height-compact, 42px);
      --_cell-padding: 8px 12px;
      --_cell-overflow: hidden;
      --_cell-white-space: nowrap;
      --_cell-text-overflow: ellipsis;
    }
  }
`;
//# sourceMappingURL=phz-grid.styles.js.map