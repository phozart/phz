/**
 * @phozart/phz-criteria — Searchable Dropdown
 *
 * Text input + dropdown with type-ahead, debounced filtering.
 * WAI-ARIA combobox pattern.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { criteriaStyles } from '../../shared-styles.js';
/** Filter search options respecting matchMode and multiValue config. */
export function filterSearchOptions(options, query, config) {
    const minChars = config.minChars ?? 1;
    if (query.length < minChars)
        return [];
    const max = config.maxSuggestions ?? 20;
    const matchMode = config.matchMode ?? 'contains';
    const multi = config.multiValue ?? false;
    const matchFn = matchMode === 'beginsWith'
        ? (text, q) => text.startsWith(q)
        : (text, q) => text.includes(q);
    const tokens = multi
        ? query.toLowerCase().split(/\s+/).filter(Boolean)
        : [query.toLowerCase()];
    // minChars applies to each token when multiValue is on
    const validTokens = tokens.filter(t => t.length >= minChars);
    if (validTokens.length === 0)
        return [];
    return options
        .filter(o => {
        const label = o.label.toLowerCase();
        return validTokens.some(t => matchFn(label, t));
    })
        .slice(0, max);
}
let PhzSearchableDropdown = class PhzSearchableDropdown extends LitElement {
    constructor() {
        super(...arguments);
        this.options = [];
        this.config = {};
        this.value = '';
        this.disabled = false;
        this._query = '';
        this._open = false;
        this._highlightIndex = -1;
        this._debounceTimer = null;
    }
    static { this.styles = [criteriaStyles, css `
    :host { position: relative; }
    .phz-sc-sd-popup { position: absolute; top: 100%; left: 0; right: 0; margin-top: 4px; }
    .phz-sc-sd-empty { padding: 12px; text-align: center; font-size: 12px; color: #A8A29E; }
  `]; }
    get _filteredOptions() {
        return filterSearchOptions(this.options, this._query, this.config);
    }
    _onInput(e) {
        const input = e.target;
        const query = input.value;
        if (this._debounceTimer)
            clearTimeout(this._debounceTimer);
        const delay = this.config.debounceMs ?? 200;
        this._debounceTimer = setTimeout(() => {
            this._query = query;
            this._open = this._filteredOptions.length > 0;
            this._highlightIndex = -1;
        }, delay);
    }
    _onKeydown(e) {
        const opts = this._filteredOptions;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this._highlightIndex = Math.min(this._highlightIndex + 1, opts.length - 1);
        }
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this._highlightIndex = Math.max(this._highlightIndex - 1, 0);
        }
        else if (e.key === 'Enter') {
            e.preventDefault();
            if (this._highlightIndex >= 0) {
                this._selectOption(opts[this._highlightIndex]);
            }
            else if (this.config.multiValue) {
                this._emitRawQuery();
            }
        }
        else if (e.key === 'Escape') {
            this._open = false;
        }
    }
    _selectOption(opt) {
        this._open = false;
        this._query = opt.label;
        this.dispatchEvent(new CustomEvent('search-select', {
            detail: { value: opt.value }, bubbles: true, composed: true,
        }));
    }
    _onFocus() {
        if (this._filteredOptions.length > 0)
            this._open = true;
    }
    _onBlur() {
        // Delay to allow click on option
        setTimeout(() => {
            this._open = false;
            if (this.config.multiValue) {
                this._emitRawQuery();
            }
        }, 200);
    }
    /** Emit the raw query text as the value (for multiValue free-text mode). */
    _emitRawQuery() {
        const raw = this._query.trim();
        if (!raw)
            return;
        this._open = false;
        this.dispatchEvent(new CustomEvent('search-select', {
            detail: { value: raw }, bubbles: true, composed: true,
        }));
    }
    render() {
        const opts = this._filteredOptions;
        const placeholder = this.config.multiValue ? 'Search (space-separated)...' : 'Search...';
        return html `
      <div role="combobox" aria-expanded=${this._open} aria-haspopup="listbox">
        <input
          class="phz-sc-input"
          type="text"
          .value=${this._query || this.value}
          ?disabled=${this.disabled}
          placeholder=${placeholder}
          @input=${this._onInput}
          @keydown=${this._onKeydown}
          @focus=${this._onFocus}
          @blur=${this._onBlur}
          role="searchbox"
          aria-autocomplete="list"
          style="width: 100%"
        />
        ${this._open && opts.length > 0 ? html `
          <div class="phz-sc-dropdown phz-sc-sd-popup" role="listbox">
            ${opts.map((opt, i) => html `
              <div
                class="phz-sc-dropdown-item ${i === this._highlightIndex ? 'phz-sc-dropdown-item--selected' : ''}"
                role="option"
                aria-selected=${i === this._highlightIndex}
                @mousedown=${() => this._selectOption(opt)}
              >${opt.label}</div>
            `)}
          </div>
        ` : nothing}
        ${this._open && opts.length === 0 && this._query.length >= (this.config.minChars ?? 1) ? html `
          <div class="phz-sc-dropdown phz-sc-sd-popup">
            <div class="phz-sc-sd-empty">No results found</div>
          </div>
        ` : nothing}
      </div>
    `;
    }
};
__decorate([
    property({ type: Array })
], PhzSearchableDropdown.prototype, "options", void 0);
__decorate([
    property({ type: Object })
], PhzSearchableDropdown.prototype, "config", void 0);
__decorate([
    property({ type: String })
], PhzSearchableDropdown.prototype, "value", void 0);
__decorate([
    property({ type: Boolean })
], PhzSearchableDropdown.prototype, "disabled", void 0);
__decorate([
    state()
], PhzSearchableDropdown.prototype, "_query", void 0);
__decorate([
    state()
], PhzSearchableDropdown.prototype, "_open", void 0);
__decorate([
    state()
], PhzSearchableDropdown.prototype, "_highlightIndex", void 0);
PhzSearchableDropdown = __decorate([
    customElement('phz-searchable-dropdown')
], PhzSearchableDropdown);
export { PhzSearchableDropdown };
//# sourceMappingURL=phz-searchable-dropdown.js.map