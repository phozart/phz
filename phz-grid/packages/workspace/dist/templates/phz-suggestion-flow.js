/**
 * @phozart/phz-workspace — Suggestion Flow
 *
 * End-to-end pipeline: schema -> profile -> match -> ranked suggestions.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import { analyzeSchema } from './schema-analyzer.js';
import { matchTemplates } from './template-matcher.js';
export function buildSuggestionPipeline(schema, templates) {
    const profile = analyzeSchema(schema);
    const scored = matchTemplates(profile, templates);
    return scored.map(s => ({ ...s, profile }));
}
// --- Lit Component ---
let PhzSuggestionFlow = class PhzSuggestionFlow extends LitElement {
    constructor() {
        super(...arguments);
        this.templates = [];
    }
    static { this.styles = css `
    :host { display: block; }
    .suggestion { padding: 12px; border: 1px solid var(--phz-border-color, #e0e0e0); border-radius: 8px; margin-bottom: 8px; cursor: pointer; }
    .suggestion:hover { border-color: var(--phz-accent-color, #1976d2); }
    .score { font-size: 0.8em; color: var(--phz-text-secondary, #666); }
  `; }
    render() {
        if (!this.schema)
            return html `<p>Select a data source to see suggestions.</p>`;
        const suggestions = buildSuggestionPipeline(this.schema, this.templates);
        return html `
      <div role="list" aria-label="Template suggestions">
        ${suggestions.map(s => html `
          <div class="suggestion" role="listitem" tabindex="0"
            @click="${() => this._select(s)}"
            @keydown="${(e) => { if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this._select(s);
        } }}">
            <strong>${s.template.name}</strong>
            <span class="score">${Math.round(s.score * 100)}% match</span>
            <div>${s.template.description}</div>
          </div>
        `)}
      </div>
    `;
    }
    _select(suggestion) {
        this.dispatchEvent(new CustomEvent('suggestion-select', {
            detail: { suggestion },
            bubbles: true,
            composed: true,
        }));
    }
};
__decorate([
    property({ type: Object })
], PhzSuggestionFlow.prototype, "schema", void 0);
__decorate([
    property({ type: Array })
], PhzSuggestionFlow.prototype, "templates", void 0);
PhzSuggestionFlow = __decorate([
    safeCustomElement('phz-suggestion-flow')
], PhzSuggestionFlow);
export { PhzSuggestionFlow };
//# sourceMappingURL=phz-suggestion-flow.js.map