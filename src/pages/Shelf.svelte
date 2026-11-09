<script lang="ts">
  import type { IndexEntry, Status } from '../lib/book'
  import BookTile from '../lib/components/BookTile.svelte'
  import MonthChart from '../lib/components/MonthChart.svelte'
  import SiteHeader from '../lib/components/SiteHeader.svelte'
  import ReadingCard from '../lib/components/ReadingCard.svelte'

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

  const readingShown = $derived(
    reading
      .filter(matches)
      .sort((a, b) =>
        (b.lastAddedAt ?? b.dateStarted ?? '').localeCompare(
          a.lastAddedAt ?? a.dateStarted ?? '',
        ),
      ),
  )
  const finishedShown = $derived(
    finished
      .filter(matches)
      .sort((a, b) =>
        (b.dateFinished ?? '').localeCompare(a.dateFinished ?? ''),
      ),
  )
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
</script>

<div class="container">
  <SiteHeader>
    <a class="nav" href="https://github.com/Hongda-OSU/hd-bookshelf">
      <!-- GitHub mark from Octicons (MIT) -->
      <svg aria-hidden="true" viewBox="0 0 16 16">
        <path
          d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"
        ></path>
      </svg>
      <span class="visually-hidden">GitHub</span>
    </a>
  </SiteHeader>

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

  <div class="toolbar">
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
  /* Icon-only link; padding keeps a 44px touch target. */
  .nav {
    display: inline-flex;
    padding: 12px;
    margin-right: -12px;
    color: var(--muted);
    border-radius: 6px;
  }
  .nav svg {
    width: 20px;
    height: 20px;
    fill: currentColor;
  }
  .nav:hover {
    color: var(--text);
  }

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
    color: #e6b48a;
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
    margin-top: 40px;
    /* See-through so the page glow shows; blur keeps it readable when stuck. */
    background: rgba(15, 15, 17, 0.6);
    -webkit-backdrop-filter: blur(14px);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--line);
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
