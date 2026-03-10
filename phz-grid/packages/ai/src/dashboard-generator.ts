/**
 * @phozart/phz-ai — Dashboard Generator
 *
 * Generates dashboard configurations from data schema + natural language prompt.
 * Uses heuristic-based schema analysis (no LLM calls).
 */

import type { WidgetType } from '@phozart/phz-engine';
import type { FieldInput, WidgetSuggestion } from './schema-analyzer.js';
import { analyzeSchema, suggestWidgets, suggestLayout } from './schema-analyzer.js';

// --- Types ---

export interface DashboardGeneratorOptions {
  name?: string;
  maxWidgets?: number;
  columns?: number;
}

export interface DashboardGeneratorInput {
  fields: FieldInput[];
  prompt: string;
  options?: DashboardGeneratorOptions;
}

export interface GeneratedWidget {
  id: string;
  type: WidgetType;
  name: string;
  fields: string[];
}

export interface GeneratedPlacement {
  widgetId: string;
  column: number;
  order: number;
  colSpan: number;
}

export interface GeneratedDashboard {
  name: string;
  layout: { columns: number; gap: number };
  widgets: GeneratedWidget[];
  placements: GeneratedPlacement[];
}

// --- Generator ---

let widgetCounter = 0;

function generateWidgetId(type: WidgetType): string {
  return `ai-${type}-${++widgetCounter}`;
}

export function generateDashboardConfig(input: DashboardGeneratorInput): GeneratedDashboard {
  const { fields, prompt, options } = input;

  if (fields.length === 0) {
    return {
      name: options?.name ?? deriveName(prompt),
      layout: { columns: options?.columns ?? 3, gap: 16 },
      widgets: [],
      placements: [],
    };
  }

  // Analyze schema
  const analysis = analyzeSchema(fields);

  // Get widget suggestions
  let suggestions = suggestWidgets(analysis);

  // Apply maxWidgets limit
  if (options?.maxWidgets && suggestions.length > options.maxWidgets) {
    suggestions = suggestions.slice(0, options.maxWidgets);
  }

  // Generate layout
  const layoutSuggestion = suggestLayout(suggestions);
  const columns = options?.columns ?? layoutSuggestion.columns;

  // Build widgets and placements
  const widgets: GeneratedWidget[] = [];
  const placements: GeneratedPlacement[] = [];

  for (let i = 0; i < suggestions.length; i++) {
    const suggestion = suggestions[i];
    const id = generateWidgetId(suggestion.widgetType);

    widgets.push({
      id,
      type: suggestion.widgetType,
      name: suggestion.title,
      fields: suggestion.fields,
    });

    const lp = layoutSuggestion.placements[i];
    placements.push({
      widgetId: id,
      column: lp?.column ?? 0,
      order: lp?.order ?? i,
      colSpan: lp?.colSpan ?? 1,
    });
  }

  return {
    name: options?.name ?? deriveName(prompt),
    layout: { columns, gap: 16 },
    widgets,
    placements,
  };
}

// --- Helpers ---

function deriveName(prompt: string): string {
  const cleaned = prompt.trim();
  if (!cleaned) return 'Dashboard';
  // Capitalize first letter
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
