/**
 * @phozart/grid-creator — <phz-creator-step>
 *
 * Step indicator with horizontal numbered circles and connectors.
 * Highlights current, completed, and upcoming steps.
 */

import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import { getStepConfig } from './wizard-state.js';

@safeCustomElement('phz-creator-step')
export class PhzCreatorStep extends LitElement {
  static styles = css`
    :host { display: block; }

    .steps {
      display: flex; align-items: center; justify-content: center;
      gap: 0; padding: 16px 24px;
    }

    .step {
      display: flex; align-items: center; gap: 8px;
    }

    .step-circle {
      width: 32px; height: 32px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 600;
      border: 2px solid #D6D3D1; color: #78716C; background: white;
      flex-shrink: 0; transition: all 0.2s ease;
    }

    .step-circle.active {
      border-color: #3B82F6; background: #3B82F6; color: white;
    }

    .step-circle.completed {
      border-color: #22C55E; background: #22C55E; color: white;
    }

    .step-label {
      font-size: 12px; color: #78716C; white-space: nowrap;
    }
    .step-label.active { color: #1C1917; font-weight: 600; }

    .step-connector {
      width: 32px; height: 2px; background: #D6D3D1;
      margin: 0 4px; flex-shrink: 0;
    }
    .step-connector.completed { background: #22C55E; }

    @media (max-width: 768px) {
      .step-label { display: none; }
    }

    @media (forced-colors: active) {
      .step-circle { border: 2px solid ButtonText; }
      .step-circle.active { background: Highlight; color: HighlightText; border-color: Highlight; }
      .step-circle.completed { background: ButtonText; color: ButtonFace; }
    }
  `;

  @property({ type: Number, attribute: 'current-step' })
  currentStep: number = 0;

  @property({ type: Number, attribute: 'total-steps' })
  totalSteps: number = 5;

  @property({ attribute: false })
  completedSteps: Set<number> = new Set();

  render() {
    const steps = [];
    for (let i = 0; i < this.totalSteps; i++) {
      if (i > 0) {
        const connectorClass = this.completedSteps.has(i - 1) ? 'completed' : '';
        steps.push(html`<div class="step-connector ${connectorClass}"></div>`);
      }

      const config = getStepConfig(i);
      const isActive = i === this.currentStep;
      const isCompleted = this.completedSteps.has(i);
      const circleClass = isActive ? 'active' : isCompleted ? 'completed' : '';
      const labelClass = isActive ? 'active' : '';

      steps.push(html`
        <div class="step" role="listitem" aria-current=${isActive ? 'step' : 'false'}>
          <div class="step-circle ${circleClass}">
            ${isCompleted ? '\u2713' : i + 1}
          </div>
          <span class="step-label ${labelClass}">${config.name}</span>
        </div>
      `);
    }

    return html`<div class="steps" role="list" aria-label="Wizard steps">${steps}</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'phz-creator-step': PhzCreatorStep; }
}
