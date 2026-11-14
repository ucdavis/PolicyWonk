import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'node',
    // Let Vite resolve Auth.js's extensionless Next imports in HTTP tests.
    server: { deps: { inline: ['next-auth'] } },
  },
});
