/**
 * Utility functions for managing AI expansion preferences in localStorage.
 */

import type { LlmEndpoint } from '@story-adventure/shared';

const AI_CONSENT_KEY = 'ai_expansion_consent';
const LLM_ENDPOINT_KEY = 'llm_endpoint_config';

/**
 * Retrieves the user's AI expansion consent preference from localStorage.
 *
 * @returns true if user has consented, false if declined, null if not set
 */
export function getAiExpansionConsent(): boolean | null {
  const value = localStorage.getItem(AI_CONSENT_KEY);
  if (value === null) {
    return null;
  }
  return value === 'true';
}

/**
 * Stores the user's AI expansion consent preference in localStorage.
 *
 * @param value - true to enable AI expansion, false to disable
 */
export function setAiExpansionConsent(value: boolean): void {
  localStorage.setItem(AI_CONSENT_KEY, value.toString());
}

/**
 * Removes the AI expansion consent preference from localStorage.
 */
export function clearAiExpansionConsent(): void {
  localStorage.removeItem(AI_CONSENT_KEY);
}

/**
 * Retrieves the LLM endpoint configuration from localStorage.
 *
 * @returns LLM endpoint configuration or null if not set
 */
export function getLlmEndpoint(): LlmEndpoint | null {
  const value = localStorage.getItem(LLM_ENDPOINT_KEY);
  if (value === null) {
    return null;
  }
  try {
    return JSON.parse(value) as LlmEndpoint;
  } catch (error) {
    console.error('Failed to parse LLM endpoint config from localStorage:', error);
    return null;
  }
}

/**
 * Stores the LLM endpoint configuration in localStorage.
 *
 * @param endpoint - LLM endpoint configuration
 */
export function setLlmEndpoint(endpoint: LlmEndpoint): void {
  localStorage.setItem(LLM_ENDPOINT_KEY, JSON.stringify(endpoint));
}

/**
 * Removes the LLM endpoint configuration from localStorage.
 */
export function clearLlmEndpoint(): void {
  localStorage.removeItem(LLM_ENDPOINT_KEY);
}

/**
 * Checks if an LLM endpoint is configured and valid.
 *
 * @returns true if endpoint is configured with at least a URL
 */
export function hasValidLlmEndpoint(): boolean {
  const endpoint = getLlmEndpoint();
  return !!(endpoint && endpoint.url && endpoint.url.trim().length > 0);
}
