import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import { initSmoothScroll } from './lib/smooth-scroll'

initSmoothScroll()

// Nothing on the site is meant to be dragged: covers, icons and the links
// wrapping them would otherwise drag out as images. CSS user-drag doesn't
// cover Firefox, so block it here.
document.addEventListener('dragstart', (e) => e.preventDefault())

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
