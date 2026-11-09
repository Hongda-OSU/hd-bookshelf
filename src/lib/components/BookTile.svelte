<script lang="ts">
  import type { IndexEntry } from '../book'
  import { bookHref, dotMonth } from '../format'
  import Cover from './Cover.svelte'

  let { book }: { book: IndexEntry } = $props()
</script>

<a class="tile" href={bookHref(book.id)}>
  <div class="lift">
    <Cover
      id={book.id}
      title={book.title}
      author={book.author}
      cover={book.cover}
      size="md"
    />
  </div>
  <div>
    <p class="title">{book.title}</p>
    {#if book.author}<p class="author">{book.author}</p>{/if}
    <div class="meta">
      <span>
        {book.dateFinished
          ? `${dotMonth(book.dateFinished)} · `
          : ''}{book.category}
      </span>
      <span class="count">{book.sentenceCount} 句</span>
    </div>
  </div>
</a>

<style>
  .tile {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .lift {
    transition:
      transform 0.25s ease,
      filter 0.25s ease;
  }
  .tile:hover .lift {
    transform: translateY(-4px) rotate(-0.6deg);
    filter: drop-shadow(0 14px 20px rgba(0, 0, 0, 0.45));
  }
  @media (prefers-reduced-motion: reduce) {
    .lift {
      transition: none;
    }
  }
  .title {
    margin: 0;
    font: 500 16px/1.25 var(--serif);
  }
  .author {
    margin: 2px 0 0;
    font-size: 12.5px;
    color: var(--muted);
  }
  .meta {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-top: 8px;
    font: 400 11px/1.3 var(--mono);
    color: var(--faint);
  }
  .count {
    color: var(--muted);
    white-space: nowrap;
  }
</style>
