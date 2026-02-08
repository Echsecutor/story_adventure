/**
 * Media handling utilities for image paste and loading.
 */

/**
 * Handles paste event and extracts image from clipboard if present.
 * 
 * @param event - Clipboard paste event
 * @returns Promise resolving to data URL if image found, null otherwise
 */
export function handleImagePaste(event: ClipboardEvent): Promise<string | null> {
  return new Promise((resolve) => {
    const clipboardData = event.clipboardData || (window as any).clipboardData;
    if (!clipboardData) {
      resolve(null);
      return;
    }

    const item = clipboardData.items?.[0];
    if (item?.type?.indexOf('image') === 0) {
      // Get the blob of the image
      const blob = item.getAsFile();
      if (!blob) {
        resolve(null);
        return;
      }

      // Create a file reader
      const reader = new FileReader();

      // Set the onload event handler
      reader.onload = (loadEvent) => {
        // Get the data URL of the image
        const content = loadEvent.target?.result as string;
        resolve(content);
      };

      reader.onerror = () => {
        resolve(null);
      };

      // Read the blob as a data URL
      reader.readAsDataURL(blob);
    } else {
      resolve(null);
    }
  });
}
