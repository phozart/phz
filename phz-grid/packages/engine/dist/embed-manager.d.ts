/**
 * @phozart/engine — Embed Manager
 *
 * Generates embed code and shareable config for dashboards.
 * Supports width/height, theme, hideControls, and filterDefaults options.
 */
import type { EnhancedDashboardConfig } from './dashboard-enhanced.js';
export interface EmbedOptions {
    width?: string;
    height?: string;
    theme?: 'light' | 'dark';
    hideControls?: boolean;
    filterDefaults?: Record<string, unknown>;
}
export declare class EmbedManager {
    private dashboards;
    registerDashboard(config: EnhancedDashboardConfig): void;
    unregisterDashboard(id: string): void;
    generateEmbedCode(dashboardId: string, options?: EmbedOptions): string;
    generateShareableConfig(dashboardId: string): string;
    loadFromShareableConfig(json: string): EnhancedDashboardConfig;
}
//# sourceMappingURL=embed-manager.d.ts.map