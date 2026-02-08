import { describe, it, expect } from 'vitest';
import type { Story } from '../types.js';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Validates that a JSON file parses correctly as a Story type.
 */
function validateStoryFile(filePath: string): Story {
  const content = readFileSync(filePath, 'utf-8');
  const story = JSON.parse(content) as Story;
  // TypeScript will validate the structure matches Story interface
  return story;
}

describe('Story type validation', () => {
  const storiesDir = join(__dirname, '../../../../stories');

  it('should parse example_story.json', () => {
    const story = validateStoryFile(join(storiesDir, 'example_story.json'));
    expect(story).toBeDefined();
    expect(story.sections).toBeDefined();
    expect(typeof story.sections).toBe('object');
  });

  it('should parse test.json', () => {
    const story = validateStoryFile(join(storiesDir, 'test.json'));
    expect(story).toBeDefined();
    expect(story.sections).toBeDefined();
    expect(story.state).toBeDefined();
    expect(story.state?.variables).toBeDefined();
  });

  it('should parse prinzessin.json', () => {
    const story = validateStoryFile(join(storiesDir, 'prinzessin.json'));
    expect(story).toBeDefined();
    expect(story.sections).toBeDefined();
  });

  it('should parse weihnachtsmann.json', () => {
    const story = validateStoryFile(join(storiesDir, 'weihnachtsmann.json'));
    expect(story).toBeDefined();
    expect(story.sections).toBeDefined();
  });

  it('should parse Der_Weihnachtsmann/Der_Weihnachtsmann.json', () => {
    const story = validateStoryFile(
      join(storiesDir, 'Der_Weihnachtsmann/Der_Weihnachtsmann.json')
    );
    expect(story).toBeDefined();
    expect(story.sections).toBeDefined();
  });
});
