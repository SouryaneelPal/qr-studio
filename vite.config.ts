/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  plugins: [react()],
  build: {
    // The stress-test worker (about 150 kB) is inlined so it starts without a network request,
    // and the theme artwork is code, so the single bundle is knowingly larger than usual.
    chunkSizeWarningLimit: 700,
    // Fonts are inlined too: browsers fetch a font only when text first needs it, which would
    // otherwise mean requests after load (and failures offline) as new panels appear.
    assetsInlineLimit: (filePath) => (filePath.endsWith('.woff2') ? true : undefined),
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          globals: true,
          setupFiles: ['./src/test/setup.ts'],
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['src/**/*.browser.test.ts'],
          css: false,
        },
      },
      {
        // Framed codes need a real canvas and real fonts to render, so these run in Chromium.
        extends: true,
        test: {
          name: 'browser',
          globals: true,
          include: ['src/**/*.browser.test.ts'],
          testTimeout: 60_000,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
