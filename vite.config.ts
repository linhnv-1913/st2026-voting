import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {writeFileSync} from 'node:fs';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const base = process.env.VITE_BASE_PATH || '/';

  return {
    // GitHub Pages project sites are served from /<repository>/ instead of /.
    // The workflow supplies VITE_BASE_PATH; local builds retain the root path.
    base,
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'github-pages-spa-fallback',
        closeBundle() {
          const normalizedBase = base.endsWith('/') ? base : `${base}/`;
          const redirectScript = `const base=${JSON.stringify(normalizedBase)};const path=window.location.pathname.startsWith(base)?window.location.pathname.slice(base.length):'';const route='/' + path + window.location.search + window.location.hash;window.location.replace(base+'?redirect='+encodeURIComponent(route));`;

          writeFileSync(
            path.resolve(__dirname, 'dist', '404.html'),
            `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Đang chuyển hướng…</title></head><body><script>${redirectScript}</script><p>Đang chuyển hướng…</p></body></html>`,
          );
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
