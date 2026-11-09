import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

/** Undefined when the user prefers reduced motion (native scrolling). */
export let lenis: Lenis | undefined

/** Jump (no animation) to a vertical position, via Lenis when it's running. */
export function jumpTo(y: number): void {
  if (!lenis) {
    window.scrollTo(0, y)
    return
  }
  // The page height just changed (route swap); Lenis caches it and would
  // clamp the jump to the old height.
  lenis.resize()
  lenis.scrollTo(y, { immediate: true, force: true })
}

export function initSmoothScroll(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  // Touch devices keep native scrolling (Lenis default: syncTouch off).
  lenis = new Lenis({ autoRaf: true })
}
