import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function aistudioMediaPlugin(): Plugin {
  return {
    name: 'vite-plugin-aistudio-media',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/assets/aistudio/')) {
          try {
            const relativePath = decodeURIComponent(req.url.split('?')[0]).replace(/^\//, '');
            const root = path.resolve(__dirname, 'public', 'assets', 'aistudio');
            const filePath = path.resolve(__dirname, 'public', relativePath);
            if (filePath.startsWith(root + path.sep) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          } catch {}
        }
        next();
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), aistudioMediaPlugin()],
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
});
