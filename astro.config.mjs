import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://casadantas.chatwoot.space',
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: ['casadantas.chatwoot.space', 'localhost', '127.0.0.1'],
    },
    preview: {
      allowedHosts: ['casadantas.chatwoot.space', 'localhost', '127.0.0.1'],
    },
  },
  integrations: [
    react(),
    sitemap(),
  ],
  build: {
    assets: '_assets',
  },
  server: {
    host: '0.0.0.0',
    port: 4321,
  },
});
