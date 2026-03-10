/**
 * @phozart/phz-engine — Embed Manager
 *
 * Generates embed code and shareable config for dashboards.
 * Supports width/height, theme, hideControls, and filterDefaults options.
 */

import type { DashboardId } from './types.js';
import type { EnhancedDashboardConfig } from './dashboard-enhanced.js';

export interface EmbedOptions {
  width?: string;
  height?: string;
  theme?: 'light' | 'dark';
  hideControls?: boolean;
  filterDefaults?: Record<string, unknown>;
}

interface ShareableConfig {
  version: 2;
  id: string;
  name: string;
  description?: string;
  layout: { columns: number; gap: number };
  widgets: unknown[];
  placements: unknown[];
  globalFilters: unknown[];
  theme: unknown;
  metadata: unknown;
  autoRefreshInterval?: number;
}

export class EmbedManager {
  private dashboards = new Map<string, EnhancedDashboardConfig>();

  registerDashboard(config: EnhancedDashboardConfig): void {
    this.dashboards.set(config.id as string, config);
  }

  unregisterDashboard(id: string): void {
    this.dashboards.delete(id);
  }

  generateEmbedCode(dashboardId: string, options?: EmbedOptions): string {
    const config = this.dashboards.get(dashboardId);
    if (!config) throw new Error('Dashboard not found: ' + dashboardId);

    const attrs: string[] = [];
    const styles: string[] = [];

    // Config as base64-encoded JSON attribute
    const configJson = this.generateShareableConfig(dashboardId);
    const configEncoded = btoa(unescape(encodeURIComponent(configJson)));
    attrs.push(`config="${configEncoded}"`);

    if (options?.theme) {
      attrs.push(`theme="${escapeAttr(options.theme)}"`);
    }

    if (options?.hideControls) {
      attrs.push('hide-controls');
    }

    if (options?.filterDefaults) {
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(options.filterDefaults))));
      attrs.push(`filter-defaults="${encoded}"`);
    }

    if (options?.width) styles.push(`width: ${options.width}`);
    if (options?.height) styles.push(`height: ${options.height}`);

    const styleAttr = styles.length > 0 ? ` style="${styles.join('; ')}"` : '';
    const attrStr = attrs.join(' ');

    return `<phz-dashboard ${attrStr}${styleAttr}></phz-dashboard>`;
  }

  generateShareableConfig(dashboardId: string): string {
    const config = this.dashboards.get(dashboardId);
    if (!config) throw new Error('Dashboard not found: ' + dashboardId);

    const shareable: ShareableConfig = {
      version: 2,
      id: config.id as string,
      name: config.name,
      description: config.description,
      layout: { ...config.layout },
      widgets: config.widgets.map(w => ({ ...w })),
      placements: config.placements.map(p => ({ ...p })),
      globalFilters: config.globalFilters.map(f => ({ ...f })),
      theme: { ...config.theme },
      metadata: { ...config.metadata },
      autoRefreshInterval: config.autoRefreshInterval,
    };

    return JSON.stringify(shareable, null, 2);
  }

  loadFromShareableConfig(json: string): EnhancedDashboardConfig {
    let parsed: ShareableConfig;
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new Error('Invalid JSON: ' + json.slice(0, 50));
    }

    if (parsed.version !== 2) {
      throw new Error('Invalid config: expected version 2, got ' + parsed.version);
    }

    return {
      version: 2,
      id: parsed.id as DashboardId,
      name: parsed.name,
      description: parsed.description,
      layout: parsed.layout,
      widgets: parsed.widgets as EnhancedDashboardConfig['widgets'],
      placements: parsed.placements as EnhancedDashboardConfig['placements'],
      globalFilters: parsed.globalFilters as EnhancedDashboardConfig['globalFilters'],
      theme: parsed.theme as EnhancedDashboardConfig['theme'],
      metadata: parsed.metadata as EnhancedDashboardConfig['metadata'],
      autoRefreshInterval: parsed.autoRefreshInterval,
    };
  }
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
