/**
 * @phozart/ai — AI Toolkit
 *
 * Schema-as-contract AI integration for phz-grid.
 * Provides schema inference, natural language queries,
 * anomaly detection, and data insights.
 */
// Factory
export { createAIToolkit } from './ai-toolkit.js';
// Built-in Providers
export { OpenAIProvider, AnthropicProvider, GoogleProvider } from './providers.js';
// Schema Analyzer
export { analyzeSchema, suggestWidgets, suggestLayout } from './schema-analyzer.js';
// Dashboard Generator
export { generateDashboardConfig } from './dashboard-generator.js';
// NL KPI Parser
export { parseKPIDescription } from './nl-parser.js';
// KPI Generator
export { generateKPIConfig } from './kpi-generator.js';
//# sourceMappingURL=index.js.map