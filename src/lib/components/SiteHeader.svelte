<script lang="ts">
  import type { Snippet } from 'svelte'

  let { children }: { children?: Snippet } = $props()
</script>

<header>
  <a class="brand" href="#/">HD Bookshelf</a>
  {@render children?.()}
</header>

<style>
  header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px 16px;
    padding: 18px 0;
    border-bottom: 1px solid var(--line);
  }
  .brand {
    padding: 14px 0;
    /* Wordmark: written "HD Bookshelf" in markup so screen readers
       say it naturally; shown in caps. */
    font: 600 14px/1 var(--sans);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
</style>
