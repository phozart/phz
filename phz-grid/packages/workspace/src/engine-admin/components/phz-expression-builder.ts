/**
 * @phozart/engine-admin — Expression Builder
 *
 * Dual-mode expression editor (Block mode + Formula mode).
 * Both modes edit the same ExpressionNode tree.
 */

import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../../safe-custom-element.js';
import type {
  ExpressionNode, DataModelField, ParameterDef, CalculatedFieldDef,
  BinaryOperator, BuiltinFunction,
} from '@phozart/engine';
import { parseFormula, formatFormula, validateExpression } from '@phozart/engine';
import type { ExpressionError } from '@phozart/engine';
import type { MetricDef } from '@phozart/engine';

type EditorMode = 'formula' | 'block';

const LAYER_COLORS: Record<string, string> = {
  field: '#A8A29E',
  parameter: '#7C3AED',
  calculated_field: '#D97706',
  metric: '#3B82F6',
};

const OPERATOR_LABELS: Record<string, string> = {
  '+': '+', '-': '-', '*': '*', '/': '/', '%': '%', '^': '^',
  eq: '==', neq: '!=', gt: '>', gte: '>=', lt: '<', lte: '<=',
  and: 'AND', or: 'OR', concat: '++',
};

const FUNCTION_CATEGORIES: Array<{ label: string; fns: BuiltinFunction[] }> = [
  { label: 'Math', fns: ['ABS', 'ROUND', 'FLOOR', 'CEIL'] },
  { label: 'String', fns: ['UPPER', 'LOWER', 'TRIM', 'LEN', 'SUBSTR', 'CONCAT'] },
  { label: 'Date', fns: ['YEAR', 'MONTH', 'DAY'] },
  { label: 'Utility', fns: ['COALESCE', 'IF', 'CLAMP'] },
];

