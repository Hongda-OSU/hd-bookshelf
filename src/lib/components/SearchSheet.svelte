<script lang="ts">
  import { onMount } from 'svelte'
  import type { IndexEntry } from '../book'
  import { bookHref, dotMonth } from '../format'
  import { shelfOrder } from '../order'
  import { lenis } from '../smooth-scroll'
  import Cover from './Cover.svelte'

  // Full-screen search for phones, opened from the shelf toolbar's icon.
  // It keeps its own query: closing it leaves the shelf unfiltered, and it
  // searches every book regardless of the shelf's status/category filters.
  type Props = { books: IndexEntry[]; onclose: () => void }
  let { books, onclose }: Props = $props()

  let query = $state('')
  let input: HTMLInputElement

  const ordered = $derived(shelfOrder(books))
  const hits = $derived.by(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return ordered.filter((b) =>
      `${b.title} ${b.author ?? ''}`.toLowerCase().includes(q),
    )
  })

  function onkeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault()
      onclose()
    }
  }

  onMount(() => {
    const before = document.activeElement
    // The page underneath must not scroll while the sheet is up.
    lenis?.stop()
    const html = document.documentElement
    const overflow = html.style.overflow
    html.style.overflow = 'hidden'
    input.focus()
    return () => {
      lenis?.start()
      html.style.overflow = overflow
      if (before instanceof HTMLElement && before.isConnected) {
        before.focus({ preventScroll: true })
      }
    }
  })
</script>

<div
  class="sheet"
  role="dialog"
  aria-modal="true"
  aria-label="搜索"
  tabindex="-1"
  {onkeydown}
>
  <div class="bar">
    <label class="field">
      <span class="visually-hidden">搜书名或作者</span>
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7"></circle>
        <path d="M20 20l-3.5-3.5"></path>
      </svg>
      <input
        type="search"
        placeholder="搜书名或作者"
        enterkeyhint="search"
        bind:value={query}
        bind:this={input}
      />
    </label>
    <button type="button" class="cancel" onclick={onclose}>取消</button>
  </div>

  {#if query.trim()}
    <p class="note" aria-live="polite">
      {hits.length ? `${hits.length} 本` : '没有找到'}
    </p>
    <ul>
      {#each hits as b (b.id)}
        <li>
          <a href={bookHref(b.id)} onclick={onclose}>
            <span class="thumb">
              <Cover
                id={b.id}
                title={b.title}
                author={b.author}
                cover={b.cover}
                size="sm"
              />
            </span>
            <span class="text">
              <span class="title">{b.title}</span>
              {#if b.author}<span class="author">{b.author}</span>{/if}
              <span class="meta">
                {b.dateFinished ? dotMonth(b.dateFinished) : '在读'} · {b.category}
              </span>
            </span>
          </a>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="note">输入书名或作者</p>
  {/if}
</div>

<style>
  .sheet {
    position: fixed;
    inset: 0;
    z-index: 50;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 16px 20px 32px;
    background: rgba(12, 12, 14, 0.97);
    -webkit-backdrop-filter: blur(16px);
    backdrop-filter: blur(16px);
    animation: fade 0.18s ease-out;
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .sheet {
      animation: none;
    }
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .field {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
  }
  .field svg {
    position: absolute;
    left: 13px;
    width: 16px;
    height: 16px;
    stroke: var(--faint);
    fill: none;
    stroke-width: 2;
  }
  .field input {
    width: 100%;
    min-height: 46px;
    box-sizing: border-box;
    padding: 10px 12px 10px 38px;
    border: 1px solid var(--line-strong);
    border-radius: 12px;
    background: var(--surface);
    /* 16px keeps iOS Safari from zooming in on focus. */
    font-size: 16px;
  }
  .field input:focus {
    outline: none;
    border-color: rgba(236, 232, 225, 0.4);
  }
  .cancel {
    border: 0;
    background: none;
    padding: 8px 0;
    min-height: 40px;
    font-size: 15px;
    color: var(--apricot);
    cursor: pointer;
  }
  .note {
    margin: 22px 2px 10px;
    font: 400 12px var(--mono);
    color: var(--faint);
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  a {
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr);
    gap: 14px;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid var(--line);
  }
  .text {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .title {
    font: 500 16px/1.25 var(--serif);
  }
  .author {
    font-size: 12.5px;
    color: var(--muted);
  }
  .meta {
    font: 400 11px var(--mono);
    color: var(--faint);
  }
</style>
