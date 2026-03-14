/**
 * @phozart/ai — Unit Tests
 *
 * Tests for type exports, factory function, provider classes,
 * and toolkit behavior.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createAIToolkit,
  OpenAIProvider,
  AnthropicProvider,
  GoogleProvider,
} from '../index.js';
import type {
  AIConfig,
  AIToolkit,
  AIProvider,
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
  JSONSchema7,
} from '../index.js';

// Mock provider for testing
function createMockProvider(): AIProvider {
  return {
    name: 'mock',
    async generateCompletion(prompt: string) {
      return {
        text: 'mock response',
        model: 'mock-model',
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        finishReason: 'stop' as const,
      };
    },
    async generateStructuredOutput<T>(_prompt: string, _schema: JSONSchema7): Promise<T> {
      throw new Error('Mock provider: structured output not available');
    },
    async *streamCompletion(prompt: string) {
      yield { text: 'hello', index: 0 };
      yield { text: ' world', index: 1, finishReason: 'stop' as const };
    },
  };
}

describe('@phozart/ai', () => {
  describe('type exports', () => {
    it('exports createAIToolkit factory', () => {
      expect(createAIToolkit).toBeDefined();
      expect(typeof createAIToolkit).toBe('function');
    });

    it('exports provider classes', () => {
      expect(OpenAIProvider).toBeDefined();
      expect(AnthropicProvider).toBeDefined();
      expect(GoogleProvider).toBeDefined();
    });

    it('AIConfig type is usable', () => {
      const config: AIConfig = {
        provider: createMockProvider(),
        model: 'gpt-4o',
        apiKey: 'test-key',
        temperature: 0.7,
        maxTokens: 1000,
        enableCaching: true,
        enableLogging: false,
      };
      expect(config.model).toBe('gpt-4o');
    });

    it('CompletionResult type is usable', () => {
      const result: CompletionResult = {
        text: 'hello',
        model: 'gpt-4o',
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        finishReason: 'stop',
      };
      expect(result.finishReason).toBe('stop');
    });

    it('AnomalyResult type is usable', () => {
      const anomaly: AnomalyResult = {
        rowId: 'row-1',
        column: 'price',
        value: 99999,
        score: 3.5,
        reason: 'Z-score exceeds threshold',
        severity: 'high',
      };
      expect(anomaly.severity).toBe('high');
    });

    it('Insight type is usable', () => {
      const insight: Insight = {
        type: 'trend',
        title: 'Rising prices',
        description: 'Prices increased 15% over the period',
        columns: ['price', 'date'],
        confidence: 0.85,
        visualization: { type: 'line', data: [] },
      };
      expect(insight.type).toBe('trend');
    });
  });

  describe('createAIToolkit', () => {
    it('creates a toolkit instance', () => {
      const toolkit = createAIToolkit({ provider: createMockProvider() });
      expect(toolkit).toBeDefined();
      expect(typeof toolkit.getStructuredSchema).toBe('function');
      expect(typeof toolkit.inferSchema).toBe('function');
      expect(typeof toolkit.validateSchema).toBe('function');
      expect(typeof toolkit.executeNaturalLanguageQuery).toBe('function');
      expect(typeof toolkit.explainQuery).toBe('function');
      expect(typeof toolkit.suggestQueries).toBe('function');
      expect(typeof toolkit.detectAnomalies).toBe('function');
      expect(typeof toolkit.suggestDataTypes).toBe('function');
      expect(typeof toolkit.detectDuplicates).toBe('function');
      expect(typeof toolkit.summarize).toBe('function');
      expect(typeof toolkit.generateInsights).toBe('function');
      expect(typeof toolkit.suggestFilters).toBe('function');
      expect(typeof toolkit.autoCompleteValue).toBe('function');
      expect(typeof toolkit.attachToGrid).toBe('function');
      expect(typeof toolkit.detachFromGrid).toBe('function');
    });

    it('throws when getStructuredSchema called without grid', () => {
      const toolkit = createAIToolkit({ provider: createMockProvider() });
      expect(() => toolkit.getStructuredSchema()).toThrow('Not attached to grid');
    });

    it('returns empty results when not attached to grid', async () => {
      const toolkit = createAIToolkit({ provider: createMockProvider() });
      const anomalies = await toolkit.detectAnomalies('col');
      expect(anomalies).toEqual([]);

      const dupes = await toolkit.detectDuplicates();
      expect(dupes).toEqual([]);

      const completions = await toolkit.autoCompleteValue('col', 'a');
      expect(completions).toEqual([]);
    });
  });

  describe('schema inference', () => {
    it('infers schema from sample data via heuristic fallback', async () => {
      const toolkit = createAIToolkit({ provider: createMockProvider() });
      const sampleData = [
        { id: 1, name: 'Alice', active: true, created: '2024-01-15' },
        { id: 2, name: 'Bob', active: false, created: '2024-02-20' },
        { id: 3, name: 'Charlie', active: true, created: '2024-03-10' },
      ];

      const schema = await toolkit.inferSchema(sampleData);
      expect(schema.length).toBe(4);
      expect(schema.find((c) => c.field === 'id')?.type).toBe('number');
      expect(schema.find((c) => c.field === 'active')?.type).toBe('boolean');
      expect(schema.find((c) => c.field === 'created')?.type).toBe('date');
      expect(schema.find((c) => c.field === 'name')?.type).toBe('string');
    });

    it('returns empty for empty data', async () => {
      const toolkit = createAIToolkit({ provider: createMockProvider() });
      const schema = await toolkit.inferSchema([]);
      expect(schema).toEqual([]);
    });
  });

  describe('schema validation', () => {
    it('validates data against schema', async () => {
      const toolkit = createAIToolkit({ provider: createMockProvider() });
      const schema = [
        { field: 'id', type: 'number' as const },
        { field: 'name', type: 'string' as const },
      ];
      const data = [
        { id: 1, name: 'Alice' },
        { id: 'not-a-number', name: 'Bob' },
      ];

      const result = await toolkit.validateSchema(schema, data);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].column).toBe('id');
      expect(result.errors[0].row).toBe(1);
    });

    it('reports valid for correct data', async () => {
      const toolkit = createAIToolkit({ provider: createMockProvider() });
      const schema = [{ field: 'id', type: 'number' as const }];
      const data = [{ id: 1 }, { id: 2 }];

      const result = await toolkit.validateSchema(schema, data);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.coverage).toBe(1);
    });
  });

  describe('data type suggestions', () => {
    it('suggests number type for string-encoded numbers', async () => {
      const toolkit = createAIToolkit({ provider: createMockProvider() });
      const data = [
        { price: '10.50' },
        { price: '20.00' },
        { price: '30.75' },
      ];

      const suggestions = await toolkit.suggestDataTypes(data);
      expect(suggestions.length).toBeGreaterThan(0);
      const priceSuggestion = suggestions.find((s) => s.column === 'price');
      expect(priceSuggestion?.suggestedType).toBe('number');
    });

    it('returns empty for empty data', async () => {
      const toolkit = createAIToolkit({ provider: createMockProvider() });
      const suggestions = await toolkit.suggestDataTypes([]);
      expect(suggestions).toEqual([]);
    });
  });

  describe('providers', () => {
    it('OpenAIProvider has correct name', () => {
      const provider = new OpenAIProvider({ apiKey: 'test' });
      expect(provider.name).toBe('openai');
    });

    it('AnthropicProvider has correct name', () => {
      const provider = new AnthropicProvider({ apiKey: 'test' });
      expect(provider.name).toBe('anthropic');
    });

    it('GoogleProvider has correct name', () => {
      const provider = new GoogleProvider({ apiKey: 'test' });
      expect(provider.name).toBe('google');
    });
  });

  describe('does not re-export core (tree-shaking fix)', () => {
    it('core symbols are not re-exported', async () => {
      const mod = await import('../index.js');
      expect((mod as any).createGrid).toBeUndefined();
      expect((mod as any).EventEmitter).toBeUndefined();
    });
  });
});
