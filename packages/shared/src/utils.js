/**
 * Utility functions for story processing and file operations.
 */
import { replace_variables } from './variables.js';
/**
 * Extracts text from a section, joining text_lines if present, otherwise using text field.
 * Applies variable interpolation to the result.
 *
 * @param section - Story section object
 * @param variables - Map of variable names to their values for interpolation
 * @returns Text content with variables replaced
 *
 * @example
 * ```ts
 * const section = { id: "1", text_lines: ["Hello ${name}"] };
 * get_text_from_section(section, { name: "Alice" })
 * // Returns: "Hello Alice"
 * ```
 */
export function get_text_from_section(section, variables) {
    if (!section) {
        return '';
    }
    let text = '';
    if (section.text_lines) {
        text = section.text_lines.join('\n');
    }
    else if (section.text) {
        text = section.text;
    }
    return replace_variables(text, variables);
}
/**
 * Converts a story title to a file-safe string by replacing non-alphanumeric characters with underscores.
 *
 * @param story - Story object containing meta.title
 * @returns File-safe title string (default: "story_adventure" if no title)
 *
 * @example
 * ```ts
 * get_file_safe_title({ meta: { title: "My Story!" } })
 * // Returns: "My_Story_"
 * ```
 */
export function get_file_safe_title(story) {
    if (!story?.meta?.title) {
        return 'story_adventure';
    }
    return story.meta.title.replaceAll(/[^a-z0-9-_]/gi, '_');
}
