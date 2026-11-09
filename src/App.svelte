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

  async function onHashChange() {
    const next = parse(location.hash)
    if (next === bookId) return
    if (bookId === null) shelfY = window.scrollY
    bookId = next
    await tick()
    jumpTo(next === null ? shelfY : 0)
  }

  $effect(() => {
    const entry = bookId ? books.find((b) => b.id === bookId) : undefined
    document.title = entry ? `${entry.title} · ${SITE}` : SITE
  })
</script>

<svelte:window onhashchange={onHashChange} />

<div hidden={bookId !== null}><Shelf {books} /></div>
{#if bookId !== null}
  {#key bookId}
    <Book id={bookId} {books} />
  {/key}
{/if}
