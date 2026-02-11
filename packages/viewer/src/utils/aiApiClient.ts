/**
 * API client for streaming LLM requests (OpenAI-compatible endpoints).
 */

import type { LlmEndpoint } from '@story-adventure/shared';

/**
 * Result of an LLM API call.
 */
export interface LlmResponse {
  /** Whether the call was successful */
  success: boolean;
  /** Full accumulated response text */
  content?: string;
  /** Error message if call failed */
  error?: string;
}

/**
 * Content part for multimodal messages.
 */
export type MessageContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

/**
 * Message content can be simple string or array of content parts (for multimodal).
 */
export type MessageContent = string | MessageContentPart[];

/**
 * Options for LLM API requests.
 */
export interface LlmRequestOptions {
  /** LLM endpoint configuration */
  endpoint: LlmEndpoint;
  /** Array of message objects (role + content) */
  messages: Array<{ role: string; content: MessageContent }>;
  /** Optional timeout in milliseconds (default: 120000 = 2 minutes) */
  timeoutMs?: number;
  /** Optional abort signal for cancellation */
  signal?: AbortSignal;
}

/**
 * Parses a Server-Sent Events (SSE) chunk and extracts content deltas.
 *
 * @param chunk - Raw SSE text chunk
 * @returns Array of content strings extracted from the chunk
 */
function parseSSEChunk(chunk: string): string[] {
  const contents: string[] = [];

  // Split by newlines and process each line
  const lines = chunk.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) continue;

    // SSE format: "data: {json}"
    if (trimmed.startsWith('data: ')) {
      const dataContent = trimmed.substring(6); // Remove "data: " prefix

      // Check for [DONE] marker
      if (dataContent === '[DONE]') {
        continue;
      }

      try {
        const parsed = JSON.parse(dataContent);

        // OpenAI streaming format: choices[0].delta.content
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          contents.push(content);
        }
      } catch (error) {
        // Skip unparseable lines
        console.debug('[SSE Parse] Failed to parse line:', dataContent, error);
      }
    }
  }

  return contents;
}

/**
 * Calls an OpenAI-compatible LLM endpoint with streaming.
 *
 * @param options - Request options including endpoint, messages, and timeout
 * @returns Promise resolving to the LLM response
 */
export async function callLlmStreaming(
  options: LlmRequestOptions
): Promise<LlmResponse> {
  const { endpoint, messages, timeoutMs = 120000, signal } = options;

  // Build request body
  const requestBody: {
    messages: Array<{ role: string; content: MessageContent }>;
    stream: boolean;
    model?: string;
  } = {
    messages,
    stream: true,
  };

  // Include model if specified in endpoint config
  if (endpoint.model) {
    requestBody.model = endpoint.model;
  }

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (endpoint.api_key) {
    headers['Authorization'] = `Bearer ${endpoint.api_key}`;
  }

  // Create abort controller for timeout
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

  // Combine timeout signal with optional external signal
  const combinedSignal = signal
    ? (() => {
        const controller = new AbortController();
        signal.addEventListener('abort', () => controller.abort());
        timeoutController.signal.addEventListener('abort', () => controller.abort());
        return controller.signal;
      })()
    : timeoutController.signal;

  try {
    console.debug('[LLM API] Calling endpoint:', endpoint.url);
    console.debug('[LLM API] Request body:', requestBody);

    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: combinedSignal,
    });

    clearTimeout(timeoutId);

    // Check HTTP status
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[LLM API] HTTP error:', response.status, errorText);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText || response.statusText}`,
      };
    }

    // Stream the response
    if (!response.body) {
      return {
        success: false,
        error: 'Response body is null',
      };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // Process any remaining buffered content
          if (buffer.trim()) {
            const finalContents = parseSSEChunk(buffer);
            fullContent += finalContents.join('');
          }
          break;
        }

        // Decode chunk
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process complete SSE messages (separated by double newlines)
        const messages = buffer.split('\n\n');
        // Keep the last incomplete message in the buffer
        buffer = messages.pop() || '';

        // Process complete messages
        for (const message of messages) {
          const contents = parseSSEChunk(message);
          fullContent += contents.join('');
        }
      }

      console.debug('[LLM API] Streaming complete, total length:', fullContent.length);

      return {
        success: true,
        content: fullContent,
      };
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: signal?.aborted ? 'Request was cancelled' : 'Request timed out',
        };
      }

      console.error('[LLM API] Request error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: 'Unknown error occurred',
    };
  }
}
