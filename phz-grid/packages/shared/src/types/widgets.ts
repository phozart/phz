/**
 * @phozart/phz-shared — Widget types (A-1.18 through A-1.21)
 *
 * Shared widget position, dashboard widget, widget view,
 * expandable config, container box config, and decision tree types.
 */

// ========================================================================
// A-1.18: WidgetPosition, DashboardWidget, WidgetView, WidgetViewGroup
// ========================================================================

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
export function getViewSwitchingMode(viewCount: number): ViewSwitchingMode {
  if (viewCount <= 2) return 'toggle';
  if (viewCount <= 5) return 'tabs';
  return 'dropdown';
}

// ========================================================================
// A-1.19: ExpandableWidgetConfig
// ========================================================================

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
export function createDefaultExpandableConfig(
  overrides?: Partial<ExpandableWidgetConfig>,
): ExpandableWidgetConfig {
  return {
    expandable: true,
    defaultExpanded: false,
    animationDurationMs: 200,
    showToggle: true,
    collapsedMaxHeight: 0,
    ...overrides,
  };
}

// ========================================================================
// A-1.20: ContainerBoxConfig
// ========================================================================

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
export function createDefaultContainerBoxConfig(
  overrides?: Partial<ContainerBoxConfig>,
): ContainerBoxConfig {
  return {
    background: 'var(--phz-surface, #ffffff)',
    borderRadius: 8,
    padding: 16,
    shadow: 'var(--phz-shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
    border: '1px solid var(--phz-border, #e5e7eb)',
    minHeight: 120,
    showHeader: true,
    clipOverflow: false,
    ...overrides,
  };
}

// ========================================================================
// A-1.21: DecisionTreeNode
// ========================================================================

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
export function evaluateNodeStatus(
  node: DecisionTreeNode,
  allNodes: Map<string, DecisionTreeNode>,
): NodeStatus {
  if (node.children.length === 0) return node.status;

  const childStatuses = node.children
    .map(id => allNodes.get(id)?.status ?? 'pending');

  if (childStatuses.every(s => s === 'complete')) return 'complete';
  if (childStatuses.every(s => s === 'skipped')) return 'skipped';
  if (childStatuses.some(s => s === 'error')) return 'error';
  if (childStatuses.some(s => s === 'active')) return 'active';
  return 'pending';
}
