import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  output: 'server',
  security: {
    checkOrigin: false,
  },
  adapter: node({
    mode: 'standalone'
  }),
  vite: {
    plugins: [],
    server: {
      allowedHosts: true
    },
    preview: {
      allowedHosts: true
    }
  }
});
