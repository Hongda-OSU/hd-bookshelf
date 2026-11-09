import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

/** Undefined when the user prefers reduced motion (native scrolling). */
export let lenis: Lenis | undefined

export function initSmoothScroll(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  // Touch devices keep native scrolling (Lenis default: syncTouch off).
  lenis = new Lenis({ autoRaf: true })
}
