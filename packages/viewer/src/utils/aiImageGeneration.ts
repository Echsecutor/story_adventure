/**
 * Utility functions for AI image generation using OpenAI-compatible API.
 */

import type { ImageGenConfig } from './aiPreferences';

export interface ImageGenerationOptions {
  config: ImageGenConfig;
  prompt: string;
  size?: string;
  timeoutMs?: number;
}

export interface ImageGenerationResult {
  success: boolean;
  imageDataUrl?: string;
  error?: string;
}

/**
 * Generate an image using the configured image generation API.
 * 
 * @param options - Image generation options including config and prompt
 * @returns Result object with success status and image data URL or error
 */
export async function generateImage(
  options: ImageGenerationOptions
): Promise<ImageGenerationResult> {
  const { config, prompt, size = '1024x1024', timeoutMs = 60000 } = options;

  if (!config.url) {
    return {
      success: false,
      error: 'No image generation endpoint URL configured',
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    console.log('[Image Generation] Generating image with prompt:', prompt);

    // Model is required - use configured model or default
    const model = config.model && config.model.trim() !== '' 
      ? config.model.trim() 
      : 'dall-e-3';

    const requestBody: Record<string, unknown> = {
      model,
      prompt,
      n: 1,
      size,
      response_format: 'b64_json',
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add API key if specified
    if (config.api_key) {
      headers['Authorization'] = `Bearer ${config.api_key}`;
    }

    const response = await fetch(config.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Image Generation] HTTP error:', response.status, errorText);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();
    console.log('[Image Generation] Response received');

    // Check for API error in response
    if (data.error) {
      console.error('[Image Generation] API error:', data.error);
      return {
        success: false,
        error: data.error.message || JSON.stringify(data.error),
      };
    }

    // Extract base64 image data
    const b64Json = data.data?.[0]?.b64_json;
    if (!b64Json) {
      console.error('[Image Generation] No image data in response:', data);
      return {
        success: false,
        error: 'No image data in response',
      };
    }

    // Convert base64 to data URL
    const imageDataUrl = `data:image/png;base64,${b64Json}`;
    console.log('[Image Generation] Image generated successfully');

    return {
      success: true,
      imageDataUrl,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[Image Generation] Timeout after', timeoutMs, 'ms');
      return {
        success: false,
        error: `Request timed out after ${timeoutMs / 1000} seconds`,
      };
    }

    console.error('[Image Generation] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
