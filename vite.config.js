import { defineConfig } from 'vite';

export default defineConfig({
  base: '/vigilant-fiesta/', // GitHub Pages base path
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html',
    },
  },
  server: {
    open: true,
  },
});