@safeCustomElement('phz-expression-builder')
export class PhzExpressionBuilder extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, -apple-system, sans-serif; }

    .builder { border: 1px solid #E7E5E4; border-radius: 8px; overflow: hidden; }

    .mode-bar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 6px 12px; background: #FAFAF9; border-bottom: 1px solid #E7E5E4;
    }
    .mode-label { font-size: 10px; font-weight: 700; color: #78716C; text-transform: uppercase; letter-spacing: 0.06em; }
    .mode-toggle {
      display: flex; gap: 2px; background: #E7E5E4; border-radius: 4px; padding: 2px;
    }
    .mode-btn {
      padding: 3px 10px; font-size: 11px; font-weight: 600; border: none;
      border-radius: 3px; cursor: pointer; background: none; color: #78716C;
      font-family: inherit;
    }
    .mode-btn--active { background: white; color: #1C1917; box-shadow: 0 1px 2px rgba(0,0,0,0.08); }

    /* Formula mode */
    .formula-area {
      min-height: 80px; padding: 10px 12px; font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 13px; line-height: 1.5; border: none; width: 100%;
      resize: vertical; background: white; color: #1C1917; outline: none;
    }

    .errors { padding: 6px 12px; background: #FEF2F2; border-top: 1px solid #FECACA; }
    .error-item { font-size: 11px; color: #DC2626; padding: 2px 0; }

    /* Block mode */
    .block-area { padding: 12px; min-height: 80px; background: white; }

    .block {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 4px 8px; border-radius: 6px; font-size: 12px;
      border: 1px solid #E7E5E4; background: #FAFAF9; margin: 2px;
    }

    .block--ref {
      border-left: 3px solid; font-weight: 500; background: white;
    }

    .block--op {
      background: #F5F5F4; gap: 6px;
    }

    .block--fn {
      flex-direction: column; align-items: flex-start;
      border-left: 3px solid #3B82F6; background: #EFF6FF;
    }

    .block--cond {
      flex-direction: column; align-items: stretch;
      border-left: 3px solid #D97706; background: #FFFBEB; padding: 8px;
    }
    .cond-row {
      display: flex; align-items: center; gap: 6px; padding: 4px 0;
    }
    .cond-label {
      font-size: 10px; font-weight: 700; color: #78716C; text-transform: uppercase;
      min-width: 36px;
    }

    .literal-input {
      border: 1px solid #D6D3D1; border-radius: 4px; padding: 2px 6px;
      font-size: 12px; width: 60px; font-family: inherit;
    }
    .literal-input:focus { outline: none; border-color: #3B82F6; }

    .block-delete {
      font-size: 11px; color: #A8A29E; cursor: pointer; border: none;
      background: none; padding: 0 2px; opacity: 0; transition: opacity 0.12s;
    }
    .block:hover .block-delete { opacity: 1; }

    /* Autocomplete & palettes */
    .palette {
      padding: 8px 12px; border-top: 1px solid #E7E5E4; background: #FAFAF9;
      display: flex; gap: 4px; flex-wrap: wrap; align-items: center;
    }
    .palette-label { font-size: 9px; font-weight: 700; color: #A8A29E; text-transform: uppercase; margin-right: 4px; }
    .palette-chip {
      padding: 2px 8px; border: 1px solid #E7E5E4; border-radius: 10px;
      font-size: 11px; cursor: pointer; background: white; font-family: inherit;
    }
    .palette-chip:hover { border-color: #3B82F6; background: #EFF6FF; }

    /* Help panel */
    .help-btn {
      padding: 3px 8px; font-size: 11px; font-weight: 600; border: 1px solid #D6D3D1;
      border-radius: 4px; cursor: pointer; background: none; color: #78716C;
      font-family: inherit; margin-left: 6px;
    }
    .help-btn:hover { background: #F5F5F4; color: #1C1917; }
    .help-btn--active { background: #EFF6FF; border-color: #3B82F6; color: #3B82F6; }

    .help-panel {
      padding: 10px 12px; border-top: 1px solid #E7E5E4; background: #FAFAF9;
      font-size: 11px; line-height: 1.6;
    }
    .help-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px;
    }
    .help-section-title {
      font-size: 9px; font-weight: 700; color: #78716C; text-transform: uppercase;
      letter-spacing: 0.04em; margin-bottom: 2px;
    }
    .help-row {
      display: flex; gap: 6px; align-items: baseline;
    }
    .help-sigil {
      font-family: 'JetBrains Mono', 'Fira Code', monospace; font-weight: 600;
      color: #1C1917; min-width: 56px;
    }
    .help-desc { color: #78716C; }
    .help-wide {
      grid-column: 1 / -1; border-top: 1px solid #E7E5E4; padding-top: 6px; margin-top: 2px;
    }
    .help-mono {
      font-family: 'JetBrains Mono', 'Fira Code', monospace; color: #1C1917;
    }
    .help-example { color: #78716C; font-style: italic; margin-top: 2px; }
    .help-fn-list {
      font-family: 'JetBrains Mono', 'Fira Code', monospace; color: #1C1917;
      word-spacing: 4px;
    }
  `;

  @property({ type: Object }) expression?: ExpressionNode;
  @property({ type: Array }) fields: DataModelField[] = [];
  @property({ type: Array }) parameters: ParameterDef[] = [];
  @property({ type: Array }) calculatedFields: CalculatedFieldDef[] = [];
  @property({ type: Array }) metrics: MetricDef[] = [];
  @property({ type: String }) level: 'row' | 'metric' = 'row';

  @state() private _mode: EditorMode = 'formula';
  @state() private _formulaText = '';
  @state() private _errors: ExpressionError[] = [];
  @state() private _showHelp = false;

  willUpdate(changed: Map<string, unknown>) {
    if (changed.has('expression') && this.expression) {
      if (this._mode === 'formula') {
        this._formulaText = formatFormula(this.expression);
      }
      this._validate();
    }
  }

  private _validate() {
    if (!this.expression) { this._errors = []; return; }
    this._errors = validateExpression(this.expression, {
      fields: this.fields.map(f => f.name),
      parameters: this.parameters.map(p => p.id),
      calculatedFields: this.calculatedFields.map(c => c.id),
      metrics: this.metrics.map(m => m.id),
    }, this.level);
  }

  private _emit() {
    this.dispatchEvent(new CustomEvent('expression-change', {
      bubbles: true, composed: true,
      detail: {
        expression: this.expression,
        errors: this._errors,
        formulaText: this.expression ? formatFormula(this.expression) : '',
      },
    }));
  }

  private _switchMode(mode: EditorMode) {
    if (mode === this._mode) return;

    if (mode === 'formula' && this.expression) {
      this._formulaText = formatFormula(this.expression);
    } else if (mode === 'block' && this._formulaText) {
      const { node, errors } = parseFormula(this._formulaText);
      if (node && errors.length === 0) {
        this.expression = node;
      }
    }
    this._mode = mode;
  }

  private _handleFormulaInput(e: Event) {
    this._formulaText = (e.target as HTMLTextAreaElement).value;
    const { node, errors } = parseFormula(this._formulaText);
    if (errors.length === 0 && node) {
      this.expression = node;
      this._validate();
      this._emit();
    } else {
      this._errors = errors.map(err => ({ message: err.message, pos: { start: err.pos, end: err.pos } }));
    }
  }

  private _insertRef(kind: string, id: string) {
    let sigil = '';
    switch (kind) {
      case 'field': sigil = `[${id}]`; break;
      case 'parameter': sigil = `$${id}`; break;
      case 'metric': sigil = `@${id}`; break;
      case 'calculated_field': sigil = `~${id}`; break;
    }
    this._formulaText += (this._formulaText ? ' ' : '') + sigil;
    const { node, errors } = parseFormula(this._formulaText);
    if (node && errors.length === 0) {
      this.expression = node;
      this._validate();
      this._emit();
    }
    this.requestUpdate();
  }

  private _insertFunction(fn: BuiltinFunction) {
    this._formulaText += (this._formulaText ? ' ' : '') + `${fn}()`;
    this.requestUpdate();
  }

  // --- Block rendering ---

  private _renderBlock(node: ExpressionNode): ReturnType<typeof html> {
    switch (node.kind) {
      case 'literal':
        return html`<span class="block">
          <input class="literal-input" .value=${String(node.value ?? '')}
            @change=${(e: Event) => {
              const val = (e.target as HTMLInputElement).value;
              const num = Number(val);
              (node as any).value = !isNaN(num) && val !== '' ? num : val === 'true' ? true : val === 'false' ? false : val === 'null' ? null : val;
              this._emit();
            }}>
        </span>`;

      case 'field_ref':
        return html`<span class="block block--ref" style="border-color:${LAYER_COLORS.field};">[${node.fieldName}]</span>`;

      case 'param_ref':
        return html`<span class="block block--ref" style="border-color:${LAYER_COLORS.parameter};">$${node.parameterId}</span>`;

      case 'metric_ref':
        return html`<span class="block block--ref" style="border-color:${LAYER_COLORS.metric};">@${node.metricId}</span>`;

      case 'calc_ref':
        return html`<span class="block block--ref" style="border-color:${LAYER_COLORS.calculated_field};">~${node.calculatedFieldId}</span>`;

      case 'binary_op':
        return html`<span class="block block--op">
          ${this._renderBlock(node.left)}
          <strong>${OPERATOR_LABELS[node.operator] ?? node.operator}</strong>
          ${this._renderBlock(node.right)}
        </span>`;

      case 'unary_op':
        return html`<span class="block block--op">
          <strong>${node.operator === 'negate' ? '-' : 'NOT'}</strong>
          ${this._renderBlock(node.operand)}
        </span>`;

      case 'conditional':
        return html`<div class="block block--cond">
          <div class="cond-row"><span class="cond-label">IF</span>${this._renderBlock(node.condition)}</div>
          <div class="cond-row"><span class="cond-label">THEN</span>${this._renderBlock(node.thenBranch)}</div>
          <div class="cond-row"><span class="cond-label">ELSE</span>${this._renderBlock(node.elseBranch)}</div>
        </div>`;

      case 'function_call':
        return html`<div class="block block--fn">
          <strong>${node.functionName}</strong>
          <div style="display:flex;gap:4px;flex-wrap:wrap;">
            ${node.args.map(arg => this._renderBlock(arg))}
          </div>
        </div>`;

      case 'null_check':
        return html`<span class="block block--op">
          ${this._renderBlock(node.operand)}
          <strong>IS ${node.isNull ? '' : 'NOT '}NULL</strong>
        </span>`;

      default:
        return html`<span class="block">?</span>`;
    }
  }

  private _renderHelp() {
    return html`
      <div class="help-panel">
        <div class="help-grid">
          <div>
            <div class="help-section-title">References</div>
            <div class="help-row"><span class="help-sigil">[field]</span><span class="help-desc">Data field</span></div>
            <div class="help-row"><span class="help-sigil">$param</span><span class="help-desc">Parameter</span></div>
            <div class="help-row"><span class="help-sigil">~calc</span><span class="help-desc">Calculated field</span></div>
            <div class="help-row"><span class="help-sigil">@metric</span><span class="help-desc">Metric</span></div>
          </div>
          <div>
            <div class="help-section-title">Operators</div>
            <div class="help-row"><span class="help-sigil">+ - * / % ^</span><span class="help-desc">Arithmetic</span></div>
            <div class="help-row"><span class="help-sigil">eq neq gt gte lt lte</span><span class="help-desc">Comparison</span></div>
            <div class="help-row"><span class="help-sigil">and or</span><span class="help-desc">Logic</span></div>
          </div>
          <div class="help-wide">
            <div class="help-section-title">Conditional</div>
            <div class="help-mono">IF(condition, then, else)</div>
            <div class="help-example">e.g. IF([salary] gt 50000, "High", "Low")</div>
          </div>
          <div class="help-wide">
            <div class="help-section-title">Functions</div>
            <div class="help-fn-list">ABS ROUND FLOOR CEIL UPPER LOWER TRIM LEN SUBSTR CONCAT YEAR MONTH DAY COALESCE IF CLAMP</div>
          </div>
        </div>
      </div>
    `;
  }

  render() {
    return html`
      <div class="builder">
        <div class="mode-bar">
          <span class="mode-label">Expression</span>
          <div style="display:flex;align-items:center;">
            <div class="mode-toggle">
              <button class="mode-btn ${this._mode === 'block' ? 'mode-btn--active' : ''}"
                      @click=${() => this._switchMode('block')}>Block</button>
              <button class="mode-btn ${this._mode === 'formula' ? 'mode-btn--active' : ''}"
                      @click=${() => this._switchMode('formula')}>Formula</button>
            </div>
            <button class="help-btn ${this._showHelp ? 'help-btn--active' : ''}"
                    @click=${() => { this._showHelp = !this._showHelp; }}
                    title="Syntax reference">? Help</button>
          </div>
        </div>

        ${this._mode === 'formula' ? html`
          <textarea class="formula-area"
            .value=${this._formulaText}
            @input=${this._handleFormulaInput}
            placeholder="e.g. [rating] / [max_rating] * 100"
            spellcheck="false"
          ></textarea>
        ` : html`
          <div class="block-area">
            ${this.expression ? this._renderBlock(this.expression) : html`
              <div style="color:#A8A29E;font-size:12px;font-style:italic;">
                No expression — use the palette below or switch to Formula mode
              </div>
            `}
          </div>
        `}

        ${this._errors.length > 0 ? html`
          <div class="errors">
            ${this._errors.map(err => html`<div class="error-item">${err.message}</div>`)}
          </div>
        ` : nothing}

        ${this._showHelp ? this._renderHelp() : nothing}

        <!-- Reference palette -->
        <div class="palette">
          <span class="palette-label">Fields</span>
          ${this.fields.map(f => html`
            <button class="palette-chip" @click=${() => this._insertRef('field', f.name)}
              style="border-left:2px solid ${LAYER_COLORS.field};">${f.name}</button>
          `)}
        </div>
        ${this.parameters.length > 0 ? html`
          <div class="palette">
            <span class="palette-label">Params</span>
            ${this.parameters.map(p => html`
              <button class="palette-chip" @click=${() => this._insertRef('parameter', p.id)}
                style="border-left:2px solid ${LAYER_COLORS.parameter};">${p.name}</button>
            `)}
          </div>
        ` : nothing}
        ${this.level === 'metric' && this.metrics.length > 0 ? html`
          <div class="palette">
            <span class="palette-label">Metrics</span>
            ${this.metrics.map(m => html`
              <button class="palette-chip" @click=${() => this._insertRef('metric', m.id)}
                style="border-left:2px solid ${LAYER_COLORS.metric};">${m.name}</button>
            `)}
          </div>
        ` : nothing}
        ${this.level === 'row' && this.calculatedFields.length > 0 ? html`
          <div class="palette">
            <span class="palette-label">Calc</span>
            ${this.calculatedFields.map(c => html`
              <button class="palette-chip" @click=${() => this._insertRef('calculated_field', c.id)}
                style="border-left:2px solid ${LAYER_COLORS.calculated_field};">${c.name}</button>
            `)}
          </div>
        ` : nothing}
        <div class="palette">
          <span class="palette-label">Functions</span>
          ${FUNCTION_CATEGORIES.map(cat =>
            cat.fns.map(fn => html`
              <button class="palette-chip" @click=${() => this._insertFunction(fn)}>${fn}</button>
            `)
          )}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'phz-expression-builder': PhzExpressionBuilder; }
}
