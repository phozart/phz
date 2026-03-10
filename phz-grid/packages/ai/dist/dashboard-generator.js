/**
 * @phozart/phz-ai — Dashboard Generator
 *
 * Generates dashboard configurations from data schema + natural language prompt.
 * Uses heuristic-based schema analysis (no LLM calls).
 */
import { analyzeSchema, suggestWidgets, suggestLayout } from './schema-analyzer.js';
// --- Generator ---
let widgetCounter = 0;
function generateWidgetId(type) {
    return `ai-${type}-${++widgetCounter}`;
}
export function generateDashboardConfig(input) {
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
    const widgets = [];
    const placements = [];
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
function deriveName(prompt) {
    const cleaned = prompt.trim();
    if (!cleaned)
        return 'Dashboard';
    // Capitalize first letter
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
//# sourceMappingURL=dashboard-generator.js.map