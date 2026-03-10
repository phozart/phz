/**
 * @phozart/phz-shared — Widget types (A-1.18 through A-1.21)
 *
 * Shared widget position, dashboard widget, widget view,
 * expandable config, container box config, and decision tree types.
 */
/** Absolute position of a widget within a dashboard grid. */
export interface WidgetPosition {
    col: number;
    row: number;
    colSpan: number;
    rowSpan: number;
}
/** A widget placed on a dashboard with its position and configuration. */
export interface DashboardWidget {
    id: string;
    widgetType: string;
    variantId?: string;
    position: WidgetPosition;
    config: Record<string, unknown>;
    dataSourceId?: string;
    title?: string;
    visible: boolean;
}
/** Named view switching mode for widget view groups. */
export type ViewSwitchingMode = 'tabs' | 'dropdown' | 'toggle' | 'auto';
/** A single view within a widget view group. */
export interface WidgetView {
    id: string;
    label: string;
    widgetType: string;
    variantId?: string;
    config: Record<string, unknown>;
}
/** A group of alternative widget views with a switching mechanism. */
export interface WidgetViewGroup {
    id: string;
    label: string;
    views: WidgetView[];
    defaultViewId: string;
    switchingMode: ViewSwitchingMode;
}
/** Determine the best switching mode based on view count. */
export declare function getViewSwitchingMode(viewCount: number): ViewSwitchingMode;
/** Configuration for expandable/collapsible widget behavior. */
export interface ExpandableWidgetConfig {
    /** Whether the widget supports expansion to fullscreen. */
    expandable: boolean;
    /** Whether the widget starts in expanded state. */
    defaultExpanded: boolean;
    /** Animation duration in milliseconds. */
    animationDurationMs: number;
    /** Whether to show expand/collapse toggle in the header. */
    showToggle: boolean;
    /** Maximum height in pixels when collapsed (0 = auto). */
    collapsedMaxHeight: number;
}
/** Create a default expandable widget configuration. */
export declare function createDefaultExpandableConfig(overrides?: Partial<ExpandableWidgetConfig>): ExpandableWidgetConfig;
/** Configuration for a container box that wraps widgets. */
export interface ContainerBoxConfig {
    /** Background color or CSS variable. */
    background: string;
    /** Border radius in pixels. */
    borderRadius: number;
    /** Padding in pixels. */
    padding: number;
    /** Box shadow CSS value. */
    shadow: string;
    /** Border CSS value. */
    border: string;
    /** Minimum height in pixels. */
    minHeight: number;
    /** Whether to show the container header. */
    showHeader: boolean;
    /** Whether to clip overflowing content. */
    clipOverflow: boolean;
}
/** Create a default container box configuration. */
export declare function createDefaultContainerBoxConfig(overrides?: Partial<ContainerBoxConfig>): ContainerBoxConfig;
/** Status of a decision tree node. */
export type NodeStatus = 'pending' | 'active' | 'complete' | 'skipped' | 'error';
/** A node in a decision tree for wizard-style workflows. */
export interface DecisionTreeNode {
    id: string;
    label: string;
    description?: string;
    status: NodeStatus;
    parentId?: string;
    children: string[];
    /** Condition expression that must be met to enter this node. */
    condition?: string;
    /** Data payload associated with this node's completion. */
    data?: Record<string, unknown>;
}
/**
 * Evaluate the status of a node based on its children's statuses.
 * - All children complete => complete
 * - Any child error => error
 * - Any child active => active
 * - Otherwise => pending
 */
export declare function evaluateNodeStatus(node: DecisionTreeNode, allNodes: Map<string, DecisionTreeNode>): NodeStatus;
//# sourceMappingURL=widgets.d.ts.map