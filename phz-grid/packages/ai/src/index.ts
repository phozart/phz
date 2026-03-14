/**
 * @phozart/ai — AI Toolkit
 *
 * Schema-as-contract AI integration for phz-grid.
 * Provides schema inference, natural language queries,
 * anomaly detection, and data insights.
 */

// Types
export type {
  JSONSchema7,
  AIConfig,
  AIProvider,
  AIToolkit,
  CompletionOptions,
  CompletionResult,
  CompletionChunk,
  InferSchemaOptions,
  SchemaValidationResult,
  NLQueryOptions,
  AIQueryResult,
  AnomalyDetectionOptions,
  AnomalyResult,
  DataTypeSuggestion,
  DuplicateResult,
  SummarizeOptions,
  Insight,
  FilterSuggestion,
} from './types.js';

// Factory
export { createAIToolkit } from './ai-toolkit.js';

// Built-in Providers
export { OpenAIProvider, AnthropicProvider, GoogleProvider } from './providers.js';

// Schema Analyzer
export { analyzeSchema, suggestWidgets, suggestLayout } from './schema-analyzer.js';
export type {
  FieldInput, FieldRole, FieldAnalysis, SchemaAnalysis,
  WidgetSuggestion, LayoutPlacement, LayoutSuggestion,
} from './schema-analyzer.js';

// Dashboard Generator
export { generateDashboardConfig } from './dashboard-generator.js';
export type {
  DashboardGeneratorInput, DashboardGeneratorOptions,
  GeneratedDashboard, GeneratedWidget, GeneratedPlacement,
} from './dashboard-generator.js';

// NL KPI Parser
export { parseKPIDescription } from './nl-parser.js';
export type { ParsedKPIDescription } from './nl-parser.js';

// KPI Generator
export { generateKPIConfig } from './kpi-generator.js';
export type { GeneratedKPIConfig, KPIGeneratorSchema, KPIGeneratorField } from './kpi-generator.js';
