/**
 * Open widget registry with lazy loading support.
 * Replaces the closed switch in engine/src/widget-resolver.ts.
 */
import type { WidgetManifest, WidgetVariant, InteractionType, FieldRequirement } from '../types.js';
export interface WidgetRenderer<TConfig = unknown> {
    type: string;
    render(config: TConfig, container: HTMLElement, context: RenderContext): void;
    destroy?(): void;
}
export interface RenderContext {
    data: Record<string, unknown>[];
    theme: Record<string, string>;
    locale: string;
}
type RendererEntry = WidgetRenderer | (() => Promise<WidgetRenderer>);
export interface WidgetRegistry {
    register(type: string, renderer: RendererEntry): void;
    get(type: string): WidgetRenderer | undefined;
    has(type: string): boolean;
    list(): string[];
    resolve(type: string): Promise<WidgetRenderer | undefined>;
}
export declare function createWidgetRegistry(): WidgetRegistry;
export interface CapabilityFilter {
    interactions?: InteractionType[];
    fieldRoles?: FieldRequirement['role'][];
}
export interface ManifestRegistry {
    registerManifest(manifest: WidgetManifest): void;
    getManifest(type: string): WidgetManifest | undefined;
    listManifests(): WidgetManifest[];
    listByCategory(category: string): WidgetManifest[];
    findByCapabilities(filter: CapabilityFilter): WidgetManifest[];
    getVariants(type: string): WidgetVariant[];
    resolveVariant(type: string, variantId: string): WidgetVariant | undefined;
}
export declare function createManifestRegistry(): ManifestRegistry;
export {};
//# sourceMappingURL=widget-registry.d.ts.map