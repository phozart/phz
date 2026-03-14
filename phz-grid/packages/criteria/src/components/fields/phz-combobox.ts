/**
 * @phozart/criteria — Combobox
 *
 * General-purpose autocomplete combobox. Drop-in replacement for native
 * <select> elements with type-to-filter capability.
 *
 * WAI-ARIA combobox pattern: role="combobox", aria-expanded,
 * aria-activedescendant, role="listbox", role="option", aria-selected.
 *
 * CSS prefix: phz-cb- (self-contained Shadow DOM, no shared-styles dependency).
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

export interface ComboboxOption {
  value: string;
  label: string;
}

/* ── Headless utility functions ── */

/** Filter options by case-insensitive substring match on label or value. */
export function filterComboboxOptions(
  options: ComboboxOption[],
  query: string,
  allowEmpty: boolean,
  emptyLabel: string,
): ComboboxOption[] {
  const base: ComboboxOption[] = allowEmpty
    ? [{ value: '', label: emptyLabel }, ...options]
    : options;

  if (!query) return base;

  const q = query.toLowerCase();
  return base.filter(
    o => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
  );
}

/** Resolve display label for a given value. */
export function resolveComboboxLabel(
  options: ComboboxOption[],
  value: string,
  emptyLabel: string,
  placeholder: string,
): string {
  if (value === '') return emptyLabel || placeholder;
  const match = options.find(o => o.value === value);
  return match ? match.label : value;
}

/* ── Chevron SVG ── */

