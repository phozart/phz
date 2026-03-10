/**
 * @phozart/phz-widgets — Attention Widget State (7A-D)
 *
 * Compact attention summary state for dashboard widgets.
 * Supports priority summary, top items, and responsive container variants.
 *
 * Pure functions only — no side effects, no DOM.
 */

import type {
  AttentionPriority,
  FilterableAttentionItem,
} from '@phozart/phz-shared/types';

// ========================================================================
// AttentionWidgetState
// ========================================================================

export interface AttentionWidgetState {
  /** All items provided to the widget. */
  items: FilterableAttentionItem[];
  /** Maximum number of top items to display. */
  maxItems: number;
}

// ========================================================================
// PrioritySummary
// ========================================================================

export interface PrioritySummary {
  critical: number;
  warning: number;
  info: number;
}

// ========================================================================
// Container variant
// ========================================================================

export type AttentionContainerVariant = 'full' | 'compact' | 'minimal';

// ========================================================================
// Priority ordering
// ========================================================================

const PRIORITY_RANK: Record<AttentionPriority, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

// ========================================================================
// initialAttentionWidgetState
// ========================================================================

/**
 * Create initial widget state from attention items.
 *
 * @param items - All attention items to summarize.
 * @param maxItems - Maximum number of top items to show. Defaults to 5.
 */
export function initialAttentionWidgetState(
  items: FilterableAttentionItem[],
  maxItems: number = 5,
): AttentionWidgetState {
  return { items, maxItems };
}

// ========================================================================
// computePrioritySummary
// ========================================================================

/**
 * Count unacknowledged items by priority level.
 */
export function computePrioritySummary(
  state: AttentionWidgetState,
): PrioritySummary {
  const summary: PrioritySummary = { critical: 0, warning: 0, info: 0 };
  for (const item of state.items) {
    if (!item.acknowledged) {
      summary[item.priority] += 1;
    }
  }
  return summary;
}

// ========================================================================
// getTopItems
// ========================================================================

/**
 * Get the top N unacknowledged items sorted by priority then timestamp.
 */
export function getTopItems(
  state: AttentionWidgetState,
  n: number,
): FilterableAttentionItem[] {
  const unacknowledged = state.items.filter(i => !i.acknowledged);
  const sorted = [...unacknowledged].sort((a, b) => {
    const pDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (pDiff !== 0) return pDiff;
    return b.timestamp - a.timestamp;
  });
  return sorted.slice(0, n);
}

// ========================================================================
// getTotalCount
// ========================================================================

/**
 * Get the total count of unacknowledged items.
 */
export function getTotalCount(state: AttentionWidgetState): number {
  return state.items.filter(i => !i.acknowledged).length;
}

// ========================================================================
// getContainerVariant
// ========================================================================

/**
 * Determine the container variant based on available width.
 *
 * - `> 280px`: 'full' (priority bar + top items + "View all")
 * - `200-280px`: 'compact' (priority counts + "View all")
 * - `< 200px`: 'minimal' (badge count only)
 */
export function getContainerVariant(
  containerWidth: number,
): AttentionContainerVariant {
  if (containerWidth > 280) return 'full';
  if (containerWidth >= 200) return 'compact';
  return 'minimal';
}
