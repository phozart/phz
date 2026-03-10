/**
 * @phozart/phz-ai — Built-in AI Providers
 *
 * Provider implementations for OpenAI, Anthropic, and Google.
 * These are thin wrappers that make HTTP calls to the respective APIs.
 */
import type { AIProvider, CompletionOptions, CompletionResult, CompletionChunk, JSONSchema7 } from './types.js';
export declare class OpenAIProvider implements AIProvider {
    readonly name = "openai";
    private apiKey;
    private model;
    private baseURL;
    constructor(config: {
        apiKey: string;
        model?: string;
        baseURL?: string;
    });
    generateCompletion(prompt: string, options?: CompletionOptions): Promise<CompletionResult>;
    generateStructuredOutput<T>(prompt: string, schema: JSONSchema7): Promise<T>;
    streamCompletion(prompt: string, options?: CompletionOptions): AsyncIterable<CompletionChunk>;
    private mapFinishReason;
}
export declare class AnthropicProvider implements AIProvider {
    readonly name = "anthropic";
    private apiKey;
    private model;
    private baseURL;
    constructor(config: {
        apiKey: string;
        model?: string;
        baseURL?: string;
    });
    generateCompletion(prompt: string, options?: CompletionOptions): Promise<CompletionResult>;
    generateStructuredOutput<T>(prompt: string, schema: JSONSchema7): Promise<T>;
    streamCompletion(prompt: string, options?: CompletionOptions): AsyncIterable<CompletionChunk>;
}
export declare class GoogleProvider implements AIProvider {
    readonly name = "google";
    private apiKey;
    private model;
    private baseURL;
    constructor(config: {
        apiKey: string;
        model?: string;
        baseURL?: string;
    });
    generateCompletion(prompt: string, options?: CompletionOptions): Promise<CompletionResult>;
    generateStructuredOutput<T>(prompt: string, schema: JSONSchema7): Promise<T>;
    streamCompletion(prompt: string, options?: CompletionOptions): AsyncIterable<CompletionChunk>;
}
//# sourceMappingURL=providers.d.ts.map