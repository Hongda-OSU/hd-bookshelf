import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import { initSmoothScroll } from './lib/smooth-scroll'

initSmoothScroll()

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
