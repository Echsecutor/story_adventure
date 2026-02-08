/**
 * File saving utilities.
 */

import { saveAs } from 'file-saver';
import type { Story } from '@story-adventure/shared';
import { get_file_safe_title } from '@story-adventure/shared';

/**
 * Saves a story as a JSON file.
 */
export function saveStoryFile(story: Story): void {
  const json = JSON.stringify(story, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const filename = `${get_file_safe_title(story)}.json`;
  saveAs(blob, filename);
}
