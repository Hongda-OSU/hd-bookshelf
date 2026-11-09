<script lang="ts">
  import type { IndexEntry } from './lib/book'
  import index from './generated/index.json'
  import Shelf from './pages/Shelf.svelte'

  const books = index as IndexEntry[]
</script>

<Shelf {books} />
