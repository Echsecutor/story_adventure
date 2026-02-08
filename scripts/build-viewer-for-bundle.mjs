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
function readDirectoryRecursive(dir, baseDir = dir) {
  const manifest = {};
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      Object.assign(manifest, readDirectoryRecursive(fullPath, baseDir));
    } else if (stat.isFile()) {
      const relativePath = relative(baseDir, fullPath);
      // Normalize path separators to forward slashes
      const normalizedPath = relativePath.replace(/\\/g, '/');
      // Prefix with "viewer/" for the manifest
      const manifestPath = `viewer/${normalizedPath}`;
      const content = readFileSync(fullPath, 'utf-8');
      manifest[manifestPath] = content;
    }
  }

  return manifest;
}

const manifest = {
  files: readDirectoryRecursive(viewerDistDir),
};

// Ensure the directory exists
mkdirSync(dirname(manifestPath), { recursive: true });

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

console.log(`Manifest generated: ${manifestPath}`);
console.log(`Total files: ${Object.keys(manifest.files).length}`);
