<script lang="ts">
  import type { IndexEntry } from '../book'
  import { bookHref, dotMonth } from '../format'
  import Cover from './Cover.svelte'

  let { book }: { book: IndexEntry } = $props()
</script>

<a class="card" href={bookHref(book.id)}>
  <Cover
    id={book.id}
    title={book.title}
    author={book.author}
    cover={book.cover}
    size="sm"
  />
  <div class="body">
    <span class="badge">
      在读{book.dateStarted ? ` · ${dotMonth(book.dateStarted)} 开始` : ''}
    </span>
    <p class="title">{book.title}</p>
    {#if book.author}<p class="author">{book.author}</p>{/if}
    {#if book.lastSentence}
      <p class="quote">{book.lastSentence}</p>
    {/if}
    <div class="meta">
      <span>{book.sentenceCount} 句摘录</span>
      {#if book.lastAddedAt}<span>最近 {book.lastAddedAt}</span>{/if}
    </div>
  </div>
</a>

<style>
  .card {
    display: grid;
    grid-template-columns: clamp(72px, 26%, 96px) minmax(0, 1fr);
    gap: clamp(12px, 4vw, 18px);
    align-items: start;
    padding: 16px;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 10px;
  }
  .card:hover {
    border-color: rgba(236, 232, 225, 0.22);
  }
  .badge {
    display: inline-flex;
    font: 500 11px/1 var(--mono);
    padding: 5px 9px;
    border-radius: 999px;
    white-space: nowrap;
    background: var(--accent-soft);
    color: var(--accent);
  }
  .title {
    margin: 10px 0 0;
    font: 500 18px/1.2 var(--serif);
  }
  .author {
    margin: 3px 0 0;
    font-size: 13px;
    color: var(--muted);
  }
  .quote {
    margin: 12px 0 0;
    padding-left: 10px;
    border-left: 2px solid var(--accent);
    font: italic 400 15px/1.5 var(--serif);
  }
  .meta {
    margin-top: 12px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    font: 400 11px/1.4 var(--mono);
    color: var(--muted);
  }
</style>
