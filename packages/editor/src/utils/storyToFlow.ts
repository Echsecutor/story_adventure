/**
 * Converts a Story object to React Flow nodes and edges.
 */

import type { Node, Edge } from '@xyflow/react';
import type { Story, Section, Choice } from '@story-adventure/shared';

export interface SectionNodeData extends Record<string, unknown> {
  section: Section;
}

export interface ChoiceEdgeData extends Record<string, unknown> {
  choice: Choice;
  sourceSectionId: string;
}

/**
 * Converts story sections to React Flow nodes.
 */
export function storyToNodes(story: Story): Node<SectionNodeData>[] {
  const nodes: Node<SectionNodeData>[] = [];
  
  for (const sectionId in story.sections) {
    const section = story.sections[sectionId];
    if (!section) continue;
    nodes.push({
      id: sectionId,
      type: 'section',
      position: { x: 0, y: 0 }, // Will be set by layout
      data: { section },
    });
  }
  
  return nodes;
}

/**
 * Converts story choices to React Flow edges.
 */
export function storyToEdges(story: Story): Edge<ChoiceEdgeData>[] {
  const edges: Edge<ChoiceEdgeData>[] = [];
  
  for (const sectionId in story.sections) {
    const section = story.sections[sectionId];
    if (!section || !section.next || section.next.length === 0) {
      continue;
    }
    
    for (let i = 0; i < section.next.length; i++) {
      const choice = section.next[i];
      if (!choice) continue;
      const targetId = String(choice.next);
      
      edges.push({
        id: `${sectionId}-${targetId}-${i}`,
        source: sectionId,
        target: targetId,
        type: 'choice',
        label: choice.text || '',
        data: {
          choice,
          sourceSectionId: sectionId,
        },
      });
    }
  }
  
  return edges;
}

/**
 * Converts a complete Story to React Flow nodes and edges.
 */
export function storyToFlow(story: Story): { nodes: Node<SectionNodeData>[]; edges: Edge<ChoiceEdgeData>[] } {
  return {
    nodes: storyToNodes(story),
    edges: storyToEdges(story),
  };
}
