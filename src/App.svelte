<script lang="ts">
  import { tick } from 'svelte'
  import type { IndexEntry } from './lib/book'
  import { jumpTo } from './lib/smooth-scroll'
  import index from './generated/index.json'
  import Book from './pages/Book.svelte'
  import Shelf from './pages/Shelf.svelte'

  const books = index as IndexEntry[]
  const SITE = 'HD Bookshelf'

  // Hash routes: "#/book/<id>" is a book page, anything else is the shelf.
  function parse(hash: string): string | null {
    const m = /^#\/book\/([^/?#]+)$/.exec(hash)
    return m ? decodeURIComponent(m[1]) : null
  }

  let bookId = $state(parse(location.hash))
  // The shelf stays mounted (filters survive); remember where it was scrolled.
  let shelfY = 0

  // Shelf <-> book swaps run as a view transition: the book's cover on the
  // shelf morphs into the big cover on its page (and back). Browsers without
  // the API, or with reduced motion, just swap.
  const SHARED = 'book-cover'
  let shelfEl: HTMLElement

  /** Give the shared name to that book's first visible cover on the shelf. */
  function nameShelfCover(id: string | null): void {
    for (const el of shelfEl.querySelectorAll<HTMLElement>('.cover')) {
      el.style.viewTransitionName = ''
    }
    if (!id) return
    const hit = [
      ...shelfEl.querySelectorAll<HTMLElement>(`.cover[data-book="${id}"]`),
    ].find((el) => el.getClientRects().length > 0)
    if (hit) hit.style.viewTransitionName = SHARED
  }

  async function onHashChange() {
    const next = parse(location.hash)
    if (next === bookId) return
    const from = bookId
    if (from === null) shelfY = window.scrollY

    const swap = async () => {
      bookId = next
      await tick()
      jumpTo(next === null ? shelfY : 0)
      // Returning: the cover flies back to its spot on the shelf.
      if (next === null) nameShelfCover(from)
    }

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!document.startViewTransition || reduce) return swap()
    // Leaving the shelf: the clicked book's cover is the one that flies.
    if (from === null) nameShelfCover(next)
    await document.startViewTransition(swap).finished.catch(() => {})
    nameShelfCover(null)
  }

  $effect(() => {
    const entry = bookId ? books.find((b) => b.id === bookId) : undefined
    document.title = entry ? `${entry.title} · ${SITE}` : SITE
  })
</script>

<svelte:window onhashchange={onHashChange} />

<div hidden={bookId !== null} bind:this={shelfEl}><Shelf {books} /></div>
{#if bookId !== null}
  {#key bookId}
    <Book id={bookId} {books} />
  {/key}
{/if}
