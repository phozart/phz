# ADR-007: Schema-as-Contract for AI Integration

## Status
Accepted

## Context

Large Language Models (LLMs) with function calling capabilities (OpenAI GPT-4, Anthropic Claude, Google Gemini) enable natural language interaction with applications. For data grids, this means users can:
- Query data using natural language: "Show me all customers in California"
- Manipulate grid state: "Sort by revenue descending"
- Perform analytics: "What's the average order value by region?"

However, integrating LLMs requires a structured contract between the grid and the AI model.

### The Problem: Unstructured AI Integration

```typescript
// BAD: Unstructured prompt
const response = await llm.chat({
  messages: [
    { role: 'user', content: 'Show me customers in California' }
  ]
});

// AI returns freeform text: "Here are the customers in California: ..."
// - No structured action to execute
// - Can't validate response
// - No type safety
// - Can't handle edge cases
```

### AG Grid's Solution (October 2025)

AG Grid v34.3 introduced an AI Toolkit using **schema-as-contract** pattern:

1. Grid exports JSON Schema describing its API
2. LLM receives schema as function definitions
3. LLM returns structured function calls (not freeform text)
4. Grid validates and executes function calls

```typescript
// AG Grid AI Toolkit (vendor-locked)
const chatPanel = document.querySelector('ag-charts-enterprise-module');
chatPanel.gridApi = gridApi; // Locked to AG Grid
```

