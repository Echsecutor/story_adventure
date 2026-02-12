/**
 * Custom React Flow node component for story sections.
 */

import { memo } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { SectionNodeData } from '../../utils/storyToFlow.js';

/**
 * Custom node component for story sections.
 * Shows section ID and highlights when selected.
 * Styles root nodes (diamond, green) and leaf nodes (hexagon, red) differently.
 * Displays a small preview of the section image if present.
 */
export const SectionNode = memo((props: NodeProps) => {
  const { data, id, selected } = props;
  const { getEdges } = useReactFlow();
  const nodeData = data as SectionNodeData;
  const section = nodeData.section;
  
  // Determine if this is a root (no incoming edges) or leaf (no outgoing edges)
  const edges = getEdges();
  
  const hasIncoming = edges.some((e) => e.target === id);
  const hasOutgoing = edges.some((e) => e.source === id);
  
  const isRoot = !hasIncoming;
  const isLeaf = !hasOutgoing || (section.next && section.next.length === 0);
  
  // Check if section has an image
  const hasImage = section.media && section.media.type === 'image' && section.media.src;
  
  // Determine node shape and color
  let nodeClass = 'section-node';
  let shapeStyle: React.CSSProperties = {};
  
  if (isRoot) {
    nodeClass += ' section-node-root';
    // Diamond shape using CSS transform
    shapeStyle = {
      clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
      backgroundColor: '#28a745', // green
    };
  } else if (isLeaf) {
    nodeClass += ' section-node-leaf';
    // Hexagon shape
    shapeStyle = {
      clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
      backgroundColor: '#dc3545', // red
    };
  } else {
    shapeStyle = {
      backgroundColor: '#007bff', // blue for regular nodes
    };
  }
  
  if (selected) {
    shapeStyle.border = '3px solid #ffc107'; // yellow border when selected
  }
  
  return (
    <div
      className={nodeClass}
      style={{
        minWidth: hasImage ? '70px' : '60px',
        maxWidth: hasImage ? '100px' : '120px',
        minHeight: hasImage ? '70px' : '40px',
        display: 'flex',
        flexDirection: hasImage ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '8px',
        border: selected ? '3px solid #ffc107' : '3px solid rgba(0,0,0,0.2)',
        ...shapeStyle,
        color: 'white',
        fontWeight: 'bold',
        fontSize: '14px',
        padding: hasImage ? '6px' : '8px 12px',
        gap: hasImage ? '4px' : '0',
      }}
    >
      <Handle type="target" position={Position.Left} />
      {hasImage && (
        <img
          src={section.media!.src}
          alt={`Section ${section.id}`}
          style={{
            maxWidth: '60px',
            maxHeight: '40px',
            objectFit: 'cover',
            borderRadius: '4px',
            border: '1px solid rgba(255,255,255,0.3)',
          }}
        />
      )}
      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {section.id}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
});

SectionNode.displayName = 'SectionNode';
