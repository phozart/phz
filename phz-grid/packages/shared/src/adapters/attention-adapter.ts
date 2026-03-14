/**
 * @phozart/shared — AttentionAdapter SPI
 *
 * Contract for providing external attention items (notifications,
 * alerts, action items) that the shell displays in the attention
 * panel. Items are scoped to the current viewer.
 */

import type { ViewerContext } from './data-adapter.js';

// ========================================================================
// AttentionItem — a single attention-requiring item
// ========================================================================

export interface AttentionItem {
  id: string;
  type: 'alert' | 'notification' | 'action' | 'info';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  artifactId?: string;
  widgetId?: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
}

// ========================================================================
// AttentionAdapter interface
// ========================================================================

/**
 * External attention items SPI. Consumer applications implement this
 * to inject notifications, alerts, and action items into the shell's
 * attention panel.
 */
export interface AttentionAdapter {
  /**
   * Fetch attention items for the current viewer.
   * Results should be ordered by timestamp descending (newest first).
   */
  getItems(
    context: ViewerContext,
    options?: {
      limit?: number;
      offset?: number;
      types?: AttentionItem['type'][];
      unreadOnly?: boolean;
    },
  ): Promise<{ items: AttentionItem[]; totalCount: number }>;

  /**
   * Mark one or more items as read.
   */
  markAsRead(itemIds: string[]): Promise<void>;

  /**
   * Mark all items as read for the current viewer.
   */
  markAllAsRead(context: ViewerContext): Promise<void>;

  /**
   * Dismiss (permanently hide) an item.
   */
  dismiss(itemId: string): Promise<void>;
}
