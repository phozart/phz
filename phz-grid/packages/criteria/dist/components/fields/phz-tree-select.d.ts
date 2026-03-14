/**
 * @phozart/criteria — Tree Select
 *
 * Dropdown trigger with chip display + tree panel with custom checkboxes,
 * expand/collapse, search filter, Select All / Clear All.
 * Tri-state parent checkboxes (all/some/none checked).
 */
import { LitElement } from 'lit';
import type { TreeNode, CriteriaSelectionMode } from '@phozart/core';
export declare class PhzTreeSelect extends LitElement {
    static styles: import("lit").CSSResult[];
    nodes: TreeNode[];
    value: string[];
    disabled: boolean;
    /** Max items to show before truncation (0 = no limit) */
    maxVisibleItems: number;
    /** Values that should display with an amber inactive dot */
    inactiveItems: string[];
    /** Show an expand button for opening in a modal */
    showExpandButton: boolean;
    /** Inline mode: render tree directly without dropdown trigger/popup */
    inline: boolean;
    /** Controls value cardinality: single (radio), multiple (checkbox), none (read-only) */
    selectionMode: CriteriaSelectionMode | undefined;
    private get _effectiveDisabled();
    private get _isSingleMode();
    private _open;
    private _search;
    private _expanded;
    private _showAllItems;
    private _clickOutsideHandler;
    private _keydownHandler;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private _hasAnyChildren;
    private _getAllLeafValues;
    private _getCheckState;
    private _toggleNode;
    private _toggleExpand;
    private _selectAll;
    private _clearAll;
    private _togglePopup;
    private _matchesSearch;
    /** Get display labels for currently selected values */
    private _getSelectedLabels;
    private _renderCheckbox;
    private _renderNode;
    private _onExpandRequest;
    private _renderTreeContent;
    render(): import("lit-html").TemplateResult<1>;
}
//# sourceMappingURL=phz-tree-select.d.ts.map