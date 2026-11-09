import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// GitHub Pages serves the site under /<repo>/
export default defineConfig({
  base: '/hd-bookshelf/',
  plugins: [svelte()],
})
