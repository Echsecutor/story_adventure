import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * React Flow graph editor component.
 */
import { useCallback, useMemo, useEffect } from 'react';
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, addEdge, } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SectionNode } from './nodes/SectionNode.js';
import { ChoiceEdge } from './edges/ChoiceEdge.js';
import { applyDagreLayout } from '../utils/graph-layout.js';
const nodeTypes = {
    section: SectionNode,
};
const edgeTypes = {
    choice: ChoiceEdge,
};
/**
 * Graph editor component using React Flow.
 */
export function GraphEditor({ nodes: initialNodes, edges: initialEdges, onNodesChange: onNodesChangeProp, onEdgesChange: onEdgesChangeProp, onNodeClick, onEdgeClick, onConnect, }) {
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
    const handleNodeClick = useCallback((event, node) => {
        onNodeClick?.(event, node);
    }, [onNodeClick]);
    // Handle edge clicks
    const handleEdgeClick = useCallback((event, edge) => {
        onEdgeClick?.(event, edge);
    }, [onEdgeClick]);
    // Handle connections (dragging from source to target)
    const handleConnect = useCallback((connection) => {
        if (onConnect) {
            onConnect(connection);
        }
        else {
            setEdges((eds) => addEdge(connection, eds));
        }
    }, [onConnect, setEdges]);
    // Combine internal and external change handlers
    const handleNodesChange = useCallback((changes) => {
        onNodesChangeInternal(changes);
        onNodesChangeProp?.(changes);
    }, [onNodesChangeInternal, onNodesChangeProp]);
    const handleEdgesChange = useCallback((changes) => {
        onEdgesChangeInternal(changes);
        onEdgesChangeProp?.(changes);
    }, [onEdgesChangeInternal, onEdgesChangeProp]);
    return (_jsx("div", { style: { width: '100%', height: '50vh' }, children: _jsxs(ReactFlow, { nodes: nodes, edges: edges, nodeTypes: nodeTypes, edgeTypes: edgeTypes, onNodesChange: handleNodesChange, onEdgesChange: handleEdgesChange, onNodeClick: handleNodeClick, onEdgeClick: handleEdgeClick, onConnect: handleConnect, fitView: true, children: [_jsx(Background, {}), _jsx(Controls, {}), _jsx(MiniMap, {})] }) }));
}
