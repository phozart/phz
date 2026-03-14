/**
 * @phozart/shared — AlertChannelAdapter SPI
 *
 * Contract for delivering alert notifications through various channels
 * (email, Slack, webhook, in-app, etc.). Each channel provides its own
 * implementation of this adapter.
 */

// ========================================================================
// AlertSubscriber — recipient of alert notifications
// ========================================================================

export interface AlertSubscriber {
  id: string;
  channelId: string;
  recipientRef: string;
  format: 'inline' | 'digest' | 'webhook';
  active: boolean;
}

// ========================================================================
// AlertEvent — alert notification payload
// ========================================================================

export interface AlertEvent {
  alertId: string;
  ruleId: string;
  ruleName: string;
  artifactId: string;
  widgetId?: string;
  severity: 'info' | 'warning' | 'critical';
  currentValue: number;
  thresholdValue: number;
  message: string;
  detectedAt: number;
  metadata?: Record<string, unknown>;
}

// ========================================================================
// AlertChannelAdapter interface
// ========================================================================

/**
 * Alert delivery channel SPI. Consumer applications implement one adapter
 * per delivery channel (email, Slack, Teams, webhook, in-app, etc.).
 */
export interface AlertChannelAdapter {
  /**
   * Unique identifier for this channel (e.g. 'email', 'slack', 'webhook').
   */
  readonly channelId: string;

  /**
   * Human-readable name for the channel.
   */
  readonly channelName: string;

  /**
   * Send an alert event to a subscriber.
   */
  send(event: AlertEvent, subscriber: AlertSubscriber): Promise<void>;

  /**
   * Test connectivity / configuration for this channel.
   * Returns true if the channel is operational.
   */
  test(): Promise<boolean>;

  /**
   * Optional JSON schema describing the channel's configuration.
   */
  configSchema?: unknown;
}
