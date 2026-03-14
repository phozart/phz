/**
 * @phozart/workspace — Template Selection Logic
 *
 * Orchestrates the existing template pipeline for the creation flow.
 * Connects schema analysis -> template matching -> field auto-binding.
 */

import type { DataSourceSchema } from '../data-adapter.js';
import type { TemplateDefinition } from '../types.js';
import { analyzeSchema } from '../templates/schema-analyzer.js';
import type { FieldProfile } from '../templates/schema-analyzer.js';
import { matchTemplates } from '../templates/template-matcher.js';
import type { ScoredTemplate } from '../templates/template-matcher.js';
import { autoBindFields, resolveBindings } from '../templates/template-bindings.js';
import { DEFAULT_TEMPLATES } from '../templates/default-templates.js';
import type { DashboardEditorState, DashboardWidgetState } from './dashboard-editor-state.js';
import { getMorphGroup } from './dashboard-editor-state.js';

export interface TemplateSuggestion {
  template: TemplateDefinition;
  score: number;
  rationale: string;
  previewDescription: string;
}

export function suggestTemplatesForSource(
  schema: DataSourceSchema,
  templates?: TemplateDefinition[],
): TemplateSuggestion[] {
  const profile = analyzeSchema(schema);
  const scored = matchTemplates(profile, templates ?? DEFAULT_TEMPLATES);

  return scored
    .filter(s => s.score > 0)
    .map(s => ({
      template: s.template,
      score: s.score,
      rationale: s.matchedRationales.join('; ') || 'General match',
      previewDescription: buildPreviewDescription(s),
    }));
}

function buildPreviewDescription(scored: ScoredTemplate): string {
  const { template, profile } = scored;
  const widgetCount = template.widgetSlots.length;
  const parts: string[] = [`${widgetCount} widget${widgetCount !== 1 ? 's' : ''}`];

  const types = new Set(template.widgetSlots.map(s => s.widgetType));
  if (types.has('kpi-card')) parts.push('KPI cards');
  if (types.has('bar-chart') || types.has('line-chart') || types.has('area-chart')) parts.push('charts');
  if (types.has('data-table')) parts.push('data table');
  if (types.has('trend-line')) parts.push('trend line');
  if (types.has('pie-chart')) parts.push('pie chart');
  if (types.has('gauge')) parts.push('gauges');

  if (profile.hasTimeSeries) parts.push('time series');
  if (profile.hasMultipleMeasures) parts.push('multi-measure');

  return parts.join(', ');
}

let templateWidgetCounter = 0;

export function applyTemplate(
  template: TemplateDefinition,
  schema: DataSourceSchema,
  dataSourceId: string,
): DashboardEditorState {
  const profile = analyzeSchema(schema);
  const bindings = autoBindFields(template.widgetSlots, profile);
  const resolvedMap = resolveBindings(template.widgetSlots, bindings);

  const widgets: DashboardWidgetState[] = template.widgetSlots.map((slot, idx) => {
    templateWidgetCounter++;
    const resolved = resolvedMap.get(slot.slotId) ?? {};

    // Build data config from resolved field bindings
    const dimensions: Array<{ field: string; alias?: string }> = [];
    const measures: Array<{ field: string; aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'count_distinct'; alias?: string }> = [];

    for (const [_key, fieldName] of Object.entries(resolved)) {
      if (fieldName === 'all') continue; // special 'all' binding for tables
      if (profile.suggestedMeasures.includes(fieldName)) {
        measures.push({ field: fieldName, aggregation: 'sum' });
      } else {
        dimensions.push({ field: fieldName });
      }
    }

    return {
      id: `tpl_w_${templateWidgetCounter}`,
      type: slot.widgetType,
      morphGroup: getMorphGroup(slot.widgetType),
      config: { ...slot.defaultConfig, title: slot.widgetType.replace(/-/g, ' ') },
      dataConfig: { dimensions, measures, filters: [] },
      position: { row: Math.floor(idx / 3), col: (idx % 3) * 4, colSpan: 4, rowSpan: 2 },
    };
  });

  return {
    name: template.name,
    dataSourceId,
    dataSources: [{ slotId: 'primary', dataSourceId, alias: 'Primary' }],
    sourceRelationships: [],
    widgets,
    layout: template.layout,
    filters: {
      filters: [],
      position: 'top',
      collapsible: true,
      defaultCollapsed: false,
      showActiveFilterCount: true,
      showPresetPicker: false,
      dependencies: [],
    },
    crossFilterRules: [],
    configPanelTab: 'data',
    showFieldPalette: true,
    showConfigPanel: false,
    canvasZoom: 1,
    gridSnap: true,
    editorMode: 'edit',
    pages: [{
      id: 'page_tpl_1',
      label: 'Page 1',
      pageType: 'canvas',
      layout: template.layout,
      widgets,
    }],
    activePageId: 'page_tpl_1',
    pageNavConfig: { position: 'top', style: 'tabs', showLabels: true, collapsible: false },
    canvasMode: 'auto-grid',
    freeformConfig: { columns: 48, rows: 36, cellSizePx: 20, gapPx: 4, snapToGrid: true },
  };
}

export function saveAsTemplate(
  dashboardState: DashboardEditorState,
  meta: { name: string; description: string; category: string; tags?: string[] },
): TemplateDefinition {
  // Convert current dashboard state into a reusable template
  const widgetSlots = dashboardState.widgets.map(w => ({
    slotId: w.id,
    widgetType: w.type,
    defaultConfig: { ...w.config },
    fieldBindings: buildFieldBindingsFromData(w),
  }));

  return {
    id: `tpl_custom_${Date.now()}` as TemplateDefinition['id'],
    name: meta.name,
    description: meta.description,
    category: meta.category,
    layout: dashboardState.layout,
    widgetSlots,
    matchRules: [], // Custom templates don't auto-match
    tags: meta.tags ?? [],
    builtIn: false,
  };
}

function buildFieldBindingsFromData(widget: DashboardWidgetState): Record<string, string> {
  const bindings: Record<string, string> = {};
  widget.dataConfig.dimensions.forEach((d, i) => {
    bindings[i === 0 ? 'category' : `dimension_${i}`] = d.field;
  });
  widget.dataConfig.measures.forEach((m, i) => {
    bindings[i === 0 ? 'value' : `measure_${i}`] = m.field;
  });
  return bindings;
}

// For testing
export function _resetTemplateWidgetCounter(): void {
  templateWidgetCounter = 0;
}
