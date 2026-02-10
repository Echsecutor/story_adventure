/**
 * Type definitions for Story Adventure story format and runtime types.
 */

/**
 * Story metadata containing title, author, and license information.
 */
export interface StoryMeta {
  /** Story title */
  title: string;
  /** Author information */
  author?: {
    name: string;
    url?: string;
  };
  /** Publication year */
  year?: string;
  /** License information */
  license?: {
    name: string;
    url: string;
  };
  /** Number of steps to look ahead for AI-extendable sections (default: 2) */
  ai_gen_look_ahead?: number;
  /** Character profiles for consistent AI generation (name -> description) */
  characters?: Record<string, string>;
}

/**
 * LLM endpoint configuration for AI story extension.
 * NOTE: This is stored in browser localStorage, not in story files.
 */
export interface LlmEndpoint {
  /** API endpoint URL (e.g., "https://api.openai.com/v1/chat/completions") */
  url: string;
  /** Optional API key for authentication */
  api_key?: string;
  /** Optional endpoint type (default: "openai") */
  type?: string;
  /** Optional model identifier (e.g., "gpt-4o") */
  model?: string;
}

/**
 * Variable definition with default value and optional description.
 */
export interface Variable {
  /** Default value for the variable */
  default: string;
  /** Optional description of the variable's purpose */
  description?: string;
}

/**
 * Media object for images or videos in story sections.
 */
export interface Media {
  /** Media type: 'image' or 'video' */
  type: 'image' | 'video';
  /** Source path (relative path or data URL) */
  src: string;
}

/**
 * AI image generation metadata for a section.
 */
export interface AiGenImage {
  /** Image generation prompt describing the scene visually */
  prompt: string;
  /** Optional negative prompt (what to avoid in image generation) */
  negative_prompt?: string;
  /** Optional image size specification */
  size?: string;
}

/**
 * Action type names supported by the action system.
 */
export type ActionType =
  | 'NONE'
  | 'INPUT'
  | 'SET'
  | 'ADD_TO_VARIABLE'
  | 'COMPARE_DO'
  | 'IF_SET_DO'
  | 'IF_NOT_SET_DO'
  | 'ADD_CHOICE'
  | 'REMOVE_CHOICE'
  | 'IF_SET_ADD_CHOICE'
  | 'IF_SET_REMOVE_CHOICE';

/**
 * Comparison operator for COMPARE_DO action.
 */
export type ComparisonOperator = '=' | '!=' | '>' | '>=' | '<=' | '<';

/**
 * Action object executed when entering a section.
 */
export interface Action {
  /** Action type */
  action: ActionType;
  /** Action parameters (variable names, values, operators, etc.) */
  parameters: string[];
}

/**
 * Choice object representing a navigation option from a section.
 */
export interface Choice {
  /** Display text for the choice (empty string for invisible "continue" button) */
  text: string;
  /** Target section ID (string or number) */
  next: string | number;
}

/**
 * Story section containing text, media, choices, and actions.
 */
export interface Section {
  /** Unique section identifier */
  id: string;
  /** Array of text lines (supports Markdown) */
  text_lines?: string[];
  /** Alternative single text field (legacy format) */
  text?: string;
  /** Array of choice objects for navigation */
  next?: Choice[];
  /** Optional media object (image or video) */
  media?: Media;
  /** Optional array of actions to execute when entering this section */
  script?: Action[];
  /** Whether this section can be extended by AI (default: false) */
  ai_extendable?: boolean;
  /** AI image generation metadata if image was AI-generated or needs generation */
  ai_gen?: AiGenImage;
}

/**
 * Current game state including current section and variable values.
 */
export interface StoryState {
  /** Current section ID */
  current_section?: string;
  /** Map of variable names to their current values */
  variables?: Record<string, string>;
  /** Optional history of visited section IDs */
  history?: string[];
}

/**
 * Complete story object containing all sections, state, and metadata.
 */
export interface Story {
  /** Story metadata */
  meta?: StoryMeta;
  /** Current game state */
  state?: StoryState;
  /** Map of section IDs to section objects */
  sections: Record<string, Section>;
  /** Map of variable names to variable definitions */
  variables?: Record<string, Variable>;
}