**Limitations:**
- Paid license ($2,099/dev/year)
- Vendor-locked (OpenAI only initially)
- Closed-source (can't customize schema)
- React/Angular/Vue wrappers required for framework integration

### Requirements for phz-grid AI Integration

1. **Provider-Agnostic** — Works with OpenAI, Anthropic, Google, local models (Ollama)
2. **Fully Open** — All AI features available under MIT license
3. **Type-Safe** — Auto-generate schemas from TypeScript types
4. **Extensible** — Developers can add custom tools
5. **Testable** — Can unit test AI integration without live API calls
6. **Framework-Agnostic** — Works in React, Vue, Angular, vanilla JS

## Decision

We will implement a **Schema-as-Contract AI Toolkit** using Zod for schema generation and validation.

### Architecture

```
┌─────────────────────────────────────────────────┐
│  Grid State (TypeScript)                        │
│  ├─ data: RowData[]                             │
│  ├─ columns: ColumnDef[]                        │
│  ├─ sortState: SortModel                        │
│  └─ filterState: FilterModel                    │
└─────────────────────────────────────────────────┘
                ↓ (generate schema)
┌─────────────────────────────────────────────────┐
│  Zod Schema                                     │
│  const rowSchema = z.object({                   │
│    name: z.string(),                            │
│    age: z.number(),                             │
│    ...                                          │
│  })                                             │
└─────────────────────────────────────────────────┘
                ↓ (convert to JSON Schema)
┌─────────────────────────────────────────────────┐
│  LLM Tool Definitions (JSON Schema)             │
│  {                                              │
│    name: "filter_rows",                         │
│    parameters: { columnId, operator, value }    │
│  }                                              │
└─────────────────────────────────────────────────┘
                ↓ (function calling)
┌─────────────────────────────────────────────────┐
│  LLM Provider (OpenAI / Anthropic / Google)     │
│  User: "Show me customers in California"       │
│  LLM: filter_rows({ columnId: "state",         │
│        operator: "equals", value: "CA" })       │
└─────────────────────────────────────────────────┘
                ↓ (execute tool call)
┌─────────────────────────────────────────────────┐
│  Tool Executor (Validates + Executes)           │
│  gridApi.setColumnFilter("state",              │
│    { operator: "equals", value: "CA" })         │
└─────────────────────────────────────────────────┘
```

### Implementation

```typescript
// @phozart/phz-ai

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { GridApi, GridState, ColumnDef } from '@phozart/phz-core';

export class AISchemaGenerator {
  constructor(private gridApi: GridApi) {}

  // Generate Zod schema from column definitions
  generateRowSchema(): z.ZodObject<any> {
    const state = this.gridApi.getState();
    const fields: Record<string, z.ZodType<any>> = { _id: z.string() };

    for (const column of state.columns) {
      fields[column.id] = this.columnTypeToZodType(column.type);
    }

    return z.object(fields);
  }

  private columnTypeToZodType(type: string): z.ZodType<any> {
    switch (type) {
      case 'string': return z.string();
      case 'number': return z.number();
      case 'boolean': return z.boolean();
      case 'date': return z.date();
      default: return z.any();
    }
  }

  // Generate LLM tool definitions
  generateToolDefinitions(): ToolDefinition[] {
    const state = this.gridApi.getState();
    const columnIds = state.columns.map(c => c.id);

    return [
      {
        name: 'filter_rows',
        description: 'Filter grid rows by column values',
        parameters: zodToJsonSchema(
          z.object({
            columnId: z.enum(columnIds as [string, ...string[]]),
            operator: z.enum(['equals', 'contains', 'greaterThan', 'lessThan', 'between']),
            value: z.union([z.string(), z.number(), z.boolean()])
          })
        )
      },
      {
        name: 'sort_rows',
        description: 'Sort grid rows by column',
        parameters: zodToJsonSchema(
          z.object({
            columnId: z.enum(columnIds as [string, ...string[]]),
            direction: z.enum(['asc', 'desc'])
          })
        )
      },
      {
        name: 'aggregate_column',
        description: 'Calculate aggregate (sum, avg, min, max, count) for a numeric column',
        parameters: zodToJsonSchema(
          z.object({
            columnId: z.enum(columnIds as [string, ...string[]]),
            operation: z.enum(['sum', 'avg', 'min', 'max', 'count'])
          })
        )
      },
      {
        name: 'group_by',
        description: 'Group rows by column and show aggregated values',
        parameters: zodToJsonSchema(
          z.object({
            columnId: z.enum(columnIds as [string, ...string[]]),
            aggregations: z.array(
              z.object({
                column: z.enum(columnIds as [string, ...string[]]),
                operation: z.enum(['sum', 'avg', 'count'])
              })
            )
          })
        )
      },
      {
        name: 'update_cell',
        description: 'Update a specific cell value',
        parameters: zodToJsonSchema(
          z.object({
            rowId: z.string(),
            columnId: z.enum(columnIds as [string, ...string[]]),
            value: z.union([z.string(), z.number(), z.boolean()])
          })
        )
      }
    ];
  }
}

// Natural Language Query Processor (Provider-Agnostic)
export interface LLMAdapter {
  chat(params: ChatParams): Promise<ChatResponse>;
}

interface ChatParams {
  messages: Message[];
  tools: ToolDefinition[];
  model?: string;
}

interface ChatResponse {
  message: string;
  toolCalls: ToolCall[];
}

interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

export class NLQueryProcessor {
  constructor(
    private gridApi: GridApi,
    private llmAdapter: LLMAdapter
  ) {}

  async processQuery(userQuery: string): Promise<QueryResult> {
    const schemaGen = new AISchemaGenerator(this.gridApi);
    const tools = schemaGen.generateToolDefinitions();

    // Send to LLM with tool definitions
    const response = await this.llmAdapter.chat({
      messages: [
        {
          role: 'system',
          content: `You are a data grid assistant. Use the provided tools to answer user queries about the grid data.
                    The grid has ${this.gridApi.getState().data.length} rows and the following columns:
                    ${this.gridApi.getState().columns.map(c => `${c.name} (${c.type})`).join(', ')}.`
        },
        {
          role: 'user',
          content: userQuery
        }
      ],
      tools
    });

    // Execute tool calls
    const results: any[] = [];
    for (const toolCall of response.toolCalls) {
      const result = await this.executeToolCall(toolCall);
      results.push(result);
    }

    return {
      naturalLanguageResponse: response.message,
      toolResults: results,
      toolCalls: response.toolCalls
    };
  }

  private async executeToolCall(toolCall: ToolCall): Promise<any> {
    // Validate tool call arguments using Zod
    const validator = this.getToolValidator(toolCall.name);
    const validatedArgs = validator.parse(toolCall.arguments);

    switch (toolCall.name) {
      case 'filter_rows':
        return this.gridApi.setColumnFilter(
          validatedArgs.columnId,
          {
            operator: validatedArgs.operator,
            value: validatedArgs.value
          }
        );

      case 'sort_rows':
        return this.gridApi.setSortModel([{
          columnId: validatedArgs.columnId,
          direction: validatedArgs.direction
        }]);

      case 'aggregate_column':
        return this.gridApi.aggregateColumn(
          validatedArgs.columnId,
          validatedArgs.operation
        );

      case 'group_by':
        return this.gridApi.groupBy(
          validatedArgs.columnId,
          validatedArgs.aggregations
        );

      case 'update_cell':
        return this.gridApi.updateCell(
          validatedArgs.rowId,
          validatedArgs.columnId,
          validatedArgs.value
        );

      default:
        throw new Error(`Unknown tool: ${toolCall.name}`);
    }
  }

  private getToolValidator(toolName: string): z.ZodType<any> {
    const state = this.gridApi.getState();
    const columnIds = state.columns.map(c => c.id);

    const validators: Record<string, z.ZodType<any>> = {
      filter_rows: z.object({
        columnId: z.enum(columnIds as [string, ...string[]]),
        operator: z.enum(['equals', 'contains', 'greaterThan', 'lessThan', 'between']),
        value: z.union([z.string(), z.number(), z.boolean()])
      }),
      sort_rows: z.object({
        columnId: z.enum(columnIds as [string, ...string[]]),
        direction: z.enum(['asc', 'desc'])
      }),
      // ... (other validators)
    };

    return validators[toolName];
  }
}

// OpenAI Adapter (example implementation)
export class OpenAIAdapter implements LLMAdapter {
  constructor(private apiKey: string) {}

  async chat(params: ChatParams): Promise<ChatResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: params.model ?? 'gpt-4-turbo-preview',
        messages: params.messages,
        tools: params.tools.map(tool => ({
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
          }
        }))
      })
    });

    const data = await response.json();
    const message = data.choices[0].message;

    return {
      message: message.content ?? '',
      toolCalls: message.tool_calls?.map((tc: any) => ({
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments)
      })) ?? []
    };
  }
}

// Anthropic Adapter (example implementation)
export class AnthropicAdapter implements LLMAdapter {
  constructor(private apiKey: string) {}

  async chat(params: ChatParams): Promise<ChatResponse> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: params.model ?? 'claude-3-opus-20240229',
        max_tokens: 1024,
        tools: params.tools,
        messages: params.messages
      })
    });

    const data = await response.json();
    const content = data.content;

    const toolCalls = content
      .filter((block: any) => block.type === 'tool_use')
      .map((block: any) => ({
        name: block.name,
        arguments: block.input
      }));

    const textContent = content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n');

    return {
      message: textContent,
      toolCalls
    };
  }
}
```

### Usage Example

```typescript
import { createGrid } from '@phozart/phz-core';
import { NLQueryProcessor, OpenAIAdapter } from '@phozart/phz-ai';

// Create grid
const gridApi = createGrid({
  data: customers,
  columns: [
    { id: 'name', name: 'Name', type: 'string' },
    { id: 'state', name: 'State', type: 'string' },
    { id: 'revenue', name: 'Revenue', type: 'number' }
  ]
});

// Initialize AI processor
const aiProcessor = new NLQueryProcessor(
  gridApi,
  new OpenAIAdapter(process.env.OPENAI_API_KEY)
);

// Natural language query
const result = await aiProcessor.processQuery(
  "Show me all customers in California with revenue over $10,000, sorted by revenue descending"
);

// AI executes:
// 1. filter_rows({ columnId: "state", operator: "equals", value: "CA" })
// 2. filter_rows({ columnId: "revenue", operator: "greaterThan", value: 10000 })
// 3. sort_rows({ columnId: "revenue", direction: "desc" })

console.log(result.naturalLanguageResponse);
// "I've filtered the grid to show customers in California with revenue over $10,000, sorted by revenue in descending order. There are 42 matching customers."
```

## Consequences

### Positive

1. **Provider-Agnostic** — Works with any LLM that supports function calling
2. **Type-Safe** — Zod schemas ensure runtime validation
3. **Auto-Generated** — Schemas generated from grid state, stay in sync
4. **Extensible** — Developers can add custom tools
5. **Testable** — Can mock LLM responses for testing
6. **Framework-Agnostic** — Works in React, Vue, Angular, vanilla
7. **Fully Open** — All AI features available under MIT license
8. **Competitive** — Matches AG Grid AI Toolkit (but open and flexible)

### Negative

1. **LLM Cost** — Each query incurs LLM API cost
2. **Latency** — LLM calls add 200-1000ms latency
3. **Accuracy** — LLMs can hallucinate or misinterpret queries
4. **Privacy** — Grid schema and queries sent to LLM provider (unless using local model)
5. **Bundle Size** — Zod adds ~30 KB

### Neutral

1. **LLM Dependency** — Requires LLM API key or local model

## Mitigation Strategies

### Cost Mitigation
- Cache common queries
- Use smaller models (GPT-3.5 instead of GPT-4)
- Support local models (Ollama)

### Privacy Mitigation
- Support on-premises LLMs (Ollama, LLaMA)
- Allow opt-out (disable AI features)
- Don't send row data, only schema

### Accuracy Mitigation
- Validate all tool calls with Zod
- Provide feedback loop (user confirms actions)
- Add example queries to system prompt

## Alternatives Considered

### Alternative 1: Prompt Engineering Only (No Function Calling)
**Rejected** because freeform text responses are unreliable and can't be validated.

### Alternative 2: Vendor-Locked (OpenAI Only)
**Rejected** because we want provider flexibility.

### Alternative 3: JSON Schema Without Zod
**Rejected** because Zod provides runtime validation and TypeScript type inference.

### Alternative 4: GraphQL Schema
**Rejected** because GraphQL is overkill and doesn't map well to LLM function calling.

## References

- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [Anthropic Tool Use](https://docs.anthropic.com/claude/docs/tool-use)
- [Zod Documentation](https://zod.dev/)
- [AG Grid AI Toolkit](https://www.ag-grid.com/javascript-data-grid/integrated-charts-ai-toolkit/)
- [JSON Schema Specification](https://json-schema.org/)

---

**Author**: Solution Architect
**Date**: 2026-02-24
**Stakeholders**: Engineering Leads, Product Manager
**License**: MIT
