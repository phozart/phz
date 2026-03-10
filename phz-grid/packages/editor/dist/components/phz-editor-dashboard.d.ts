/**
 * @phozart/phz-editor — <phz-editor-dashboard> (B-2.05 / B-2.06)
 *
 * Dashboard component that supports both view and edit modes.
 * In view mode, renders the dashboard read-only with action buttons.
 * In edit mode, enables drag-drop widget placement and config panel.
 */
import { LitElement } from 'lit';
import type { DashboardWidget } from '@phozart/phz-shared/types';
import type { DashboardEditState } from '../screens/dashboard-edit-state.js';
export declare class PhzEditorDashboard extends LitElement {
    static styles: import("lit").CSSResult;
    dashboardId: string;
    editMode: boolean;
    widgets: DashboardWidget[];
    columns: number;
    rows: number;
    gap: number;
    private _state;
    willUpdate(changed: Map<PropertyKey, unknown>): void;
    /** Get the current edit state. */
    getState(): DashboardEditState;
    private _onWidgetClick;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-editor-dashboard': PhzEditorDashboard;
    }
}
//# sourceMappingURL=phz-editor-dashboard.d.ts.map