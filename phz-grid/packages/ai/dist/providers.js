/**
 * @phozart/phz-ai — Built-in AI Providers
 *
 * Provider implementations for OpenAI, Anthropic, and Google.
 * These are thin wrappers that make HTTP calls to the respective APIs.
 */
// --- Base HTTP helper ---
async function fetchJSON(url, body, headers) {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`API error ${response.status}: ${text}`);
    }
    return response.json();
}
// --- OpenAI Provider ---
export class OpenAIProvider {
    name = 'openai';
    apiKey;
    model;
    baseURL;
    constructor(config) {
        this.apiKey = config.apiKey;
        this.model = config.model ?? 'gpt-4o';
        this.baseURL = config.baseURL ?? 'https://api.openai.com/v1';
    }
    async generateCompletion(prompt, options) {
        const messages = [
            ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
            { role: 'user', content: prompt },
        ];
        const result = await fetchJSON(`${this.baseURL}/chat/completions`, {
            model: this.model,
            messages,
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.maxTokens ?? 1000,
            ...(options?.stopSequences ? { stop: options.stopSequences } : {}),
        }, { Authorization: `Bearer ${this.apiKey}` });
        const choices = result['choices'];
        const choice = choices[0];
        const message = choice['message'];
        const usage = result['usage'];
        return {
            text: String(message['content'] ?? ''),
            model: String(result['model'] ?? this.model),
            usage: {
                promptTokens: usage?.['prompt_tokens'] ?? 0,
                completionTokens: usage?.['completion_tokens'] ?? 0,
                totalTokens: usage?.['total_tokens'] ?? 0,
            },
            finishReason: this.mapFinishReason(String(choice['finish_reason'] ?? 'stop')),
        };
    }
    async generateStructuredOutput(prompt, schema) {
        const result = await this.generateCompletion(`${prompt}\n\nRespond with valid JSON matching this schema:\n${JSON.stringify(schema)}`, { temperature: 0 });
        return JSON.parse(result.text);
    }
    async *streamCompletion(prompt, options) {
        const messages = [
            ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
            { role: 'user', content: prompt },
        ];
        const response = await fetch(`${this.baseURL}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
            body: JSON.stringify({
                model: this.model,
                messages,
                temperature: options?.temperature ?? 0.7,
                max_tokens: options?.maxTokens ?? 1000,
                stream: true,
            }),
        });
        if (!response.ok || !response.body) {
            throw new Error(`OpenAI stream error: ${response.status}`);
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let index = 0;
        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith('data: ') || trimmed === 'data: [DONE]')
                    continue;
                try {
                    const data = JSON.parse(trimmed.slice(6));
                    const choices = data['choices'];
                    const delta = choices?.[0]?.['delta'];
                    const content = delta?.['content'];
                    if (typeof content === 'string') {
                        yield {
                            text: content,
                            index: index++,
                            finishReason: choices?.[0]?.['finish_reason'] ? this.mapFinishReason(String(choices[0]['finish_reason'])) : undefined,
                        };
                    }
                }
                catch {
                    // skip malformed chunks
                }
            }
        }
    }
    mapFinishReason(reason) {
        if (reason === 'length')
            return 'length';
        if (reason === 'content_filter')
            return 'content_filter';
        return 'stop';
    }
}
// --- Anthropic Provider ---
export class AnthropicProvider {
    name = 'anthropic';
    apiKey;
    model;
    baseURL;
    constructor(config) {
        this.apiKey = config.apiKey;
        this.model = config.model ?? 'claude-sonnet-4-5-20250929';
        this.baseURL = config.baseURL ?? 'https://api.anthropic.com/v1';
    }
    async generateCompletion(prompt, options) {
        const result = await fetchJSON(`${this.baseURL}/messages`, {
            model: this.model,
            max_tokens: options?.maxTokens ?? 1000,
            ...(options?.systemPrompt ? { system: options.systemPrompt } : {}),
            messages: [{ role: 'user', content: prompt }],
            ...(options?.stopSequences ? { stop_sequences: options.stopSequences } : {}),
        }, {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
        });
        const content = result['content'];
        const usage = result['usage'];
        return {
            text: content.map((c) => String(c['text'] ?? '')).join(''),
            model: String(result['model'] ?? this.model),
            usage: {
                promptTokens: usage?.['input_tokens'] ?? 0,
                completionTokens: usage?.['output_tokens'] ?? 0,
                totalTokens: (usage?.['input_tokens'] ?? 0) + (usage?.['output_tokens'] ?? 0),
            },
            finishReason: result['stop_reason'] === 'max_tokens' ? 'length' : 'stop',
        };
    }
    async generateStructuredOutput(prompt, schema) {
        const result = await this.generateCompletion(`${prompt}\n\nRespond with valid JSON matching this schema:\n${JSON.stringify(schema)}`, { temperature: 0 });
        // Extract JSON from response
        const text = result.text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch)
            throw new Error('No JSON found in response');
        return JSON.parse(jsonMatch[0]);
    }
    async *streamCompletion(prompt, options) {
        const response = await fetch(`${this.baseURL}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: options?.maxTokens ?? 1000,
                messages: [{ role: 'user', content: prompt }],
                stream: true,
            }),
        });
        if (!response.ok || !response.body) {
            throw new Error(`Anthropic stream error: ${response.status}`);
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let index = 0;
        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith('data: '))
                    continue;
                try {
                    const data = JSON.parse(trimmed.slice(6));
                    if (data['type'] === 'content_block_delta') {
                        const delta = data['delta'];
                        if (delta?.['type'] === 'text_delta') {
                            yield {
                                text: String(delta['text'] ?? ''),
                                index: index++,
                            };
                        }
                    }
                    else if (data['type'] === 'message_stop') {
                        yield {
                            text: '',
                            index: index++,
                            finishReason: 'stop',
                        };
                    }
                }
                catch {
                    // skip malformed chunks
                }
            }
        }
    }
}
// --- Google Provider ---
export class GoogleProvider {
    name = 'google';
    apiKey;
    model;
    baseURL;
    constructor(config) {
        this.apiKey = config.apiKey;
        this.model = config.model ?? 'gemini-2.0-flash';
        this.baseURL = config.baseURL ?? 'https://generativelanguage.googleapis.com/v1beta';
    }
    async generateCompletion(prompt, options) {
        const result = await fetchJSON(`${this.baseURL}/models/${this.model}:generateContent?key=${this.apiKey}`, {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: options?.temperature ?? 0.7,
                maxOutputTokens: options?.maxTokens ?? 1000,
                ...(options?.stopSequences ? { stopSequences: options.stopSequences } : {}),
            },
            ...(options?.systemPrompt ? { systemInstruction: { parts: [{ text: options.systemPrompt }] } } : {}),
        }, {});
        const candidates = result['candidates'];
        const content = candidates?.[0]?.['content'];
        const parts = content?.['parts'];
        const usageMetadata = result['usageMetadata'];
        return {
            text: parts?.map((p) => String(p['text'] ?? '')).join('') ?? '',
            model: this.model,
            usage: {
                promptTokens: usageMetadata?.['promptTokenCount'] ?? 0,
                completionTokens: usageMetadata?.['candidatesTokenCount'] ?? 0,
                totalTokens: usageMetadata?.['totalTokenCount'] ?? 0,
            },
            finishReason: 'stop',
        };
    }
    async generateStructuredOutput(prompt, schema) {
        const result = await this.generateCompletion(`${prompt}\n\nRespond with valid JSON matching this schema:\n${JSON.stringify(schema)}`, { temperature: 0 });
        const text = result.text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch)
            throw new Error('No JSON found in response');
        return JSON.parse(jsonMatch[0]);
    }
    async *streamCompletion(prompt, options) {
        const response = await fetch(`${this.baseURL}/models/${this.model}:streamGenerateContent?key=${this.apiKey}&alt=sse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: options?.temperature ?? 0.7,
                    maxOutputTokens: options?.maxTokens ?? 1000,
                },
            }),
        });
        if (!response.ok || !response.body) {
            throw new Error(`Google stream error: ${response.status}`);
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let index = 0;
        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith('data: '))
                    continue;
                try {
                    const data = JSON.parse(trimmed.slice(6));
                    const candidates = data['candidates'];
                    const content = candidates?.[0]?.['content'];
                    const parts = content?.['parts'];
                    if (parts) {
                        for (const part of parts) {
                            if (part['text']) {
                                yield { text: String(part['text']), index: index++ };
                            }
                        }
                    }
                }
                catch {
                    // skip malformed chunks
                }
            }
        }
    }
}
//# sourceMappingURL=providers.js.map