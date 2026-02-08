/**
 * Converts a Story object to React Flow nodes and edges.
 */
/**
 * Converts story sections to React Flow nodes.
 */
export function storyToNodes(story) {
    const nodes = [];
    for (const sectionId in story.sections) {
        const section = story.sections[sectionId];
        if (!section)
            continue;
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
export function storyToEdges(story) {
    const edges = [];
    for (const sectionId in story.sections) {
        const section = story.sections[sectionId];
        if (!section || !section.next || section.next.length === 0) {
            continue;
        }
        for (let i = 0; i < section.next.length; i++) {
            const choice = section.next[i];
            if (!choice)
                continue;
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
export function storyToFlow(story) {
    return {
        nodes: storyToNodes(story),
        edges: storyToEdges(story),
    };
}
