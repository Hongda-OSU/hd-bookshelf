<script lang="ts">
  import type { IndexEntry, Status } from '../lib/book'
  import BookTile from '../lib/components/BookTile.svelte'
  import MonthChart from '../lib/components/MonthChart.svelte'
  import SiteHeader from '../lib/components/SiteHeader.svelte'
  import ReadingCard from '../lib/components/ReadingCard.svelte'
  import { byFinishedDesc, byReadingRecency } from '../lib/order'

  let { books }: { books: IndexEntry[] } = $props()

  const now = new Date()
  const year = now.getFullYear()

  type StatusFilter = 'all' | Status
  const STATUS_OPTIONS: [StatusFilter, string][] = [
    ['all', '全部'],
    ['reading', '在读'],
    ['finished', '读完'],
  ]
  const ALL = '全部'

  let status = $state<StatusFilter>('all')
  let category = $state(ALL)
  let query = $state('')

  const finished = $derived(books.filter((b) => b.status === 'finished'))
  const reading = $derived(books.filter((b) => b.status === 'reading'))
  const finishedThisYear = $derived(
    finished.filter((b) => b.dateFinished?.startsWith(`${year}-`)),
  )
  const sentenceTotal = $derived(books.reduce((n, b) => n + b.sentenceCount, 0))

  // Categories ordered by how many books use them.
  const categories = $derived.by(() => {
    const counts = new Map<string, number>()
    for (const b of books)
      counts.set(b.category, (counts.get(b.category) ?? 0) + 1)
    return [...counts]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh'))
      .map(([name]) => name)
  })

  function matches(b: IndexEntry): boolean {
    if (category !== ALL && b.category !== category) return false
    const q = query.trim().toLowerCase()
    return !q || `${b.title} ${b.author ?? ''}`.toLowerCase().includes(q)
  }

  const readingShown = $derived(reading.filter(matches).sort(byReadingRecency))
  const finishedShown = $derived(finished.filter(matches).sort(byFinishedDesc))
  // Per-status counts under the current category and search.
  const counts = $derived<Record<StatusFilter, number>>({
    all: books.filter(matches).length,
    reading: reading.filter(matches).length,
    finished: finished.filter(matches).length,
  })
  const showReading = $derived(status !== 'finished' && readingShown.length > 0)
  const showFinished = $derived(
    status !== 'reading' && finishedShown.length > 0,
  )

  // The toolbar gets a backdrop only once it is stuck to the top: the
  // sentinel sits right above it, so once it has scrolled above the viewport
  // the toolbar is stuck.
  let sentinel = $state<HTMLElement>()
  let stuck = $state(false)
  $effect(() => {
    const el = sentinel
    if (!el) return
    const update = () => {
      stuck = el.getBoundingClientRect().top < 0
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  })
</script>

<div class="container">
  <SiteHeader />

  <section class="hero" aria-label="今年概览">
    <!-- Break after the comma so no line starts with the italic "f",
         whose swash hangs past the left edge. -->
    <h1>
      Books I finished,<br />
      <em>and the lines I kept from them.</em>
    </h1>
    <p class="lede">每本书留下读完的月份、一句推荐，和读的时候划下来的句子。</p>
    <dl class="stats">
      <div>
        <dt>本读完（{year}）</dt>
        <dd>{finishedThisYear.length}</dd>
      </div>
      <div>
        <dt>本在读</dt>
        <dd>{reading.length}</dd>
      </div>
      <div>
        <dt>句摘录</dt>
        <dd>{sentenceTotal}</dd>
      </div>
    </dl>
  </section>

  <MonthChart books={finished} {year} currentMonth={now.getMonth() + 1} />

  <div class="sentinel" bind:this={sentinel} aria-hidden="true"></div>
  <div class="toolbar" class:stuck>
    <div class="segments" role="group" aria-label="状态">
      {#each STATUS_OPTIONS as [value, label] (value)}
        <button
          type="button"
          aria-pressed={status === value}
          onclick={() => (status = value)}
          >{label}<span class="n">{counts[value]}</span></button
        >
      {/each}
    </div>
    <div class="cats" role="group" aria-label="分类">
      {#each [ALL, ...categories] as name, i (name)}
        {#if i > 0}<span class="sep" aria-hidden="true">/</span>{/if}
        <button
          type="button"
          aria-pressed={category === name}
          onclick={() => (category = name)}>{name}</button
        >
      {/each}
    </div>
    <label class="search">
      <span class="visually-hidden">搜索</span>
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7"></circle>
        <path d="M20 20l-3.5-3.5"></path>
      </svg>
      <input type="search" placeholder="搜书名或作者" bind:value={query} />
    </label>
  </div>

  {#if showReading}
    <section class="group">
      <div class="group-head">
        <h2>在读</h2>
        <span class="count">{readingShown.length} 本</span>
        <span class="hint">读的时候随时加句子，读完再写推荐</span>
      </div>
      <div class="reading-grid">
        {#each readingShown as book (book.id)}
          <ReadingCard {book} />
        {/each}
      </div>
    </section>
  {/if}

  {#if showFinished}
    <section class="group">
      <div class="group-head">
        <h2>读完</h2>
        <span class="count">{finishedShown.length} 本 · 按读完月份</span>
      </div>
      <div class="finished-grid">
        {#each finishedShown as book (book.id)}
          <BookTile {book} />
        {/each}
      </div>
    </section>
  {/if}

  {#if !showReading && !showFinished}
    <p class="empty">没有符合条件的书。换个分类或清空搜索试试。</p>
  {/if}

  <footer>
    <span>
      数据来自仓库里的 <code>data/books/*.json</code>，用 <code>/book</code> 录入
    </span>
    <span>最后更新 {__BUILD_DATE__}</span>
  </footer>
</div>

<style>
  /* Title spans the full width; lede and stats share the row below it,
     centred on each other. */
  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 480px);
    grid-template-areas:
      'title title'
      'lede stats';
    column-gap: 48px;
    align-items: center;
    padding: 56px 0 36px;
  }
  @media (max-width: 760px) {
    .hero {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas: 'title' 'lede' 'stats';
    }
    .hero .stats {
      margin-top: 28px;
    }
  }
  h1 {
    grid-area: title;
    margin: 0;
    font: 500 clamp(40px, 5.4vw, 66px) / 1.03 var(--serif);
    letter-spacing: -0.04em;
  }
  h1 em {
    color: var(--muted);
  }
  .lede {
    grid-area: lede;
    margin: 18px 0 0;
    max-width: 46ch;
    color: var(--apricot);
    font-size: 19px;
    line-height: 1.6;
  }
  .stats {
    grid-area: stats;
    margin: 36px 0 0;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    border-top: 1px solid var(--line-strong);
  }
  .stats > div {
    display: flex;
    flex-direction: column;
    padding: 16px 16px 0;
  }
  .stats > div:first-child {
    padding-left: 0;
  }
  .stats > div + div {
    border-left: 1px solid var(--line);
  }
  .stats dd {
    order: -1;
    margin: 0;
    font: 500 40px/1 var(--serif);
    letter-spacing: -0.02em;
  }
  .stats dt {
    margin-top: 8px;
    font-size: 12px;
    color: var(--muted);
  }

  .toolbar {
    position: sticky;
    top: 0;
    z-index: 5;
    display: flex;
    flex-wrap: wrap;
    gap: 10px 16px;
    align-items: center;
    justify-content: space-between;
    padding: 14px 0;
    border-bottom: 1px solid var(--line);
  }
  .sentinel {
    height: 1px;
    margin-top: 39px;
  }
  /* Full-bleed backdrop, shown only while stuck so the glow isn't boxed in
     when the toolbar sits in the page. */
  .toolbar::before {
    content: '';
    position: absolute;
    inset: 0 calc(50% - 50vw);
    z-index: -1;
    background: rgba(15, 15, 17, 0.72);
    -webkit-backdrop-filter: blur(14px);
    backdrop-filter: blur(14px);
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  .toolbar.stuck::before {
    opacity: 1;
  }
  /* Plain text toggles with a count; the active one brightens. */
  .segments {
    display: flex;
    gap: 24px;
  }
  .segments button {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    border: 0;
    background: transparent;
    padding: 10px 0;
    min-height: 40px;
    font-size: 15px;
    color: var(--faint);
    cursor: pointer;
  }
  .segments button:hover {
    color: var(--text);
  }
  .segments .n {
    font: 400 11px var(--mono);
    color: var(--faint);
  }
  .segments button[aria-pressed='true'] {
    color: var(--text);
    font-weight: 500;
  }
  .segments button[aria-pressed='true'] .n {
    color: var(--accent);
  }
  /* Slash-separated text; the active one gets a small dot underneath. */
  .cats {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }
  .cats .sep {
    margin: 0 12px;
    font-size: 13px;
    color: rgba(236, 232, 225, 0.2);
  }
  .cats button {
    position: relative;
    border: 0;
    background: transparent;
    padding: 10px 0;
    min-height: 40px;
    font-size: 13px;
    color: var(--faint);
    cursor: pointer;
  }
  .cats button:hover {
    color: var(--text);
  }
  .cats button[aria-pressed='true'] {
    color: var(--text);
    font-weight: 500;
  }
  .cats button[aria-pressed='true']::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: 2px;
    width: 4px;
    height: 4px;
    margin-left: -2px;
    border-radius: 50%;
    background: var(--accent);
  }
  .search {
    position: relative;
    display: flex;
    align-items: center;
    flex: 0 1 240px;
    min-width: 180px;
  }
  .search svg {
    position: absolute;
    left: 11px;
    width: 14px;
    height: 14px;
    stroke: var(--faint);
    fill: none;
    stroke-width: 2;
  }
  .search input {
    width: 100%;
    min-height: 40px;
    box-sizing: border-box;
    background: var(--surface);
    border: 1px solid var(--line-strong);
    border-radius: 8px;
    padding: 8px 10px 8px 32px;
    font-size: 13px;
  }
  /* No accent ring; a lighter border still shows where focus is. */
  .search input:focus {
    outline: none;
    border-color: rgba(236, 232, 225, 0.4);
  }
  .search input::placeholder {
    color: var(--faint);
  }

  .group {
    margin-top: 44px;
  }
  .group-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--line);
    margin-bottom: 24px;
  }
  .group-head h2 {
    margin: 0;
    font: 500 24px/1.1 var(--serif);
  }
  .count {
    font: 400 12px/1 var(--mono);
    color: var(--muted);
  }
  .hint {
    margin-left: auto;
    font-size: 12px;
    color: var(--faint);
  }
  .reading-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
    gap: 20px;
  }
  .finished-grid {
    display: grid;
    grid-template-columns: repeat(
      auto-fill,
      minmax(clamp(120px, 28vw, 150px), 1fr)
    );
    gap: 36px 20px;
  }

  .empty {
    padding: 56px 0;
    text-align: center;
    color: var(--muted);
  }

  footer {
    margin-top: 72px;
    padding-top: 20px;
    border-top: 1px solid var(--line);
    display: flex;
    flex-wrap: wrap;
    gap: 8px 24px;
    justify-content: space-between;
    font-size: 12px;
    color: var(--faint);
  }
  code {
    font: 400 12px var(--mono);
    color: var(--muted);
  }
</style>
