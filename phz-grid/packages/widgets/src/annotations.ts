/**
 * @phozart/widgets -- Data Point Annotations
 *
 * Annotation manager and SVG marker rendering for chart data points.
 */

import { LitElement, html, svg, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { widgetBaseStyles } from './shared-styles.js';

// -- Types --

export type MarkerStyle = 'pin' | 'flag' | 'circle' | 'highlight';

export interface Annotation {
  id: string;
  chartId: string;
  dataPoint: { x: number; y: number } | { label: string };
  text: string;
  author?: string;
  timestamp?: Date;
  style?: MarkerStyle;
}

export interface AnnotationManager {
  add(annotation: Annotation): void;
  remove(id: string): void;
  update(id: string, changes: Partial<Annotation>): void;
  getForChart(chartId: string): Annotation[];
  serialize(): string;
  deserialize(data: string): void;
}

// -- Manager factory --

export function createAnnotationManager(): AnnotationManager {
  const annotations = new Map<string, Annotation>();

  return {
    add(annotation: Annotation): void {
      annotations.set(annotation.id, annotation);
    },

    remove(id: string): void {
      annotations.delete(id);
    },

    update(id: string, changes: Partial<Annotation>): void {
      const existing = annotations.get(id);
      if (!existing) return;
      annotations.set(id, { ...existing, ...changes, id: existing.id });
    },

    getForChart(chartId: string): Annotation[] {
      return Array.from(annotations.values()).filter(a => a.chartId === chartId);
    },

    serialize(): string {
      const arr = Array.from(annotations.values()).map(a => ({
        ...a,
        timestamp: a.timestamp?.toISOString(),
      }));
      return JSON.stringify(arr);
    },

    deserialize(data: string): void {
      const arr = JSON.parse(data) as Array<any>;
      annotations.clear();
      for (const raw of arr) {
        const annotation: Annotation = {
          ...raw,
          timestamp: raw.timestamp ? new Date(raw.timestamp) : undefined,
        };
        annotations.set(annotation.id, annotation);
      }
    },
  };
}

// -- SVG Marker rendering --

export function renderAnnotationMarker(
  annotation: Annotation,
  position: { x: number; y: number },
): string {
  const style = annotation.style ?? 'pin';
  const { x, y } = position;
  const escapedText = escapeXml(annotation.text);
  const escapedId = escapeXml(annotation.id);
  const title = `<title>${escapedText}</title>`;

  switch (style) {
    case 'pin':
      return `<g class="phz-annotation" data-id="${escapedId}" role="img" aria-label="${escapedText}" tabindex="0">${title}<circle cx="${x}" cy="${y}" r="6" fill="#DC2626" stroke="#FFFFFF" stroke-width="2"/><line x1="${x}" y1="${y + 6}" x2="${x}" y2="${y + 18}" stroke="#DC2626" stroke-width="2"/><text x="${x + 10}" y="${y - 4}" font-size="11" fill="#1C1917">${escapedText}</text></g>`;

    case 'flag':
      return `<g class="phz-annotation" data-id="${escapedId}" role="img" aria-label="${escapedText}" tabindex="0">${title}<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 24}" stroke="#3B82F6" stroke-width="2"/><polygon points="${x},${y} ${x + 16},${y + 6} ${x},${y + 12}" fill="#3B82F6"/><text x="${x + 20}" y="${y + 8}" font-size="11" fill="#1C1917">${escapedText}</text></g>`;

    case 'circle':
      return `<g class="phz-annotation" data-id="${escapedId}" role="img" aria-label="${escapedText}" tabindex="0">${title}<circle cx="${x}" cy="${y}" r="10" fill="none" stroke="#8B5CF6" stroke-width="2" stroke-dasharray="4,2"/><text x="${x + 14}" y="${y + 4}" font-size="11" fill="#1C1917">${escapedText}</text></g>`;

    case 'highlight':
      return `<g class="phz-annotation" data-id="${escapedId}" role="img" aria-label="${escapedText}" tabindex="0">${title}<rect x="${x - 12}" y="${y - 12}" width="24" height="24" rx="4" fill="#FBBF24" opacity="0.3"/><text x="${x + 16}" y="${y + 4}" font-size="11" fill="#1C1917">${escapedText}</text></g>`;

    default:
      return `<g class="phz-annotation" data-id="${escapedId}" role="img" aria-label="${escapedText}" tabindex="0">${title}<circle cx="${x}" cy="${y}" r="6" fill="#DC2626" stroke="#FFFFFF" stroke-width="2"/><text x="${x + 10}" y="${y - 4}" font-size="11" fill="#1C1917">${escapedText}</text></g>`;
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// -- Annotation Layer Component --

@customElement('phz-annotation-layer')
export class PhzAnnotationLayer extends LitElement {
  static styles = [
    widgetBaseStyles,
    css`
      :host {
        display: block;
        position: absolute;
        inset: 0;
        pointer-events: none;
      }

      svg { width: 100%; height: 100%; }

      .phz-annotation {
        pointer-events: all;
        cursor: pointer;
      }

      .phz-annotation:focus-visible {
        outline: 2px solid #3B82F6;
        outline-offset: 2px;
      }

      .annotation-form {
        position: absolute;
        background: var(--phz-surface, #FFFFFF);
        border: 1px solid var(--phz-border, #E7E5E4);
        border-radius: 8px;
        padding: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        pointer-events: all;
        z-index: 10;
        min-width: 200px;
      }

      .annotation-form input, .annotation-form select {
        width: 100%;
        padding: 4px 8px;
        border: 1px solid #D6D3D1;
        border-radius: 4px;
        font-size: 12px;
        margin-bottom: 8px;
      }

      .annotation-form input:focus-visible, .annotation-form select:focus-visible {
        outline: 2px solid #3B82F6;
        outline-offset: 2px;
      }

      .form-actions {
        display: flex;
        gap: 4px;
        justify-content: flex-end;
      }

      .form-actions button {
        padding: 4px 10px;
        border: 1px solid #D6D3D1;
        border-radius: 4px;
        font-size: 11px;
        cursor: pointer;
        background: white;
      }

      .form-actions button.primary {
        background: #3B82F6;
        color: white;
        border-color: #3B82F6;
      }

      .form-actions button:focus-visible {
        outline: 2px solid #3B82F6;
        outline-offset: 2px;
      }

      @media (forced-colors: active) {
        .annotation-form { border: 2px solid ButtonText; }
      }
    `,
  ];

  @property({ type: String }) chartId: string = '';
  @property({ attribute: false }) annotations: Annotation[] = [];
  @property({ attribute: false }) positionMap: Map<string, { x: number; y: number }> = new Map();

  @state() private _formOpen: boolean = false;
  @state() private _formPos: { x: number; y: number } = { x: 0, y: 0 };
  @state() private _formText: string = '';
  @state() private _formStyle: MarkerStyle = 'pin';

  private _onChartClick(e: MouseEvent) {
    const svgEl = this.renderRoot.querySelector('svg');
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    this._formPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    this._formOpen = true;
    this._formText = '';
    this._formStyle = 'pin';
  }

  private _onSave() {
    if (!this._formText.trim()) return;
    const annotation: Annotation = {
      id: `ann-${Date.now()}`,
      chartId: this.chartId,
      dataPoint: this._formPos,
      text: this._formText.trim(),
      style: this._formStyle,
      timestamp: new Date(),
    };
    this.dispatchEvent(new CustomEvent('annotation-add', { detail: annotation, bubbles: true, composed: true }));
    this._formOpen = false;
  }

  private _onCancel() {
    this._formOpen = false;
  }

  private _onAnnotationClick(annotation: Annotation) {
    this.dispatchEvent(new CustomEvent('annotation-update', { detail: annotation, bubbles: true, composed: true }));
  }

  private _onAnnotationRemove(id: string) {
    this.dispatchEvent(new CustomEvent('annotation-remove', { detail: { id }, bubbles: true, composed: true }));
  }

  render() {
    return html`
      <svg class="phz-w-chart-svg" @click=${this._onChartClick}>
        ${this.annotations.map(ann => {
          const pos = this.positionMap.get(ann.id);
          if (!pos) return nothing;
          const markerSvg = renderAnnotationMarker(ann, pos);
          return svg`<g .innerHTML=${markerSvg}></g>`;
        })}
      </svg>
      ${this._formOpen ? html`
        <div class="annotation-form"
             style="left: ${this._formPos.x}px; top: ${this._formPos.y}px;"
             role="dialog"
             aria-label="Add annotation">
          <input type="text"
                 placeholder="Annotation text"
                 aria-label="Annotation text"
                 .value=${this._formText}
                 @input=${(e: Event) => { this._formText = (e.target as HTMLInputElement).value; }}>
          <select aria-label="Marker style"
                  .value=${this._formStyle}
                  @change=${(e: Event) => { this._formStyle = (e.target as HTMLSelectElement).value as MarkerStyle; }}>
            <option value="pin">Pin</option>
            <option value="flag">Flag</option>
            <option value="circle">Circle</option>
            <option value="highlight">Highlight</option>
          </select>
          <div class="form-actions">
            <button @click=${this._onCancel}>Cancel</button>
            <button class="primary" @click=${this._onSave}>Save</button>
          </div>
        </div>
      ` : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-annotation-layer': PhzAnnotationLayer;
  }
}
