/**
 * Syncs React Flow changes back to Story object.
 * Note: This is mainly for edge updates (choice text changes).
 * Node updates (section text) are handled directly in the story state.
 */
/**
 * Updates story choices from React Flow edges.
 * This syncs edge label changes (choice text) back to the story.
 */
export function syncEdgesToStory(story, edges) {
    const updatedStory = { ...story };
    // Clear all existing choices
    for (const sectionId in updatedStory.sections) {
        const section = updatedStory.sections[sectionId];
        if (section) {
            updatedStory.sections[sectionId] = {
                ...section,
                next: [],
            };
        }
    }
    // Rebuild choices from edges
    for (const edge of edges) {
        const sourceId = edge.source;
        const targetId = edge.target;
        const edgeData = edge.data;
        if (!updatedStory.sections[sourceId]) {
            continue;
        }
        if (!updatedStory.sections[sourceId].next) {
            updatedStory.sections[sourceId].next = [];
        }
        const choice = {
            text: (typeof edge.label === 'string' ? edge.label : '') || edgeData?.choice?.text || '',
            next: targetId,
        };
        updatedStory.sections[sourceId].next.push(choice);
    }
    return updatedStory;
}
