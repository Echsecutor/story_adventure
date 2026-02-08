/**
 * File saving utilities for downloading save game files.
 */

/**
 * Downloads a blob as a file with the given filename.
 */
export function saveAs(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
