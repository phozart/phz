/**
 * @phozart/phz-editor — <phz-measure-palette> (B-2.07)
 *
 * Measure registry palette component. Displays measures and KPIs
 * with search, category filtering, and drag-to-widget support.
 */
import { LitElement } from 'lit';
import type { MeasureDefinition, KPIDefinition } from '@phozart/phz-shared/adapters';
import type { MeasurePaletteState } from '../authoring/measure-palette-state.js';
export declare class PhzMeasurePalette extends LitElement {
    static styles: import("lit").CSSResult;
    measures: MeasureDefinition[];
    kpis: KPIDefinition[];
    private _state;
    willUpdate(changed: Map<PropertyKey, unknown>): void;
    /** Get the current palette state. */
    getState(): MeasurePaletteState;
    private _onSearch;
    private _onTabChange;
    private _onItemClick;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-measure-palette': PhzMeasurePalette;
    }
}
//# sourceMappingURL=phz-measure-palette.d.ts.map