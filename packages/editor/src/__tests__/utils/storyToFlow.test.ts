/**
 * Unit tests for storyToFlow conversion utilities.
 */

import { describe, it, expect } from 'vitest';
import { storyToFlow, storyToNodes, storyToEdges } from '../../utils/storyToFlow.js';
import type { Story } from '@story-adventure/shared';

describe('storyToFlow', () => {
  it('converts empty story to empty nodes and edges', () => {
    const story: Story = {
      sections: {},
    };
    
    const result = storyToFlow(story);
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  it('converts story with single section to one node', () => {
    const story: Story = {
      sections: {
        '1': {
          id: '1',
          text_lines: ['Hello'],
        },
      },
    };
    
    const result = storyToFlow(story);
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].id).toBe('1');
    expect(result.nodes[0].data.section.id).toBe('1');
    expect(result.edges).toHaveLength(0);
  });

  it('converts story with choices to edges', () => {
    const story: Story = {
      sections: {
        '1': {
          id: '1',
          text_lines: ['Start'],
          next: [
            { text: 'Go to 2', next: '2' },
            { text: 'Go to 3', next: '3' },
          ],
        },
        '2': {
          id: '2',
          text_lines: ['Section 2'],
        },
        '3': {
          id: '3',
          text_lines: ['Section 3'],
        },
      },
    };
    
    const result = storyToFlow(story);
    expect(result.nodes).toHaveLength(3);
    expect(result.edges).toHaveLength(2);
    
    const edge1 = result.edges.find((e) => e.target === '2');
    expect(edge1).toBeDefined();
    expect(edge1?.label).toBe('Go to 2');
    expect(edge1?.source).toBe('1');
    
    const edge2 = result.edges.find((e) => e.target === '3');
    expect(edge2).toBeDefined();
    expect(edge2?.label).toBe('Go to 3');
    expect(edge2?.source).toBe('1');
  });

  it('handles numeric section IDs', () => {
    const story: Story = {
      sections: {
        '1': {
          id: '1',
          text_lines: ['Start'],
          next: [{ text: 'Next', next: 2 }],
        },
        '2': {
          id: '2',
          text_lines: ['End'],
        },
      },
    };
    
    const result = storyToFlow(story);
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0].target).toBe('2');
  });
});
