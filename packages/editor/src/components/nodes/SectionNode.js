import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Custom React Flow node component for story sections.
 */
import { memo } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
/**
 * Custom node component for story sections.
 * Shows section ID and highlights when selected.
 * Styles root nodes (diamond, green) and leaf nodes (hexagon, red) differently.
 */
export const SectionNode = memo((props) => {
    const { data, id, selected } = props;
    const { getEdges } = useReactFlow();
    const nodeData = data;
    const section = nodeData.section;
    // Determine if this is a root (no incoming edges) or leaf (no outgoing edges)
    const edges = getEdges();
    const hasIncoming = edges.some((e) => e.target === id);
    const hasOutgoing = edges.some((e) => e.source === id);
    const isRoot = !hasIncoming;
    const isLeaf = !hasOutgoing || (section.next && section.next.length === 0);
    // Determine node shape and color
    let nodeClass = 'section-node';
    let shapeStyle = {};
    if (isRoot) {
        nodeClass += ' section-node-root';
        // Diamond shape using CSS transform
        shapeStyle = {
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
            backgroundColor: '#28a745', // green
        };
    }
    else if (isLeaf) {
        nodeClass += ' section-node-leaf';
        // Hexagon shape
        shapeStyle = {
            clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
            backgroundColor: '#dc3545', // red
        };
    }
    else {
        shapeStyle = {
            backgroundColor: '#007bff', // blue for regular nodes
        };
    }
    if (selected) {
        shapeStyle.border = '3px solid #ffc107'; // yellow border when selected
    }
    return (_jsxs("div", { className: nodeClass, style: {
            width: '150px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            border: selected ? '3px solid #ffc107' : '3px solid rgba(0,0,0,0.2)',
            ...shapeStyle,
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
        }, children: [_jsx(Handle, { type: "target", position: Position.Left }), _jsx("div", { children: section.id }), _jsx(Handle, { type: "source", position: Position.Right })] }));
});
SectionNode.displayName = 'SectionNode';