const chevronSvg = html`<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

@customElement('phz-combobox')
export class PhzCombobox extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: relative;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      box-sizing: border-box;
    }

    *, *::before, *::after { box-sizing: inherit; }

    .phz-cb-trigger {
      display: flex;
      align-items: center;
      gap: 4px;
      width: 100%;
      padding: 6px 28px 6px 10px;
      border: 1px solid #D6D3D1;
      border-radius: 8px;
      font-size: 13px;
      color: #1C1917;
      background: #FFFFFF;
      cursor: pointer;
      outline: none;
      font-family: inherit;
      text-align: left;
      position: relative;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      transition: border-color 0.15s;
    }

    .phz-cb-trigger:focus {
      border-color: #2563EB;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .phz-cb-trigger:disabled {
      background: #F5F5F4;
      color: #A8A29E;
      cursor: not-allowed;
    }

    .phz-cb-trigger--placeholder { color: #A8A29E; }

    .phz-cb-chevron {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      color: #78716C;
      pointer-events: none;
      display: flex;
      align-items: center;
      transition: transform 0.2s;
    }

    .phz-cb-chevron--open { transform: translateY(-50%) rotate(180deg); }

    /* Dropdown panel */
    .phz-cb-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin-top: 4px;
      z-index: 100;
      background: #FFFFFF;
      border: 1px solid #E7E5E4;
      border-radius: 12px;
      box-shadow: 0 4px 8px rgba(28, 25, 23, 0.08), 0 2px 4px rgba(28, 25, 23, 0.04);
      max-height: 280px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .phz-cb-search {
      padding: 8px;
      border-bottom: 1px solid #E7E5E4;
      flex-shrink: 0;
    }

    .phz-cb-search input {
      width: 100%;
      padding: 6px 10px;
      border: 1px solid #D6D3D1;
      border-radius: 8px;
      font-size: 13px;
      color: #1C1917;
      background: #FFFFFF;
      outline: none;
      font-family: inherit;
      transition: border-color 0.15s;
    }

    .phz-cb-search input:focus {
      border-color: #2563EB;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .phz-cb-search input::placeholder { color: #A8A29E; }

    .phz-cb-list {
      overflow-y: auto;
      max-height: 240px;
      padding: 4px;
    }

    .phz-cb-option {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      font-size: 13px;
      cursor: pointer;
      color: #1C1917;
      border-radius: 8px;
      transition: background 0.1s;
    }

    .phz-cb-option:hover { background: #F5F5F4; }

    .phz-cb-option--highlight { background: #F5F5F4; }

    .phz-cb-option--selected { background: #EFF6FF; color: #1D4ED8; }

    .phz-cb-option--selected.phz-cb-option--highlight { background: #DBEAFE; }

    .phz-cb-empty {
      padding: 12px;
      text-align: center;
      font-size: 12px;
      color: #A8A29E;
    }

    /* Forced colors */
    @media (forced-colors: active) {
      .phz-cb-trigger { border: 1px solid ButtonText; }
      .phz-cb-trigger:focus { outline: 2px solid Highlight; }
      .phz-cb-dropdown { border: 1px solid ButtonText; }
      .phz-cb-option--highlight { outline: 2px solid Highlight; }
      .phz-cb-option--selected { background: Highlight; color: HighlightText; }
    }

    @media (prefers-reduced-motion: reduce) {
      .phz-cb-chevron { transition: none; }
      .phz-cb-trigger { transition: none; }
    }
  `;

  @property({ type: Array }) options: ComboboxOption[] = [];
  @property() value = '';
  @property() placeholder = '\u2014 Select \u2014';
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean, attribute: 'allow-empty' }) allowEmpty = true;
  @property({ attribute: 'empty-label' }) emptyLabel = '\u2014 None \u2014';

  @state() private _open = false;
  @state() private _query = '';
  @state() private _highlightIndex = -1;

  private get _filteredOptions(): ComboboxOption[] {
    return filterComboboxOptions(this.options, this._query, this.allowEmpty, this.emptyLabel);
  }

  private get _displayLabel(): string {
    return resolveComboboxLabel(this.options, this.value, this.allowEmpty ? this.emptyLabel : '', this.placeholder);
  }

  private _open_dropdown() {
    if (this.disabled) return;
    this._open = true;
    this._query = '';
    this._highlightIndex = -1;
    // Focus the search input after render
    this.updateComplete.then(() => {
      const input = this.shadowRoot?.querySelector<HTMLInputElement>('.phz-cb-search input');
      input?.focus();
    });
  }

  private _close() {
    this._open = false;
    this._query = '';
    this._highlightIndex = -1;
  }

  private _selectOption(opt: ComboboxOption) {
    this._close();
    this.dispatchEvent(new CustomEvent('combobox-change', {
      detail: { value: opt.value },
      bubbles: true,
      composed: true,
    }));
  }

  private _onTriggerClick() {
    if (this._open) {
      this._close();
    } else {
      this._open_dropdown();
    }
  }

  private _onTriggerKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!this._open) this._open_dropdown();
    } else if (e.key === 'Escape') {
      this._close();
    }
  }

  private _onSearchInput(e: Event) {
    this._query = (e.target as HTMLInputElement).value;
    this._highlightIndex = -1;
  }

  private _onSearchKeydown(e: KeyboardEvent) {
    const opts = this._filteredOptions;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this._highlightIndex = Math.min(this._highlightIndex + 1, opts.length - 1);
        this._scrollHighlightIntoView();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this._highlightIndex = Math.max(this._highlightIndex - 1, 0);
        this._scrollHighlightIntoView();
        break;
      case 'Enter':
        e.preventDefault();
        if (this._highlightIndex >= 0 && this._highlightIndex < opts.length) {
          this._selectOption(opts[this._highlightIndex]);
        }
        break;
      case 'Tab':
        if (this._highlightIndex >= 0 && this._highlightIndex < opts.length) {
          this._selectOption(opts[this._highlightIndex]);
        } else {
          this._close();
        }
        break;
      case 'Escape':
        e.preventDefault();
        this._close();
        // Return focus to trigger
        this.updateComplete.then(() => {
          this.shadowRoot?.querySelector<HTMLButtonElement>('.phz-cb-trigger')?.focus();
        });
        break;
    }
  }

  private _scrollHighlightIntoView() {
    this.updateComplete.then(() => {
      const highlighted = this.shadowRoot?.querySelector('.phz-cb-option--highlight');
      highlighted?.scrollIntoView({ block: 'nearest' });
    });
  }

  private _onClickOutside = (e: MouseEvent) => {
    // composedPath() for Shadow DOM
    const path = e.composedPath();
    if (!path.includes(this)) {
      this._close();
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('click', this._onClickOutside, true);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this._onClickOutside, true);
  }

  render() {
    const isPlaceholder = this.value === '' && !this.allowEmpty;
    const opts = this._filteredOptions;
    const listboxId = 'phz-cb-listbox';

    return html`
      <button
        class="phz-cb-trigger ${isPlaceholder ? 'phz-cb-trigger--placeholder' : ''}"
        ?disabled=${this.disabled}
        role="combobox"
        aria-expanded=${this._open}
        aria-haspopup="listbox"
        aria-controls=${this._open ? listboxId : nothing}
        @click=${this._onTriggerClick}
        @keydown=${this._onTriggerKeydown}
      >${this._displayLabel}<span class="phz-cb-chevron ${this._open ? 'phz-cb-chevron--open' : ''}" aria-hidden="true">${chevronSvg}</span></button>
      ${this._open ? html`
        <div class="phz-cb-dropdown">
          <div class="phz-cb-search">
            <input
              type="text"
              .value=${this._query}
              placeholder="Type to filter..."
              aria-label="Filter options"
              aria-autocomplete="list"
              aria-controls=${listboxId}
              aria-activedescendant=${this._highlightIndex >= 0 ? `phz-cb-opt-${this._highlightIndex}` : nothing}
              @input=${this._onSearchInput}
              @keydown=${this._onSearchKeydown}
            />
          </div>
          <div class="phz-cb-list" role="listbox" id=${listboxId}>
            ${opts.length === 0
              ? html`<div class="phz-cb-empty">No matching options</div>`
              : opts.map((opt, i) => html`
                <div
                  id="phz-cb-opt-${i}"
                  class="phz-cb-option
                    ${i === this._highlightIndex ? 'phz-cb-option--highlight' : ''}
                    ${opt.value === this.value ? 'phz-cb-option--selected' : ''}"
                  role="option"
                  aria-selected=${opt.value === this.value}
                  @click=${() => this._selectOption(opt)}
                  @mouseenter=${() => { this._highlightIndex = i; }}
                >${opt.label}</div>
              `)
            }
          </div>
        </div>
      ` : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'phz-combobox': PhzCombobox; }
}
