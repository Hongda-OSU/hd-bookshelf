<script lang="ts">
  import type { IndexEntry } from './lib/book'
  import index from './generated/index.json'

  const books = index as IndexEntry[]
</script>

<main>
  <h1>Hongda's Shelf</h1>
  <ul>
    {#each books as book (book.id)}
      <li>{book.title} · {book.status} · {book.sentenceCount}</li>
    {/each}
  </ul>
</main>
