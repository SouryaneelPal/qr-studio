/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // The stress-test worker is inlined (about 150 kB) so it starts without a network request.
    chunkSizeWarningLimit: 600,
    // Fonts are inlined too: browsers fetch a font only when text first needs it, which would
    // otherwise mean requests after load (and failures offline) as new panels appear.
    assetsInlineLimit: (filePath) => (filePath.endsWith('.woff2') ? true : undefined),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
});
