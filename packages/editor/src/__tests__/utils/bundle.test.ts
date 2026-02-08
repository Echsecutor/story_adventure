/**
 * Unit tests for bundle generation utilities.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Story } from '@story-adventure/shared';
import {
  depthFirstSearch,
  markdownFromSectionIdList,
  downloadAsIs,
} from '../../utils/bundle.js';
import { saveAs } from 'file-saver';

// Mock file-saver
vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));

describe('bundle utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('depthFirstSearch', () => {
    it('should find a simple path from start to end', async () => {
      const story: Story = {
        sections: {
          '1': {
            id: '1',
            text_lines: ['Start'],
            next: [{ text: 'Continue', next: '2' }],
          },
          '2': {
            id: '2',
            text_lines: ['End'],
          },
        },
      };

      const result = await depthFirstSearch(['1'], '2', [], story);
      expect(result).toEqual(['1', '2']);
    });

    it('should find a path passing through required sections', async () => {
      const story: Story = {
        sections: {
          '1': {
            id: '1',
            text_lines: ['Start'],
            next: [
              { text: 'Path A', next: '2' },
              { text: 'Path B', next: '3' },
            ],
          },
          '2': {
            id: '2',
            text_lines: ['Middle'],
            next: [{ text: 'Continue', next: '4' }],
          },
          '3': {
            id: '3',
            text_lines: ['Skip'],
            next: [{ text: 'Continue', next: '4' }],
          },
          '4': {
            id: '4',
            text_lines: ['End'],
          },
        },
      };

      const result = await depthFirstSearch(['1'], '4', ['2'], story);
      expect(result).toEqual(['1', '2', '4']);
    });

    it('should return null if no path exists', async () => {
      const story: Story = {
        sections: {
          '1': {
            id: '1',
            text_lines: ['Start'],
            next: [{ text: 'Continue', next: '2' }],
          },
          '2': {
            id: '2',
            text_lines: ['Dead end'],
          },
        },
      };

      const result = await depthFirstSearch(['1'], '3', [], story);
      expect(result).toBeNull();
    });

    it('should return null if required section is not visited', async () => {
      const story: Story = {
        sections: {
          '1': {
            id: '1',
            text_lines: ['Start'],
            next: [{ text: 'Skip', next: '3' }],
          },
          '2': {
            id: '2',
            text_lines: ['Required'],
            next: [{ text: 'Continue', next: '3' }],
          },
          '3': {
            id: '3',
            text_lines: ['End'],
          },
        },
      };

      const result = await depthFirstSearch(['1'], '3', ['2'], story);
      expect(result).toBeNull();
    });

    it('should avoid cycles', async () => {
      const story: Story = {
        sections: {
          '1': {
            id: '1',
            text_lines: ['Start'],
            next: [{ text: 'Loop', next: '2' }],
          },
          '2': {
            id: '2',
            text_lines: ['Loop back'],
            next: [{ text: 'Back', next: '1' }],
          },
        },
      };

      const result = await depthFirstSearch(['1'], '2', [], story);
      expect(result).toEqual(['1', '2']);
    });
  });

  describe('markdownFromSectionIdList', () => {
    it('should convert section list to markdown', () => {
      const story: Story = {
        sections: {
          '1': {
            id: '1',
            text_lines: ['First section'],
          },
          '2': {
            id: '2',
            text_lines: ['Second section'],
            media: {
              type: 'image',
              src: 'image.png',
            },
          },
        },
        state: {
          variables: {},
        },
      };

      const result = markdownFromSectionIdList(['1', '2'], story);
      // Note: get_text_from_section adds a newline, then we add \n\n, so we get \n\n\n
      expect(result).toContain('First section');
      expect(result).toContain('Second section');
      expect(result).toContain('![](image.png)');
    });

    it('should handle variables in text', () => {
      const story: Story = {
        sections: {
          '1': {
            id: '1',
            text_lines: ['Hello ${name}'],
          },
        },
        state: {
          variables: {
            name: 'Alice',
          },
        },
      };

      const result = markdownFromSectionIdList(['1'], story);
      expect(result).toBe('Hello Alice\n\n');
    });
  });

  describe('downloadAsIs', () => {
    it('should save story as JSON file', async () => {
      const story: Story = {
        sections: {
          '1': {
            id: '1',
            text_lines: ['Test'],
          },
        },
        meta: {
          title: 'Test Story',
        },
      };

      await downloadAsIs(story);

      expect(saveAs).toHaveBeenCalledTimes(1);
      const call = vi.mocked(saveAs).mock.calls[0];
      expect(call[1]).toBe('Test_Story.json');
      expect(call[0]).toBeInstanceOf(Blob);
    });
  });
});
