<script lang="ts">
  import { onMount } from 'svelte'
  import type { IndexEntry } from '../book'
  import { lenis } from '../smooth-scroll'
  import Cover from './Cover.svelte'

  // Hidden "surprise mode": an endless wall of covers to drag around. Tiles
  // leaving one edge come back on the other. Opened from App.svelte.
  type Props = {
    books: IndexEntry[]
    onpick: (id: string) => void
    onclose: () => void
  }
  let { books, onpick, onclose }: Props = $props()

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const DRAG = 1.6 // the wall moves faster than the pointer
  const TAU = 0.18 // seconds the glide lags behind the target
  const KEY_STEP = 160
  const CLICK_SLOP = 6 // px of movement that still counts as a click
  // The wall opens under the pointer that tapped the wordmark; further fast
  // taps there would land on a cover and open it. Picks are ignored until
  // the covers have popped in, and for as long as the tapping keeps going:
  // each press inside the guard pushes it on, so only a deliberate tap
  // after a pause opens a book.
  const PICK_DELAY = 800 // ms after opening
  const TAP_PAUSE = 400 // ms of quiet needed after a burst of taps
  let pickGuard = performance.now() + PICK_DELAY

  type Geometry = {
    tw: number
    th: number
    cellW: number
    cellH: number
    cols: number
    rows: number
  }
  type Tile = { book: IndexEntry; x: number; y: number; delay: number }

  function measure(): Geometry {
    const small = innerWidth < 700
    const tw = small ? 120 : 180
    const th = tw * 1.5
    const cellW = tw + (small ? 20 : 32)
    const cellH = th + (small ? 26 : 40)
    // At least two spare cells beyond each edge, so tiles wrap off-screen.
    return {
      tw,
      th,
      cellW,
      cellH,
      cols: Math.max(7, Math.ceil(innerWidth / cellW) + 3),
      rows: Math.max(4, Math.ceil(innerHeight / cellH) + 3),
    }
  }

  function shuffle<T>(list: T[]): T[] {
    const a = [...list]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  /** One shuffled row, with no book next to itself (across the seam too). */
  function row(cols: number): IndexEntry[] {
    let out: IndexEntry[] = []
    while (out.length < cols) {
      let next = shuffle(books)
      while (books.length > 1 && out.at(-1) === next[0]) next = shuffle(books)
      out = out.concat(next)
    }
    out = out.slice(0, cols)
    if (books.length > 2 && out[0] === out[cols - 1]) {
      out[cols - 1] = books.find((b) => b !== out[0] && b !== out[cols - 2])!
    }
    return out
  }

  function layout(g: Geometry): Tile[] {
    const tiles: Tile[] = []
    for (let r = 0; r < g.rows; r++) {
      row(g.cols).forEach((book, c) => {
        tiles.push({
          book,
          // Odd rows sit half a cell over, like bricks.
          x: c * g.cellW + (r % 2 ? g.cellW / 2 : 0),
          y: r * g.cellH,
          delay: reduce ? 0 : Math.random() * 0.35,
        })
      })
    }
    return tiles
  }

  let geo = $state(measure())
  const tiles = $derived(layout(geo))
  const wallW = $derived(geo.cols * geo.cellW)
  const wallH = $derived(geo.rows * geo.cellH)
  let nodes: HTMLElement[] = $state([])

  let root: HTMLElement
  let shown = $state(false)
  let closing = $state(false)

  // One target offset; the drawn offset eases toward it every frame and each
  // tile is wrapped from the drawn offset. Wrapping what is on screen (rather
  // than where each tile is heading) keeps a fast fling from opening gaps.
  const target = { x: 0, y: 0 }
  const drawn = { x: 0, y: 0 }
  let raf = 0
  let last = 0
  const mod = (n: number, m: number) => ((n % m) + m) % m

  function place(): void {
    const { cellW, cellH } = geo
    tiles.forEach((t, i) => {
      const node = nodes[i]
      if (!node) return
      const px = mod(t.x + drawn.x + cellW / 2, wallW) - cellW / 2
      const py = mod(t.y + drawn.y + cellH / 2, wallH) - cellH / 2
      node.style.transform = `translate3d(${px}px, ${py}px, 0)`
    })
  }

  function frame(now: number): void {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
    last = now
    const k = reduce ? 1 : 1 - Math.exp(-dt / TAU)
    drawn.x += (target.x - drawn.x) * k
    drawn.y += (target.y - drawn.y) * k
    const settled =
      Math.abs(target.x - drawn.x) < 0.1 && Math.abs(target.y - drawn.y) < 0.1
    if (settled) {
      drawn.x = target.x
      drawn.y = target.y
    }
    place()
    if (settled) {
      raf = 0
      last = 0
      return
    }
    raf = requestAnimationFrame(frame)
  }

  function pan(dx: number, dy: number): void {
    target.x += dx
    target.y += dy
    if (!raf) raf = requestAnimationFrame(frame)
  }

  // Re-place whenever the tiles are (re)built.
  $effect(() => {
    void tiles
    void nodes.length
    place()
  })

  let down: { x: number; y: number } | null = null
  let moved = 0

  function onpointerdown(e: PointerEvent): void {
    if (e.button !== 0) return
    const now = performance.now()
    if (now < pickGuard) pickGuard = Math.max(pickGuard, now + TAP_PAUSE)
    down = { x: e.clientX, y: e.clientY }
    moved = 0
    root.setPointerCapture(e.pointerId)
  }

  function onpointermove(e: PointerEvent): void {
    if (!down) return
    const dx = e.clientX - down.x
    const dy = e.clientY - down.y
    moved += Math.abs(dx) + Math.abs(dy)
    down = { x: e.clientX, y: e.clientY }
    pan(dx * DRAG, dy * DRAG)
  }

  function onpointerup(e: PointerEvent): void {
    if (!down) return
    down = null
    if (moved >= CLICK_SLOP) return
    if (performance.now() < pickGuard) return
    const hit = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest<HTMLElement>('[data-pick]')
    if (hit?.dataset.pick) onpick(hit.dataset.pick)
  }

  const KEYS: Record<string, [number, number]> = {
    ArrowLeft: [KEY_STEP, 0],
    ArrowRight: [-KEY_STEP, 0],
    ArrowUp: [0, KEY_STEP],
    ArrowDown: [0, -KEY_STEP],
  }

  function onkeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
      return
    }
    const step = KEYS[e.key]
    if (!step) return
    e.preventDefault()
    pan(step[0], step[1])
  }

  function close(): void {
    if (closing) return
    closing = true
    setTimeout(onclose, reduce ? 0 : 250)
  }

  onMount(() => {
    // Hand focus back on close only if it was visibly there (keyboard use).
    // After five taps on the wordmark it is focused but unringed; restoring
    // it after Esc would make the browser draw a focus ring on it.
    const before = document.activeElement
    const restore =
      before instanceof HTMLElement && before.matches(':focus-visible')
        ? before
        : null
    // The page underneath must not scroll while the wall is up.
    lenis?.stop()
    // Not a Svelte handler: those are passive for wheel, and this one has to
    // cancel the page scroll.
    const onwheel = (e: WheelEvent) => {
      e.preventDefault()
      pan(-e.deltaX, -e.deltaY)
    }
    root.addEventListener('wheel', onwheel, { passive: false })
    const onresize = () => (geo = measure())
    window.addEventListener('resize', onresize)
    root.focus({ preventScroll: true })
    // Two frames: let the tiles paint small first so they can pop in.
    requestAnimationFrame(() => requestAnimationFrame(() => (shown = true)))
    return () => {
      cancelAnimationFrame(raf)
      root.removeEventListener('wheel', onwheel)
      window.removeEventListener('resize', onresize)
      lenis?.start()
      if (restore?.isConnected) restore.focus({ preventScroll: true })
    }
  })
