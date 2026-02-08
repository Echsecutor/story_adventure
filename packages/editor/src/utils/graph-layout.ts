/**
 * Graph layout utilities using dagre for hierarchical layout.
 */

import dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';

const nodeWidth = 150;
const nodeHeight = 50;

/**
 * Applies dagre hierarchical layout to React Flow nodes and edges.
 * Uses left-to-right direction similar to the original Klay layout.
 */
export function applyDagreLayout(
  nodes: Node[],
  edges: Edge[]
): Node[] {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: 'LR', // Left to right (like Klay direction: RIGHT)
    nodesep: 50,
    ranksep: 100,
  });

  // Add nodes to dagre graph
  for (const node of nodes) {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  }

  // Add edges to dagre graph
  for (const edge of edges) {
    dagreGraph.setEdge(edge.source, edge.target);
  }

  // Run layout
  dagre.layout(dagreGraph);

  // Update node positions
  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });
}
