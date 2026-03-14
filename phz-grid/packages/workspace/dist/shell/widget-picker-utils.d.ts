/**
 * @phozart/workspace — Widget Picker Utils (L.5)
 *
 * Pure utility functions for filtering, grouping, and searching widget manifests.
 */
import type { WidgetManifest } from '../types.js';
import type { ConsumerCapabilities } from '../client/workspace-client.js';
export declare function filterManifestsByCapabilities(manifests: WidgetManifest[], capabilities: ConsumerCapabilities | undefined): WidgetManifest[];
export declare function groupManifestsByCategory(manifests: WidgetManifest[]): Map<string, WidgetManifest[]>;
export declare function searchManifests(manifests: WidgetManifest[], query: string): WidgetManifest[];
//# sourceMappingURL=widget-picker-utils.d.ts.map