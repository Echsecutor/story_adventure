#!/usr/bin/env node
/**
 * Build script that:
 * 1. Builds the viewer package
 * 2. Copies viewer dist to editor public/viewer-dist/
 * 3. Generates viewer-bundle-manifest.json with file contents
 */

import { execSync } from 'child_process';
import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const viewerDistDir = join(rootDir, 'packages/viewer/dist');
const editorPublicDir = join(rootDir, 'packages/editor/public');
const viewerDistTargetDir = join(editorPublicDir, 'viewer-dist');
const manifestPath = join(rootDir, 'packages/editor/src/viewer-bundle-manifest.json');

console.log('Building viewer package...');
execSync('pnpm --filter viewer build', { cwd: rootDir, stdio: 'inherit' });

console.log('Copying viewer dist to editor public/viewer-dist/...');
// Remove existing viewer-dist if it exists
try {
  execSync(`rm -rf "${viewerDistTargetDir}"`, { cwd: rootDir });
} catch (e) {
  // Ignore if doesn't exist
}

// Copy entire dist directory
execSync(`cp -r "${viewerDistDir}" "${viewerDistTargetDir}"`, { cwd: rootDir });

console.log('Generating viewer-bundle-manifest.json...');

/**
 * Recursively read all files in a directory and return a map of relative paths to file contents
 */
function readDirectoryRecursive(dir, baseDir = dir, prefix = 'viewer') {
  const manifest = {};
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      Object.assign(manifest, readDirectoryRecursive(fullPath, baseDir, prefix));
    } else if (stat.isFile()) {
      const relativePath = relative(baseDir, fullPath);
      // Normalize path separators to forward slashes
      const normalizedPath = relativePath.replace(/\\/g, '/');
      // Prefix with the specified prefix for the manifest
      const manifestPath = `${prefix}/${normalizedPath}`;
      // Read binary files as base64, text files as utf-8
      // Detect binaries: .exe files, miniserve binaries (Linux), or .bin files
      const fileName = fullPath.split('/').pop() || '';
      const isBinary = fullPath.match(/\.(exe|bin)$/) || fileName.startsWith('miniserve-');
      const content = isBinary 
        ? readFileSync(fullPath).toString('base64')
        : readFileSync(fullPath, 'utf-8');
      manifest[manifestPath] = isBinary ? { base64: content } : content;
    }
  }

  return manifest;
}

// Read launcher files
const launcherDir = join(editorPublicDir, 'launcher');
const launcherFiles = readDirectoryRecursive(launcherDir, launcherDir, 'launcher');

// Combine viewer and launcher files
const manifest = {
  files: {
    ...readDirectoryRecursive(viewerDistDir),
    ...launcherFiles,
  },
};

// Ensure the directory exists
mkdirSync(dirname(manifestPath), { recursive: true });

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

console.log(`Manifest generated: ${manifestPath}`);
console.log(`Total files: ${Object.keys(manifest.files).length}`);
