import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Custom React Flow edge component for choices.
 */
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
/**
 * Custom edge component for choices.
 * Shows choice text as a label on the edge.
 */
export function ChoiceEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, label, markerEnd, }) {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });
    return (_jsxs(_Fragment, { children: [_jsx(BaseEdge, { id: id, path: edgePath, markerEnd: markerEnd, style: {
                    strokeWidth: 6,
                    stroke: '#ffaaaa',
                } }), _jsx(EdgeLabelRenderer, { children: _jsx("div", { style: {
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        fontSize: 12,
                        pointerEvents: 'all',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                    }, className: "nodrag nopan", children: label || '' }) })] }));
}
