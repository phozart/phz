/**
 * @phozart/phz-criteria — Criteria Bar
 *
 * Compact horizontal bar showing: "Filters" button with count badge,
 * pinned filter tags, active filter summary tags, and "Clear all".
 *
 * Supports two mutually exclusive bar modes via FilterBarLayout.barMode:
 * - 'button' (default): Filters button with badge, tags, clear all
 * - 'summary': Clickable text summary of active filters, opens drawer on click
 *
 * Button mode layout options:
 * - barDisplayMode: full (tags visible) or compact (button only)
 * - buttonContent: icon-only, icon-text, text-only
 * - buttonLabel: custom text (default "Filters")
 * - buttonBgColor / buttonTextColor: button colors
 * - containerBgColor / containerBorderColor: bar container colors
 * - buttonOnly: hide the container, show only the button
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { CriteriaConfig, SelectionContext, SelectionFieldDef, FilterBarLayout, SummaryStripLayout } from '@phozart/phz-core';
import { criteriaStyles } from '../shared-styles.js';

const iconFilter = html`<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1.75 3h10.5M3.5 7h7M5.25 11h3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
const iconX = html`<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2.5 2.5l5 5M7.5 2.5l-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;

const SHADOW_MAP: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px rgba(28,25,23,0.06)',
  md: '0 2px 8px rgba(28,25,23,0.1), 0 1px 3px rgba(28,25,23,0.06)',
  lg: '0 4px 16px rgba(28,25,23,0.12), 0 2px 6px rgba(28,25,23,0.08)',
};

@customElement('phz-criteria-bar')
export class PhzCriteriaBar extends LitElement {
  static styles = [criteriaStyles, css`
    :host { display: block; container-type: inline-size; }

    .phz-sc-bar--button-only {
      display: inline-flex;
    }

    @container (max-width: 575px) {
      .phz-sc-bar {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
      }
      .phz-sc-bar-tag {
        font-size: 12px;
      }
    }
  `];

  @property({ type: Object }) config: CriteriaConfig = { fields: [] };
  @property({ type: Object }) selectionContext: SelectionContext = {};
  @property({ type: Object }) layout: FilterBarLayout = {};

  private get _ly(): Required<FilterBarLayout> {
    const ly = this.layout ?? {};
    return {
      barMode: ly.barMode ?? 'button',
      barDisplayMode: ly.barDisplayMode ?? 'full',
      buttonContent: ly.buttonContent ?? 'icon-text',
      buttonLabel: ly.buttonLabel ?? 'Filters',
      buttonBgColor: ly.buttonBgColor ?? '#1C1917',
      buttonTextColor: ly.buttonTextColor ?? '#FFFFFF',
      containerBgColor: ly.containerBgColor ?? '#FFFFFF',
      containerBorderColor: ly.containerBorderColor ?? '#E7E5E4',
      containerBorderRadius: ly.containerBorderRadius ?? 10,
      containerShadow: ly.containerShadow ?? 'none',
      buttonOnly: ly.buttonOnly ?? false,
      showSummaryStrip: ly.showSummaryStrip ?? true,
      summaryStrip: ly.summaryStrip ?? {},
      summaryPlaceholder: ly.summaryPlaceholder ?? 'No filters applied',
    };
  }

  private _getActiveFields(): SelectionFieldDef[] {
    return this.config.fields.filter(f => {
      const v = this.selectionContext[f.id];
      if (v === null || v === undefined) return false;
      if (Array.isArray(v) && v.length === 0) return false;
      if (typeof v === 'string' && v === '') return false;
      return true;
    });
  }

  private _getPinnedFields(): SelectionFieldDef[] {
    return this.config.fields.filter(f => f.barConfig?.pinnedToBar);
  }

  private _formatValue(field: SelectionFieldDef): string {
    const v = this.selectionContext[field.id];
    if (v === null || v === undefined) return '';
    if (Array.isArray(v)) {
      if (v.length === 0) return '';
      if (v.length === 1) {
        const opt = field.options?.find(o => o.value === v[0]);
        return opt?.label ?? v[0];
      }
      return `${v.length} selected`;
    }
    if (typeof v === 'string') {
      const opt = field.options?.find(o => o.value === v);
      return opt?.label ?? v;
    }
    return String(v);
  }

  private _openDrawer() {
    this.dispatchEvent(new CustomEvent('bar-open-drawer', {
      bubbles: true, composed: true,
    }));
  }

  private _clearAll() {
    this.dispatchEvent(new CustomEvent('bar-clear-all', {
      bubbles: true, composed: true,
    }));
  }

  private _removeFilter(fieldId: string) {
    this.dispatchEvent(new CustomEvent('bar-remove-filter', {
      detail: { fieldId },
      bubbles: true, composed: true,
    }));
  }

  private _getSummaryFields(): SelectionFieldDef[] {
    return this.config.fields.filter(f => f.barConfig?.showOnSummary);
  }

  private _buildSummaryText(): string {
    const summaryFields = this._getSummaryFields();
    const parts: string[] = [];
    for (const field of summaryFields) {
      const val = this._formatValue(field);
      if (val) {
        parts.push(`${field.label}: ${val}`);
      }
    }
    return parts.join(' \u2022 ');
  }

  private _getSL(): Required<SummaryStripLayout> {
    const sl = this._ly.summaryStrip as SummaryStripLayout;
    return {
      bgColor: sl.bgColor ?? '#FAFAF9',
      textColor: sl.textColor ?? '#78716C',
      borderColor: sl.borderColor ?? '#E7E5E4',
      borderRadius: sl.borderRadius ?? 8,
      activeBgColor: sl.activeBgColor ?? '#EFF6FF',
      activeTextColor: sl.activeTextColor ?? '#1D4ED8',
      activeBorderColor: sl.activeBorderColor ?? '#2563EB',
    };
  }

  private _renderSummaryBar() {
    const sl = this._getSL();
    const summaryText = this._buildSummaryText();
    const hasActive = summaryText.length > 0;
    const displayText = hasActive ? summaryText : this._ly.summaryPlaceholder;

    const bg = hasActive ? sl.activeBgColor : sl.bgColor;
    const text = hasActive ? sl.activeTextColor : sl.textColor;
    const border = hasActive ? sl.activeBorderColor : sl.borderColor;

    const barStyle = `background:${bg}; color:${text}; border:1px solid ${border}; border-radius:${sl.borderRadius}px; padding:8px 12px; cursor:pointer; display:flex; align-items:center; gap:8px; font-size:13px; line-height:1.4; transition:all 0.15s ease;`;

    return html`
      <div class="phz-sc-summary-bar" style=${barStyle} @click=${this._openDrawer} role="button" tabindex="0"
        @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._openDrawer(); } }}>
        <span style="flex-shrink:0; display:flex; align-items:center; opacity:0.7">${iconFilter}</span>
        <span style="flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${displayText}</span>
        ${hasActive ? html`
          <button class="phz-sc-bar-clear" style="flex-shrink:0; margin-left:auto"
            @click=${(e: Event) => { e.stopPropagation(); this._clearAll(); }}>Clear all</button>
        ` : nothing}
      </div>
    `;
  }

  private _renderFilterButton(activeCount: number) {
    const ly = this._ly;
    const btnStyle = `background:${ly.buttonBgColor}; color:${ly.buttonTextColor}; border-color:${ly.buttonBgColor};`;

    return html`
      <button class="phz-sc-bar-filters-btn" style=${btnStyle} @click=${this._openDrawer}>
        ${ly.buttonContent !== 'text-only' ? iconFilter : nothing}
        ${ly.buttonContent !== 'icon-only' ? ly.buttonLabel : nothing}
        ${activeCount > 0 ? html`<span class="phz-sc-bar-badge">${activeCount}</span>` : nothing}
      </button>
    `;
  }

  render() {
    const ly = this._ly;

    // Summary bar mode: render clickable summary strip
    if (ly.barMode === 'summary') {
      return this._renderSummaryBar();
    }

    const activeFields = this._getActiveFields();
    const pinnedFields = this._getPinnedFields();
    const activeCount = activeFields.length;

    // Merge pinned + active, avoid duplicates
    const pinnedIds = new Set(pinnedFields.map(f => f.id));
    const nonPinnedActive = activeFields.filter(f => !pinnedIds.has(f.id));
    const tagsToShow = [...pinnedFields.filter(f => activeFields.some(a => a.id === f.id)), ...nonPinnedActive];

    const isCompact = ly.barDisplayMode === 'compact';

    // Button-only mode: no container, just the button
    if (ly.buttonOnly) {
      return html`
        <div class="phz-sc-bar--button-only">
          ${this._renderFilterButton(activeCount)}
        </div>
      `;
    }

    // Container styles from layout
    const shadow = SHADOW_MAP[ly.containerShadow] ?? 'none';
    const containerStyle = `background:${ly.containerBgColor}; border-color:${ly.containerBorderColor || 'transparent'}; border-radius:${ly.containerBorderRadius}px; box-shadow:${shadow};`;

    return html`
      <div class="phz-sc-bar" style=${containerStyle}>
        ${this._renderFilterButton(activeCount)}

        ${!isCompact && tagsToShow.length > 0 ? html`<span class="phz-sc-bar-sep"></span>` : nothing}

        ${!isCompact ? tagsToShow.map(f => html`
          <span class="phz-sc-bar-tag">
            <span class="phz-sc-bar-tag-label">${f.label}:</span>
            <span class="phz-sc-bar-tag-value">${this._formatValue(f)}</span>
            ${!f.locked ? html`
              <button class="phz-sc-bar-tag-remove" @click=${() => this._removeFilter(f.id)} aria-label="Remove ${f.label} filter">
                ${iconX}
              </button>
            ` : nothing}
          </span>
        `) : nothing}

        ${!isCompact && activeCount > 0 ? html`
          <button class="phz-sc-bar-clear" @click=${this._clearAll}>Clear all</button>
        ` : nothing}
      </div>
    `;
  }
}
