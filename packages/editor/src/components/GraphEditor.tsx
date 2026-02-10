/**
 * React Flow graph editor component.
 */

import { useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SectionNode } from './nodes/SectionNode.js';
import { ChoiceEdge } from './edges/ChoiceEdge.js';
import { applyDagreLayout } from '../utils/graph-layout.js';
import type { SectionNodeData, ChoiceEdgeData } from '../utils/storyToFlow.js';

const nodeTypes = {
  section: SectionNode,
};

const edgeTypes = {
  choice: ChoiceEdge,
};

export interface GraphEditorProps {
  nodes: Node<SectionNodeData>[];
  edges: Edge<ChoiceEdgeData>[];
  onNodesChange: (changes: any[]) => void;
  onEdgesChange: (changes: any[]) => void;
  onNodeClick?: (event: React.MouseEvent, node: Node<SectionNodeData>) => void;
  onEdgeClick?: (event: React.MouseEvent, edge: Edge<ChoiceEdgeData>) => void;
  onConnect?: (connection: Connection) => void;
}

/**
 * Graph editor component using React Flow.
 */
export function GraphEditor({
  nodes: initialNodes,
  edges: initialEdges,
  onNodesChange: onNodesChangeProp,
  onEdgesChange: onEdgesChangeProp,
  onNodeClick,
  onEdgeClick,
  onConnect,
}: GraphEditorProps) {
  // Apply layout to initial nodes and update when props change
  const layoutedNodes = useMemo(() => {
    return applyDagreLayout(initialNodes, initialEdges);
  }, [initialNodes, initialEdges]);

  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges);

  // Update nodes/edges when props change
  useEffect(() => {
    const layouted = applyDagreLayout(initialNodes, initialEdges);
    setNodes(layouted);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Handle node clicks
  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node<SectionNodeData>) => {
      onNodeClick?.(event, node);
    },
    [onNodeClick]
  );

  // Handle edge clicks
  const handleEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge<ChoiceEdgeData>) => {
      onEdgeClick?.(event, edge);
    },
    [onEdgeClick]
  );

  // Handle connections (dragging from source to target)
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (onConnect) {
        onConnect(connection);
      } else {
        setEdges((eds) => addEdge(connection, eds));
      }
    },
    [onConnect, setEdges]
  );

  // Combine internal and external change handlers
  const handleNodesChange = useCallback(
    (changes: any[]) => {
      onNodesChangeInternal(changes);
      onNodesChangeProp?.(changes);
    },
    [onNodesChangeInternal, onNodesChangeProp]
  );

  const handleEdgesChange = useCallback(
    (changes: any[]) => {
      onEdgesChangeInternal(changes);
      onEdgesChangeProp?.(changes);
    },
    [onEdgesChangeInternal, onEdgesChangeProp]
  );

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes as Node[]}
        edges={edges as Edge[]}
        nodeTypes={nodeTypes as any}
        edgeTypes={edgeTypes as any}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onNodeClick={handleNodeClick as any}
        onEdgeClick={handleEdgeClick as any}
        onConnect={handleConnect}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
