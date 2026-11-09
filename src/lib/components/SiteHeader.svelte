<script lang="ts">
  import type { Snippet } from 'svelte'

  let { children }: { children?: Snippet } = $props()
</script>

<header>
  <a class="brand" href="#/">Hongda's Shelf</a>
  {@render children?.()}
</header>

<style>
  header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px 16px;
    padding: 22px 0;
    border-bottom: 1px solid var(--line);
  }
  .brand {
    font: 600 18px/1 var(--serif);
    letter-spacing: -0.01em;
    padding: 10px 0;
  }
</style>