</script>

<div
  class="wall"
  class:shown={shown && !closing}
  bind:this={root}
  role="dialog"
  aria-modal="true"
  aria-label="惊喜模式：拖动或用方向键浏览封面，点封面打开那本书，Esc 退出"
  tabindex="-1"
  {onpointerdown}
  {onpointermove}
  {onpointerup}
  onpointercancel={() => (down = null)}
  {onkeydown}
>
  <div
    class="plane"
    style:left="{(innerWidth - wallW + geo.cellW) / 2}px"
    style:top="{(innerHeight - wallH + geo.cellH) / 2}px"
    style:--tile-w="{geo.tw}px"
  >
    {#each tiles as tile, i (i)}
      <div
        class="tile"
        data-pick={tile.book.id}
        title={tile.book.title}
        bind:this={nodes[i]}
      >
        <div class="pop" style:transition-delay="{tile.delay}s">
          <Cover
            id={tile.book.id}
            title={tile.book.title}
            author={tile.book.author}
            cover={tile.book.cover}
            size="md"
          />
        </div>
      </div>
    {/each}
  </div>
  <div class="bar" aria-hidden="true">
    <span>拖动浏览 · 点封面打开</span>
  </div>
  <button
    class="exit"
    type="button"
    onpointerdown={(e) => e.stopPropagation()}
    onclick={close}
  >
    退出 <kbd>Esc</kbd>
  </button>
</div>

<style>
  .wall {
    position: fixed;
    inset: 0;
    z-index: 100;
    overflow: hidden;
    background: rgba(10, 10, 12, 0.94);
    backdrop-filter: blur(6px);
    cursor: grab;
    touch-action: none;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  .wall.shown {
    opacity: 1;
  }
  .wall:active {
    cursor: grabbing;
  }
  .wall:focus {
    outline: none;
  }
  .plane {
    position: absolute;
  }
  .tile {
    position: absolute;
    left: 0;
    top: 0;
    width: var(--tile-w);
    will-change: transform;
  }
  .pop {
    transform: scale(0.6);
    opacity: 0;
    transition:
      transform 0.7s cubic-bezier(0.16, 1, 0.3, 1),
      opacity 0.5s ease;
  }
  .shown .pop {
    transform: none;
    opacity: 1;
  }
  .tile :global(.cover) {
    box-shadow: 0 18px 30px rgba(0, 0, 0, 0.45);
  }
  .tile :global(img) {
    transition: transform 0.35s ease;
  }
  .tile:hover :global(img) {
    transform: scale(1.06);
  }
  .bar,
  .exit {
    position: fixed;
    bottom: 26px;
    padding: 9px 16px;
    border-radius: 999px;
    background: rgba(23, 23, 26, 0.9);
    border: 1px solid var(--line-strong);
    font: 400 12px/1 var(--mono);
    white-space: nowrap;
  }
  .bar {
    left: 50%;
    transform: translateX(-50%);
    color: var(--muted);
    pointer-events: none;
  }
  .exit {
    right: 26px;
    color: var(--text);
    cursor: pointer;
  }
  .exit:hover {
    color: var(--apricot);
  }
  .exit:focus-visible {
    outline: 2px solid var(--apricot);
    outline-offset: 2px;
  }
  kbd {
    font: inherit;
    color: var(--muted);
  }
  @media (max-width: 700px) {
    .bar {
      display: none;
    }
    .exit {
      left: 50%;
      right: auto;
      transform: translateX(-50%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .wall,
    .pop,
    .tile :global(img) {
      transition: none;
    }
  }
</style>
