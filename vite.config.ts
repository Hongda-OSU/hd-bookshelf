import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

export default defineConfig({
  // GitHub Pages serves the site under /<repo>/
  base: '/hd-bookshelf/',
  plugins: [svelte()],
})
