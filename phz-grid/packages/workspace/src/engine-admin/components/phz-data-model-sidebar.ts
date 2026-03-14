/**
 * @phozart/engine-admin — Data Model Sidebar
 *
 * 5-section collapsible sidebar for the computation DAG layers:
 * Fields (gray) → Parameters (purple) → Calculated Fields (amber) → Metrics (blue) → KPIs (green)
 */

import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../../safe-custom-element.js';
import type {
  DataModelField, ParameterDef, CalculatedFieldDef,
} from '@phozart/engine';
import type { MetricDef, KPIDefinition } from '@phozart/engine';

interface SidebarSection {
  key: string;
  label: string;
  color: string;
  canAdd: boolean;
}

const SECTIONS: SidebarSection[] = [
  { key: 'fields', label: 'Fields', color: '#A8A29E', canAdd: false },
  { key: 'parameters', label: 'Parameters', color: '#7C3AED', canAdd: true },
  { key: 'calculatedFields', label: 'Calculated Fields', color: '#D97706', canAdd: true },
  { key: 'metrics', label: 'Metrics', color: '#3B82F6', canAdd: true },
  { key: 'kpis', label: 'KPIs', color: '#16A34A', canAdd: true },
];

@safeCustomElement('phz-data-model-sidebar')
export class PhzDataModelSidebar extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, -apple-system, sans-serif; }

    .section { border-bottom: 1px solid #E7E5E4; }
    .section:last-child { border-bottom: none; }

    .section-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 14px; cursor: pointer; user-select: none;
    }
    .section-header:hover { background: #FAFAF9; }

    .section-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 10px; font-weight: 700; color: #78716C;
      text-transform: uppercase; letter-spacing: 0.06em;
    }
    .section-dot { width: 8px; height: 8px; border-radius: 50%; }
    .section-count {
      font-size: 10px; color: #D6D3D1; font-weight: 400;
      min-width: 18px; text-align: center;
    }

    .section-actions { display: flex; align-items: center; gap: 4px; }
    .add-btn {
      font-size: 16px; line-height: 1; cursor: pointer; border: none;
      background: none; color: #3B82F6; padding: 0 2px; transition: color 0.15s;
    }
    .add-btn:hover { color: #2563EB; }

    .chevron {
      font-size: 10px; color: #A8A29E; transition: transform 0.15s;
    }
    .chevron--open { transform: rotate(90deg); }

    .section-body { padding: 0 14px 10px; }

    .item {
      display: flex; align-items: center; gap: 8px; padding: 5px 8px;
      border-radius: 4px; font-size: 12px; cursor: pointer; position: relative;
    }
    .item:hover { background: #F5F5F4; }

    .item-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    .item-info { flex: 1; min-width: 0; }
    .item-name { color: #1C1917; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .item-sub { font-size: 10px; color: #A8A29E; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .item-menu {
      opacity: 0; border: none; background: none; cursor: pointer;
      font-size: 14px; color: #78716C; padding: 2px 4px; border-radius: 3px;
      transition: opacity 0.12s;
    }
    .item:hover .item-menu { opacity: 1; }
    .item-menu:hover { background: #E7E5E4; }

    .field-type {
      font-size: 9px; font-weight: 700; color: #A8A29E;
      min-width: 22px; text-transform: uppercase; text-align: center;
    }

    .empty { font-size: 11px; color: #A8A29E; padding: 6px 8px; font-style: italic; }
    .empty-hint { font-size: 10px; color: #D6D3D1; padding: 2px 8px 0; font-style: normal; }
  `;

  @property({ type: Array }) fields: DataModelField[] = [];
  @property({ type: Array }) parameters: ParameterDef[] = [];
  @property({ type: Array }) calculatedFields: CalculatedFieldDef[] = [];
  @property({ type: Array }) metrics: MetricDef[] = [];
  @property({ type: Array }) kpis: KPIDefinition[] = [];

  @state() private _expanded: Record<string, boolean> = {
    fields: true, parameters: true, calculatedFields: true, metrics: true, kpis: true,
  };

  private _toggle(key: string) {
    this._expanded = { ...this._expanded, [key]: !this._expanded[key] };
  }

  private _emptyText(key: string): string {
    switch (key) {
      case 'fields': return 'Auto-detected from your data';
      case 'parameters': return 'Add adjustable inputs ($name)';
      case 'calculatedFields': return 'Create new columns (~name)';
      case 'metrics': return 'Aggregate data (@name)';
      case 'kpis': return 'Track business outcomes';
      default: return 'None defined';
    }
  }

  private _emit(action: string, entityType: string, id?: string) {
    this.dispatchEvent(new CustomEvent('sidebar-action', {
      bubbles: true, composed: true,
      detail: { action, entityType, id },
    }));
  }

  private _handleContextMenu(e: MouseEvent, section: SidebarSection, item: { id: string; name: string }) {
    e.preventDefault();
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('sidebar-contextmenu', {
      bubbles: true, composed: true,
      detail: { entityType: section.key, id: item.id, name: item.name, canAdd: section.canAdd, x: e.clientX, y: e.clientY },
    }));
  }

  private _getItems(key: string): Array<{ id: string; name: string; sub: string }> {
    switch (key) {
      case 'fields':
        return this.fields.map(f => ({ id: f.name, name: f.label ?? f.name, sub: f.type }));
      case 'parameters':
        return this.parameters.map(p => ({ id: p.id, name: p.name, sub: `${p.type} = ${p.defaultValue}` }));
      case 'calculatedFields':
        return this.calculatedFields.map(c => ({ id: c.id, name: c.name, sub: c.outputType }));
      case 'metrics':
        return this.metrics.map(m => ({
          id: m.id, name: m.name,
          sub: m.formula.type === 'simple'
            ? `${m.formula.aggregation}(${m.formula.field})`
            : m.formula.type === 'expression' ? 'expression' : m.formula.type,
        }));
      case 'kpis':
        return this.kpis.map(k => ({ id: k.id, name: k.name, sub: `target: ${k.target}` }));
      default:
        return [];
    }
  }

  render() {
    return html`
      ${SECTIONS.map(section => {
        const items = this._getItems(section.key);
        const isOpen = this._expanded[section.key];
        return html`
          <div class="section">
            <div class="section-header" @click=${() => this._toggle(section.key)}>
              <div class="section-title">
                <span class="chevron ${isOpen ? 'chevron--open' : ''}">&#x25B6;</span>
                <span class="section-dot" style="background:${section.color};"></span>
                <span>${section.label}</span>
              </div>
              <div class="section-actions">
                <span class="section-count">${items.length}</span>
                ${section.canAdd ? html`
                  <button class="add-btn"
                    @click=${(e: Event) => { e.stopPropagation(); this._emit('create', section.key); }}
                    title="Add ${section.label}">+</button>
                ` : nothing}
              </div>
            </div>
            ${isOpen ? html`
              <div class="section-body">
                ${items.length === 0 ? html`<div class="empty">${this._emptyText(section.key)}</div>` : nothing}
                ${items.map(item => html`
                  <div class="item" @click=${() => { if (section.canAdd) this._emit('edit', section.key, item.id); }}
                       @contextmenu=${(e: MouseEvent) => this._handleContextMenu(e, section, item)}>
                    ${section.key === 'fields'
                      ? html`<span class="field-type">${item.sub}</span>`
                      : html`<span class="item-dot" style="background:${section.color};"></span>`
                    }
                    <div class="item-info">
                      <div class="item-name">${item.name}</div>
                      ${section.key !== 'fields' ? html`<div class="item-sub">${item.sub}</div>` : nothing}
                    </div>
                    ${section.canAdd ? html`
                      <button class="item-menu" @click=${(e: Event) => { e.stopPropagation(); this._emit('menu', section.key, item.id); }}
                        title="Actions">&#x22EE;</button>
                    ` : nothing}
                  </div>
                `)}
              </div>
            ` : nothing}
          </div>
        `;
      })}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'phz-data-model-sidebar': PhzDataModelSidebar; }
}
