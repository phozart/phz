# Scheduled Report Delivery — Design Notes

**Status:** Not yet implemented. This document records the intended design for a future release.

---

## The Gap

The package currently has no mechanism for scheduled delivery of dashboard or report
content to users. The `AlertSubscription.format: 'digest'` is event-driven — it
batches multiple breach notifications within a window into a single delivery. It is
not a scheduled delivery and fires only on breach, not on a schedule.

---

## Intended Design

A `ScheduledDelivery` artifact that a user or admin configures within the workspace.

### Fields

| Field | Type | Purpose |
|-------|------|---------|
| `artifactId` | `string` | Which dashboard or report to deliver |
| `schedule` | `string` | A cron expression or named preset (`daily-morning`, `weekly-monday`, `monthly-first`) |
| `timezone` | `string` | The viewer's timezone for schedule resolution (e.g., `America/New_York`) |
| `format` | `'pdf-snapshot' \| 'csv-data' \| 'widget-images'` | Output format (see below) |
| `filterPresetId` | `string?` | Optional: apply a saved filter preset when generating the snapshot |
| `recipientRef` | `string` | Destination (email address, Slack channel URL, webhook URL) |
| `channelId` | `string` | Which registered `AlertChannelAdapter` to use for delivery |

### Output Formats

| Format | What it produces |
|--------|-----------------|
| `pdf-snapshot` | Rendered dashboard as a PDF — KPIs, charts, and tables laid out as they appear in the browser |
| `csv-data` | Raw data export of the dashboard's underlying query results |
| `widget-images` | Individual chart images (PNG) with KPI values as text — suitable for embedding in emails or Slack messages |

---

## Responsibility Boundary

**The workspace owns:**
- The schedule definition and configuration UI
- The UI for creating and managing scheduled deliveries
- The trigger event (`delivery-due`) fired when the schedule resolves
- Resolving the filter preset and assembling the artifact configuration

**The consumer app owns:**
- Rendering the snapshot (if `pdf-snapshot` format — requires a headless browser or server-side renderer)
- Transport and delivery via `AlertChannelAdapter`
- Cron scheduling infrastructure (the workspace fires `delivery-due` but the consumer must run the scheduler)

The workspace fires a `delivery-due` event with:
```typescript
interface DeliveryDueEvent {
  artifactId: string;
  artifactConfig: DashboardConfig | ReportConfig;
  resolvedFilters: FilterValue[];
  format: 'pdf-snapshot' | 'csv-data' | 'widget-images';
  recipientRef: string;
  channelId: string;
}
```

The consumer app handles the rest.

---

## UI Location

- **Admin**: A "Scheduled Deliveries" item under the GOVERN sidebar section.
  Admins can create deliveries for any published artifact and assign recipients.
- **Viewer self-service** (if enabled): A "Subscribe" button on the artifact
  card in the catalog. Viewers can subscribe themselves to receive a published
  dashboard on a schedule.

---

## Note for Developers

Until this feature ships, scheduled delivery must be implemented entirely in
the consumer app by:

1. Querying the workspace's data layer directly on a cron schedule
2. Rendering the output (PDF/CSV/images) using your own rendering pipeline
3. Delivering via your own notification infrastructure

The workspace's `DataAdapter` and `FilterContextManager` can be used
programmatically to assemble the data — but the schedule, rendering, and
transport are entirely outside the package boundary.
