/**
 * @phozart/workspace — Widget Picker Utils (L.5)
 *
 * Pure utility functions for filtering, grouping, and searching widget manifests.
 */

import type { WidgetManifest } from '../types.js';
import type { ConsumerCapabilities } from '../client/workspace-client.js';

export function filterManifestsByCapabilities(
  manifests: WidgetManifest[],
  capabilities: ConsumerCapabilities | undefined,
): WidgetManifest[] {
  if (!capabilities) return manifests;
  return manifests.filter(m => capabilities.widgetTypes.includes(m.type));
}

export function groupManifestsByCategory(
  manifests: WidgetManifest[],
): Map<string, WidgetManifest[]> {
  const grouped = new Map<string, WidgetManifest[]>();
  for (const m of manifests) {
    let list = grouped.get(m.category);
    if (!list) {
      list = [];
      grouped.set(m.category, list);
    }
    list.push(m);
  }
  return grouped;
}

export function searchManifests(
  manifests: WidgetManifest[],
  query: string,
): WidgetManifest[] {
  if (!query) return manifests;
  const q = query.toLowerCase();
  return manifests.filter(m =>
    m.name.toLowerCase().includes(q) ||
    m.description.toLowerCase().includes(q) ||
    m.type.toLowerCase().includes(q),
  );
}
