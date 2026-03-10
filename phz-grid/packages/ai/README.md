# @phozart/phz-ai

AI toolkit for phz-grid. Implements the schema-as-contract pattern for AI integration, providing natural language queries, schema inference, anomaly detection, and data insights with pluggable LLM providers.

## Installation

```bash
npm install @phozart/phz-ai @phozart/phz-core
```

## Quick Start

```ts
import { createAIToolkit, OpenAIProvider } from '@phozart/phz-ai';

const ai = createAIToolkit({
  provider: new OpenAIProvider({ apiKey: 'sk-...' }),
});

// Natural language query
const result = await ai.query('Show me the top 5 customers by revenue', {
  schema: gridSchema,
  data: gridData,
});

// Schema inference
const schema = await ai.inferSchema(data, {
  includeDescriptions: true,
  sampleSize: 100,
});

// Anomaly detection
const anomalies = await ai.detectAnomalies(data, {
  fields: ['revenue', 'quantity'],
  sensitivity: 'medium',
});

// Data insights
const insights = await ai.summarize(data, {
  fields: ['revenue', 'category'],
  maxInsights: 5,
});
```

## Providers

Built-in LLM providers:

```ts
import { OpenAIProvider, AnthropicProvider, GoogleProvider } from '@phozart/phz-ai';

// OpenAI
const openai = new OpenAIProvider({
  apiKey: 'sk-...',
  model: 'gpt-4',
});

// Anthropic (Claude)
const anthropic = new AnthropicProvider({
  apiKey: 'sk-ant-...',
  model: 'claude-sonnet-4-5-20250929',
});

// Google (Gemini)
const google = new GoogleProvider({
  apiKey: '...',
  model: 'gemini-pro',
});
```

### Custom Providers

Implement the `AIProvider` interface for any LLM:

```ts
import type { AIProvider, CompletionOptions, CompletionResult } from '@phozart/phz-ai';

class MyProvider implements AIProvider {
  async complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult> {
    // Your implementation
  }
}
```

## API

### `createAIToolkit(config): AIToolkit`

Creates an AI toolkit instance.

```ts
interface AIToolkit {
  query(question: string, options: NLQueryOptions): Promise<AIQueryResult>;
  inferSchema(data: unknown[], options?: InferSchemaOptions): Promise<JSONSchema7>;
  validateSchema(data: unknown[], schema: JSONSchema7): SchemaValidationResult;
  detectAnomalies(data: unknown[], options: AnomalyDetectionOptions): Promise<AnomalyResult[]>;
  suggestDataTypes(data: unknown[]): DataTypeSuggestion[];
  findDuplicates(data: unknown[], fields: string[]): DuplicateResult[];
  summarize(data: unknown[], options?: SummarizeOptions): Promise<Insight[]>;
  suggestFilters(data: unknown[], schema: JSONSchema7): FilterSuggestion[];
}
```

## Types

```ts
import type {
  AIConfig,
  AIProvider,
  AIToolkit,
  CompletionOptions,
  CompletionResult,
  NLQueryOptions,
  AIQueryResult,
  AnomalyDetectionOptions,
  AnomalyResult,
  Insight,
  FilterSuggestion,
  JSONSchema7,
} from '@phozart/phz-ai';
```

## Re-exports

This package re-exports all types from `@phozart/phz-core` for convenience.

## License

MIT
