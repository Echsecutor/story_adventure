import { describe, it, expect } from 'vitest';
import { get_text_from_section, get_file_safe_title } from '../utils.js';
import type { Story, Section } from '../types.js';

describe('get_text_from_section', () => {
  it('should join text_lines array', () => {
    const section: Section = {
      id: '1',
      text_lines: ['Line 1', 'Line 2', 'Line 3'],
    };
    expect(get_text_from_section(section, {})).toBe('Line 1\nLine 2\nLine 3');
  });

  it('should use text field if text_lines is missing', () => {
    const section: Section = {
      id: '1',
      text: 'Single line text',
    };
    expect(get_text_from_section(section, {})).toBe('Single line text');
  });

  it('should prefer text_lines over text', () => {
    const section: Section = {
      id: '1',
      text_lines: ['From text_lines'],
      text: 'From text',
    };
    expect(get_text_from_section(section, {})).toBe('From text_lines');
  });

  it('should apply variable interpolation', () => {
    const section: Section = {
      id: '1',
      text_lines: ['Hello ${name}', 'Your score is ${score}'],
    };
    expect(
      get_text_from_section(section, { name: 'Alice', score: '100' })
    ).toBe('Hello Alice\nYour score is 100');
  });

  it('should handle empty section', () => {
    const section: Section = { id: '1' };
    expect(get_text_from_section(section, {})).toBe('');
  });

  it('should handle null/undefined section', () => {
    expect(get_text_from_section(null, {})).toBe('');
    expect(get_text_from_section(undefined, {})).toBe('');
  });

  it('should handle null/undefined variables', () => {
    const section: Section = {
      id: '1',
      text_lines: ['Hello ${name}'],
    };
    expect(get_text_from_section(section, null)).toBe('Hello ${name}');
    expect(get_text_from_section(section, undefined)).toBe('Hello ${name}');
  });
});

describe('get_file_safe_title', () => {
  it('should convert title to file-safe string', () => {
    const story: Story = {
      sections: {},
      meta: { title: 'My Story!' },
    };
    expect(get_file_safe_title(story)).toBe('My_Story_');
  });

  it('should preserve alphanumeric, hyphens, and underscores', () => {
    const story: Story = {
      sections: {},
      meta: { title: 'My-Story_123' },
    };
    expect(get_file_safe_title(story)).toBe('My-Story_123');
  });

  it('should replace spaces and special characters', () => {
    const story: Story = {
      sections: {},
      meta: { title: 'Story Name (2024)' },
    };
    expect(get_file_safe_title(story)).toBe('Story_Name__2024_');
  });

  it('should return default if no title', () => {
    const story: Story = {
      sections: {},
    };
    expect(get_file_safe_title(story)).toBe('story_adventure');
  });

  it('should return default if no meta', () => {
    const story: Story = {
      sections: {},
    };
    expect(get_file_safe_title(story)).toBe('story_adventure');
  });

  it('should handle null/undefined story', () => {
    expect(get_file_safe_title(null)).toBe('story_adventure');
    expect(get_file_safe_title(undefined)).toBe('story_adventure');
  });
});
