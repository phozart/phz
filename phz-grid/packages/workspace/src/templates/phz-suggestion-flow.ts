/**
 * @phozart/phz-workspace — Suggestion Flow
 *
 * End-to-end pipeline: schema -> profile -> match -> ranked suggestions.
 */

import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import type { DataSourceSchema } from '../data-adapter.js';
import type { TemplateDefinition } from '../types.js';
import { analyzeSchema, type FieldProfile } from './schema-analyzer.js';
import { matchTemplates, type ScoredTemplate } from './template-matcher.js';

export interface SuggestionResult extends ScoredTemplate {
  profile: FieldProfile;
}

export function buildSuggestionPipeline(
  schema: DataSourceSchema,
  templates: TemplateDefinition[],
): SuggestionResult[] {
  const profile = analyzeSchema(schema);
  const scored = matchTemplates(profile, templates);
  return scored.map(s => ({ ...s, profile }));
}

// --- Lit Component ---

@safeCustomElement('phz-suggestion-flow')
export class PhzSuggestionFlow extends LitElement {
  static override styles = css`
    :host { display: block; }
    .suggestion { padding: 12px; border: 1px solid var(--phz-border-color, #e0e0e0); border-radius: 8px; margin-bottom: 8px; cursor: pointer; }
    .suggestion:hover { border-color: var(--phz-accent-color, #1976d2); }
    .score { font-size: 0.8em; color: var(--phz-text-secondary, #666); }
  `;

  @property({ type: Object }) schema?: DataSourceSchema;
  @property({ type: Array }) templates: TemplateDefinition[] = [];

  override render() {
    if (!this.schema) return html`<p>Select a data source to see suggestions.</p>`;
    const suggestions = buildSuggestionPipeline(this.schema, this.templates);
    return html`
      <div role="list" aria-label="Template suggestions">
        ${suggestions.map(s => html`
          <div class="suggestion" role="listitem" tabindex="0"
            @click="${() => this._select(s)}"
            @keydown="${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._select(s); } }}">
            <strong>${s.template.name}</strong>
            <span class="score">${Math.round(s.score * 100)}% match</span>
            <div>${s.template.description}</div>
          </div>
        `)}
      </div>
    `;
  }

  private _select(suggestion: SuggestionResult) {
    this.dispatchEvent(new CustomEvent('suggestion-select', {
      detail: { suggestion },
      bubbles: true,
      composed: true,
    }));
  }
}
