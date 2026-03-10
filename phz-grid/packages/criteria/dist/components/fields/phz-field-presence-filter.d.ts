/**
 * @phozart/phz-criteria — Field Presence Filter
 *
 * Compact pill-based filter for specifying whether fields must have a value,
 * must be empty, or should not be filtered. Each pill cycles through three states:
 *   any → has_value → empty → any
 */
import { LitElement } from 'lit';
import type { PresenceState } from '@phozart/phz-core';
export declare class PhzFieldPresenceFilter extends LitElement {
    static styles: import("lit").CSSResult[];
    /** Array of field identifiers to render as filterable pills */
    fields: string[];
    /** Controlled mode: the parent owns the filter state */
    value?: Record<string, PresenceState>;
    /** Uncontrolled mode: initial state for fields */
    defaultValue?: Record<string, PresenceState>;
    /** Header label. Defaults to "Field presence" */
    label: string;
    /** Compact mode */
    compact: boolean;
    /** Internal state for uncontrolled mode */
    private _internalState;
    private _initialized;
    private get _isControlled();
    private get _currentState();
    private _getFieldState;
    private get _activeCount();
    updated(changed: Map<string, unknown>): void;
    private _buildFullMap;
    private _onPillClick;
    private _onClearAll;
    private _tooltipFor;
    render(): import("lit-html").TemplateResult<1>;
}
//# sourceMappingURL=phz-field-presence-filter.d.ts.map