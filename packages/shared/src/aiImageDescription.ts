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
    'Analyze this image and generate a detailed image generation prompt in tag-style format (comma-separated descriptive tags). ' +
    'Structure your tags in this order: ' +
    '1. Scene/Setting (environment, background, time of day, atmosphere) ' +
    '2. Main Subject (1girl, 1boy, solo, multiple people, etc.) ' +
    '3. Character Details (if person present): ' +
    '   - Hair: color, length, style (ponytail, braided, long hair, short hair, etc.) ' +
    '   - Eyes: color, expression, detailed eyes, glowing eyes, etc. ' +
    '   - Face: facial expression, beautiful detailed face, etc. ' +
    '   - Body: proportions (huge breasts, thin waist, skinny, muscular, etc.), pose, body language ' +
    '   - Clothing: every visible piece with colors (black latex, white dress, thigh belt, etc.), material (shiny clothes, leather, silk) ' +
    '4. Action/Pose (standing, sitting, running, hands behind head, etc.) ' +
    '5. Composition (close up, full body, portrait, depth of field, focused subject) ' +
    '6. Art Style & Quality (masterpiece, best quality, amazing quality, hyper realistic, fantasy style, sci-fi, anime style) ' +
    '7. Technical Details (8K, ultra high res, ultra detailed, high res image) ' +
    '8. Lighting & Effects (cinematic lighting, realistic light and shadows, rim lighting, volumetric fog, glowing, etc.) ' +
    '9. Mood/Atmosphere (powerful, mysterious, peaceful, dramatic, etc.) ' +
    'Be VERY detailed with physical descriptions, clothing, colors, and character features. ' +
    'Use specific quality tags like: score_9, score_8_up, very aesthetic, masterpiece, best quality. ' +
    'IMPORTANT: Return ONLY the comma-separated tags. Do NOT include headers, labels, explanations, markdown, ' +
    'code fences, or words like "Prompt:", "Tags:", "Here is", etc. Just the plain comma-separated tag list.';

  // Build messages with multimodal content
  const messages: Array<{ role: string; content: MessageContent }> = [
    {
      role: 'system',
      content: 'You are an expert at analyzing images and creating detailed image generation prompts in tag-style format. ' +
               'Your task is to reverse-engineer images into comma-separated tag prompts that could recreate them. ' +
               'Focus on extremely detailed physical descriptions: hair color and style, every piece of clothing with colors, ' +
               'body proportions, facial expressions, pose details, and scene composition. ' +
               'Use the tag format style of Stable Diffusion / NovelAI prompts. ' +
               'Always respond with ONLY the comma-separated tag list - no formatting, no labels, no explanations, no JSON.',
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
