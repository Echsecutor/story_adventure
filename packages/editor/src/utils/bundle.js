/**
 * Bundle generation utilities for downloading stories in various formats.
 */
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { get_file_safe_title, get_text_from_section } from '@story-adventure/shared';
import viewerBundleManifest from '../viewer-bundle-manifest.json';
// Data URL regexp: matches data:image/<type>;base64,<data>
const DATA_URL_REGEXP = /^data:image\/([a-z]*);base64,(.*)$/;
/**
 * Downloads story JSON as-is without modifications.
 */
export async function downloadAsIs(story) {
    const json = JSON.stringify(story, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const filename = `${get_file_safe_title(story)}.json`;
    saveAs(blob, filename);
}
/**
 * Recursively embeds external images in story sections by converting them to data URLs.
 */
async function downloadMediaInSection(story, currentIndex, sectionIds, finalCallback) {
    if (currentIndex >= sectionIds.length) {
        finalCallback();
        return;
    }
    const sectionId = sectionIds[currentIndex];
    if (!sectionId) {
        downloadMediaInSection(story, currentIndex + 1, sectionIds, finalCallback);
        return;
    }
    const section = story.sections[sectionId];
    if (section?.media?.src && !section.media.src.startsWith('data')) {
        try {
            const response = await fetch(section.media.src);
            if (response.status === 200) {
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onload = (event) => {
                    const dataUrl = event.target?.result;
                    if (dataUrl && section) {
                        section.media.src = dataUrl;
                    }
                    downloadMediaInSection(story, currentIndex + 1, sectionIds, finalCallback);
                };
                reader.readAsDataURL(blob);
                return;
            }
            else {
                console.log(`Error ${response.status} fetching pic ${section.media.src}`);
            }
        }
        catch (error) {
            console.error(`Error fetching ${section.media.src}:`, error);
        }
    }
    downloadMediaInSection(story, currentIndex + 1, sectionIds, finalCallback);
}
/**
 * Downloads story with all external images embedded as data URLs.
 */
export async function downloadGraphInOne(story) {
    const sectionIds = Object.keys(story.sections);
    const storyCopy = JSON.parse(JSON.stringify(story));
    return new Promise((resolve) => {
        downloadMediaInSection(storyCopy, 0, sectionIds, () => {
            downloadAsIs(storyCopy);
            resolve();
        });
    });
}
/**
 * Generates a playable bundle ZIP containing:
 * - Pre-built viewer files (from manifest)
 * - Story JSON with rewritten image paths
 * - Extracted images as separate files
 * - Root index.html redirect
 */
export async function downloadGraphSplit(story) {
    const storyDeepCopy = JSON.parse(JSON.stringify(story));
    const zip = new JSZip();
    const storyFolder = zip.folder('stories').folder(get_file_safe_title(story));
    const waitForAll = [];
    // Extract images from sections
    for (const sectionId in story.sections) {
        const section = story.sections[sectionId];
        if (!section?.media?.src) {
            continue;
        }
        const match = section.media.src.match(DATA_URL_REGEXP);
        if (match && match[1] && match[2]) {
            // Data URL: extract base64 data
            const type = match[1] || 'png';
            const data = match[2];
            const fileName = `${sectionId}.${type}`;
            const sectionCopy = storyDeepCopy.sections[sectionId];
            if (sectionCopy?.media) {
                sectionCopy.media.src = `../stories/${get_file_safe_title(story)}/${fileName}`;
            }
            storyFolder.file(fileName, data, { base64: true });
        }
        else {
            // External URL: fetch and add to ZIP
            const typeMatch = section.media.src.match(/.*\.([a-zA-Z]*)$/);
            let type = 'jpg';
            if (typeMatch && typeMatch[1]) {
                type = typeMatch[1];
            }
            else {
                console.warn('Could not determine file type of', section.media.src);
            }
            const fileName = `${sectionId}.${type}`;
            const sectionCopy = storyDeepCopy.sections[sectionId];
            if (sectionCopy?.media) {
                sectionCopy.media.src = `../stories/${get_file_safe_title(story)}/${fileName}`;
            }
            waitForAll.push(fetch(section.media.src)
                .then((response) => response.blob())
                .then((blob) => {
                storyFolder.file(fileName, blob);
                console.debug('Saved', fileName);
            })
                .catch((error) => {
                const mediaSrc = section.media?.src || 'unknown';
                console.error(`Error fetching ${mediaSrc}:`, error);
            }));
        }
    }
    // Wait for all external images to be fetched
    if (waitForAll.length > 0) {
        await Promise.all(waitForAll);
    }
    // Add story JSON
    storyFolder.file(`${get_file_safe_title(story)}.json`, JSON.stringify(storyDeepCopy, null, 2));
    // Add viewer and launcher files from manifest
    const viewerFolder = zip.folder('viewer');
    const launcherFolder = zip.folder('launcher');
    const manifest = viewerBundleManifest;
    // Validate manifest is not empty
    if (!manifest.files || Object.keys(manifest.files).length === 0) {
        throw new Error('Viewer bundle manifest is empty. Please run: pnpm build:viewer-for-bundle');
    }
    for (const [filePath, content] of Object.entries(manifest.files)) {
        if (filePath.startsWith('launcher/')) {
            // Add launcher files to launcher folder
            const relativePath = filePath.replace(/^launcher\//, '');
            if (typeof content === 'string') {
                launcherFolder.file(relativePath, content);
            }
            else if (content && typeof content === 'object' && 'base64' in content) {
                // Handle binary files stored as base64
                launcherFolder.file(relativePath, content.base64, { base64: true });
            }
        }
        else if (filePath.startsWith('viewer/')) {
            // Add viewer files to viewer folder
            const relativePath = filePath.replace(/^viewer\//, '');
            if (typeof content === 'string') {
                viewerFolder.file(relativePath, content);
            }
        }
    }
    // Add root index.html redirect
    const storyName = get_file_safe_title(story);
    zip.file('index.html', `<!DOCTYPE html>
<html>
  <head>
    <title>Loading Adventure...</title>
  </head>
  <body>
    <script>
        window.location.href="./viewer/?load=../stories/${storyName}/${storyName}.json";
    </script>
  </body>
</html>
`);
    // Generate ZIP
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${get_file_safe_title(story)}.zip`);
}
/**
 * Depth-first search to find a path through the story graph.
 * @param linearizedHistory - Current path (array of section IDs)
 * @param endAt - Target section ID to reach
 * @param passingThrough - Array of section IDs that must be visited
 * @param story - Story object containing sections
 * @returns Array of section IDs representing the path, or null if no path found
 */
export async function depthFirstSearch(linearizedHistory, endAt, passingThrough, story) {
    if (linearizedHistory.length === 0) {
        return null;
    }
    const currentSectionId = linearizedHistory[linearizedHistory.length - 1];
    if (!currentSectionId) {
        return null;
    }
    // Check if we've reached the target
    if (currentSectionId === endAt) {
        // Verify we've passed through all required sections
        if (passingThrough.length > 0) {
            for (const passing of passingThrough) {
                if (!linearizedHistory.includes(String(passing)) &&
                    !linearizedHistory.includes(Number(passing).toString())) {
                    return null;
                }
            }
        }
        return linearizedHistory;
    }
    const currentSection = story.sections[currentSectionId];
    if (!currentSection) {
        return null;
    }
    if (!currentSection.next || currentSection.next.length === 0) {
        return null; // Dead end
    }
    // Try each choice
    for (const choice of currentSection.next) {
        const nextId = String(choice.next);
        // Avoid cycles
        if (linearizedHistory.includes(nextId)) {
            continue;
        }
        const foundPath = await depthFirstSearch([...linearizedHistory, nextId], endAt, passingThrough, story);
        if (foundPath) {
            return foundPath;
        }
    }
    return null;
}
/**
 * Converts a list of section IDs to markdown format.
 */
export function markdownFromSectionIdList(sectionIds, story) {
    let md = '';
    for (const id of sectionIds) {
        const section = story.sections[id];
        if (section) {
            md += get_text_from_section(section, story.state?.variables);
            md += '\n\n';
            if (section.media?.src) {
                md += `![](${section.media.src})\n\n`;
            }
        }
    }
    return md;
}
/**
 * Creates a linear markdown export of the story.
 * Prompts user for start section, end section, and sections to pass through.
 */
export async function downloadLinearStory(story, startAt, endAt, passingThrough) {
    const linearizedHistory = await depthFirstSearch([startAt], endAt, passingThrough, story);
    if (!linearizedHistory) {
        throw new Error(`Could not find a linear story which starts at ${startAt} and ends at ${endAt} while passing through all of ${passingThrough.join(', ')}`);
    }
    const markdown = markdownFromSectionIdList(linearizedHistory, story);
    const blob = new Blob([markdown], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${get_file_safe_title(story)}.md`);
}
