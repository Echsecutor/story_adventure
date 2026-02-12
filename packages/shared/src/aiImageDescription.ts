/**
 * Utility for generating image generation prompts by reverse-engineering images using vision-capable LLM models.
 */

import type { LlmEndpoint } from '@story-adventure/shared';
import { callLlmStreaming, type MessageContent } from './aiApiClient';

/**
 * Options for generating an image generation prompt.
 */
export interface GenerateImageDescriptionOptions {
  /** LLM endpoint configuration */
  endpoint: LlmEndpoint;
  /** Image URL (can be http/https URL, data URI, or gs:// for Gemini) */
  imageUrl: string;
  /** Optional custom prompt (defaults to prompt engineering instruction) */
  customPrompt?: string;
  /** Optional timeout in milliseconds */
  timeoutMs?: number;
}

/**
 * Result of image generation prompt creation.
 */
export interface ImageDescriptionResult {
  /** Whether the generation was successful */
  success: boolean;
  /** Generated image generation prompt */
  description?: string;
  /** Error message if generation failed */
  error?: string;
}

/**
 * Generates an image generation prompt by analyzing an image using a vision-capable LLM model.
 * The AI reverse-engineers the image to create a detailed prompt that could recreate it.
 * 
 * @param options - Options for image prompt generation
 * @returns Promise resolving to the image generation prompt result
 */
export async function generateImageDescription(
  options: GenerateImageDescriptionOptions
): Promise<ImageDescriptionResult> {
  const { endpoint, imageUrl, customPrompt, timeoutMs = 60000 } = options;

  // Build the prompt - default is to generate an image generation prompt
  const promptText = customPrompt || 
    'Analyze this image and generate a detailed image generation prompt that would recreate it. ' +
    'Focus on: visual style, composition, lighting, colors, mood, subject details, and artistic techniques. ' +
    'Write the prompt as if instructing an AI image generator like DALL-E, Stable Diffusion, or Midjourney. ' +
    'IMPORTANT: Return ONLY the raw prompt text itself. Do NOT include any headers, labels, markdown formatting, ' +
    'code fences, or words like "Prompt:", "Here is", etc. Just the plain prompt text.';

  // Build messages with multimodal content
  const messages: Array<{ role: string; content: MessageContent }> = [
    {
      role: 'system',
      content: 'You are an expert at analyzing images and creating detailed image generation prompts. ' +
               'Your task is to reverse-engineer images into prompts that could recreate them. ' +
               'Always respond with ONLY the raw prompt text - no formatting, no labels, no explanations.',
    },
    {
      role: 'user',
      content: [
        {
          type: 'text' as const,
          text: promptText,
        },
        {
          type: 'image_url' as const,
          image_url: {
            url: imageUrl,
          },
        },
      ],
    },
  ];

  try {
    console.log('[Image Prompt Generation] Requesting image generation prompt for:', imageUrl);
    
    // Call the LLM API with multimodal messages
    const response = await callLlmStreaming({
      endpoint,
      messages,
      timeoutMs,
    });

    if (!response.success || !response.content) {
      console.error('[Image Prompt Generation] Generation failed:', response.error);
      return {
        success: false,
        error: response.error || 'Unknown error',
      };
    }

    console.log('[Image Prompt Generation] Image generation prompt created successfully');
    return {
      success: true,
      description: response.content.trim(),
    };
  } catch (error) {
    console.error('[Image Prompt Generation] Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
