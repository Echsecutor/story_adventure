/**
 * Variable interpolation utilities for replacing ${variable} placeholders in text.
 */

/**
 * Replaces all occurrences of ${variableName} in text with corresponding variable values.
 *
 * @param text - Text containing variable placeholders (e.g., "Hello ${name}")
 * @param variables - Map of variable names to their values
 * @returns Text with variables replaced, or original text if variables is null/undefined
 *
 * @example
 * ```ts
 * replace_variables("Hello ${name}", { name: "Alice" })
 * // Returns: "Hello Alice"
 * ```
 */
export function replace_variables(
  text: string | null | undefined,
  variables: Record<string, string> | null | undefined
): string {
  if (!variables || !text) {
    return text || '';
  }
  let result = text;
  for (const key in variables) {
    const value = variables[key];
    if (value !== undefined) {
      result = result.replaceAll(`\${${key}}`, value);
    }
  }
  return result;
}
