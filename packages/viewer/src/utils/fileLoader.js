/**
 * File loading utilities for loading story JSON files.
 */
/**
 * Prompts user to select a file and returns its content as text.
 */
export function loadFile() {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files?.[0];
            if (!file) {
                reject(new Error('No file selected'));
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result;
                resolve(content);
            };
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            reader.readAsText(file);
        };
        input.click();
    });
}
