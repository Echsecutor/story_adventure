import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

/**
 * Vite plugin to serve the monorepo stories directory at /stories/ during development.
 * In production, stories are served by the hosting environment (e.g. GitHub Pages or bundle).
 */
function serveMonorepoStories(): Plugin {
  const storiesDir = path.resolve(__dirname, '../../stories');
  const mimeTypes: Record<string, string> = {
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
  };

  return {
    name: 'serve-monorepo-stories',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0]; // strip query params
        if (!url || !url.startsWith('/stories/')) {
          return next();
        }
        const relativePath = decodeURIComponent(url.slice('/stories/'.length));
        const filePath = path.join(storiesDir, relativePath);

        // Prevent directory traversal
        if (!filePath.startsWith(storiesDir)) {
          return next();
        }

        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          const contentType = mimeTypes[ext] || 'application/octet-stream';
          res.setHeader('Content-Type', contentType);
          fs.createReadStream(filePath).pipe(res);
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), serveMonorepoStories()],
  base: './',
  resolve: {
    alias: {
      '@story-adventure/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  server: {
    port: 5174,
  },
});
