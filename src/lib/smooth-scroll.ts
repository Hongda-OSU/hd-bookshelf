import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

/** Undefined when the user prefers reduced motion (native scrolling). */
export let lenis: Lenis | undefined

// After a route swap, wheel events that continue an unbroken stream are
// trackpad momentum from the previous page and get dropped. A pause longer
// than GESTURE_GAP means a fresh gesture, which ends the guard early.
const GESTURE_GAP = 120
const MAX_GUARD = 3000
let guardUntil = 0
let lastWheel = 0

function dropTrailingWheel(e: WheelEvent): void {
  // Event creation time, not handling time: the route swap can stall the main
  // thread and deliver a continuous stream in a late burst.
  const now = e.timeStamp
  const gap = now - lastWheel
  lastWheel = now
  if (now >= guardUntil) return
  if (gap > GESTURE_GAP) {
    guardUntil = 0
    return
  }
  e.preventDefault()
  // Capture listener on window runs before Lenis' own wheel listener.
  e.stopImmediatePropagation()
}

/**
 * Jump (no animation) to a vertical position after a route swap.
 *
 * Two things used to leave a freshly opened book page scrolled down:
 * - Lenis was still easing toward the shelf's scroll target. Its resize()
 *   doesn't stop that ease, and scrollTo() returns early when the target
 *   already matches, so the old ease kept running. stop() + start() kills it.
 * - Trackpad momentum kept sending wheel events after the click. The rest of
 *   that stream is dropped so it can't scroll the page we just landed on.
 */
export function jumpTo(y: number): void {
  guardUntil = performance.now() + MAX_GUARD
  if (lenis) {
    lenis.stop()
    lenis.start()
  }
  window.scrollTo(0, y)
  // The page height just changed; re-measure and adopt the new position.
  lenis?.resize()
}

export function initSmoothScroll(): void {
  window.addEventListener('wheel', dropTrailingWheel, {
    capture: true,
    passive: false,
  })
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  // Touch devices keep native scrolling (Lenis default: syncTouch off).
  lenis = new Lenis({ autoRaf: true })
}
