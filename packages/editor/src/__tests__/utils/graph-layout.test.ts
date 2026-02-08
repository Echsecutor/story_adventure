/**
 * Unit tests for graph layout utilities.
 */

import { describe, it, expect } from 'vitest';
import { applyDagreLayout } from '../../utils/graph-layout.js';
import type { Node, Edge } from '@xyflow/react';
import type { SectionNodeData } from '../../utils/storyToFlow.js';

describe('applyDagreLayout', () => {
  it('positions nodes with valid coordinates', () => {
    const nodes: Node<SectionNodeData>[] = [
      {
        id: '1',
        type: 'section',
        position: { x: 0, y: 0 },
        data: { section: { id: '1', text_lines: [''] } },
      },
      {
        id: '2',
        type: 'section',
        position: { x: 0, y: 0 },
        data: { section: { id: '2', text_lines: [''] } },
      },
    ];
    
    const edges: Edge[] = [
      {
        id: '1-2',
        source: '1',
        target: '2',
      },
    ];
    
    const layouted = applyDagreLayout(nodes, edges);
    
    expect(layouted).toHaveLength(2);
    expect(layouted[0].position.x).toBeGreaterThanOrEqual(0);
    expect(layouted[0].position.y).toBeGreaterThanOrEqual(0);
    expect(layouted[1].position.x).toBeGreaterThan(layouted[0].position.x); // Left to right
  });

  it('handles empty nodes array', () => {
    const layouted = applyDagreLayout([], []);
    expect(layouted).toEqual([]);
  });

  it('handles nodes without edges', () => {
    const nodes: Node<SectionNodeData>[] = [
      {
        id: '1',
        type: 'section',
        position: { x: 0, y: 0 },
        data: { section: { id: '1', text_lines: [''] } },
      },
    ];
    
    const layouted = applyDagreLayout(nodes, []);
    expect(layouted).toHaveLength(1);
    expect(layouted[0].position.x).toBeGreaterThanOrEqual(0);
    expect(layouted[0].position.y).toBeGreaterThanOrEqual(0);
  });

  it('creates hierarchical layout for branching graph', () => {
    const nodes: Node<SectionNodeData>[] = [
      {
        id: '1',
        type: 'section',
        position: { x: 0, y: 0 },
        data: { section: { id: '1', text_lines: [''] } },
      },
      {
        id: '2',
        type: 'section',
        position: { x: 0, y: 0 },
        data: { section: { id: '2', text_lines: [''] } },
      },
      {
        id: '3',
        type: 'section',
        position: { x: 0, y: 0 },
        data: { section: { id: '3', text_lines: [''] } },
      },
    ];
    
    const edges: Edge[] = [
      { id: '1-2', source: '1', target: '2' },
      { id: '1-3', source: '1', target: '3' },
    ];
    
    const layouted = applyDagreLayout(nodes, edges);
    
    // Node 1 should be leftmost
    const node1 = layouted.find((n) => n.id === '1')!;
    const node2 = layouted.find((n) => n.id === '2')!;
    const node3 = layouted.find((n) => n.id === '3')!;
    
    expect(node1.position.x).toBeLessThan(node2.position.x);
    expect(node1.position.x).toBeLessThan(node3.position.x);
  });
});
