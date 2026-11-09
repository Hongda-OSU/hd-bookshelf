<script lang="ts">
  import type { IndexEntry, Status } from '../lib/book'
  import BookTile from '../lib/components/BookTile.svelte'
  import MonthChart from '../lib/components/MonthChart.svelte'
  import ReadingCard from '../lib/components/ReadingCard.svelte'
  import SiteHeader from '../lib/components/SiteHeader.svelte'

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
  const showReading = $derived(status !== 'finished' && readingShown.length > 0)
  const showFinished = $derived(
    status !== 'reading' && finishedShown.length > 0,
  )
</script>

<div class="container">
  <SiteHeader>
    <a class="nav" href="https://github.com/Hongda-OSU/hd-bookshelf">GitHub</a>
  </SiteHeader>

  <section class="hero" aria-label="今年概览">
    <div>
      <p class="eyebrow">Reading log · {year}</p>
      <h1>
        Books I finished, <em>and the lines I kept from them.</em>
      </h1>
      <p class="lede">
        每本书留下读完的月份、一句推荐，和读的时候划下来的句子。
      </p>
    </div>
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
          onclick={() => (status = value)}>{label}</button
        >
      {/each}
    </div>
    <div class="cats" role="group" aria-label="分类">
      {#each [ALL, ...categories] as name (name)}
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
  .nav {
    font-size: 13px;
    color: var(--muted);
    padding: 10px 12px;
    border-radius: 6px;
  }
  .nav:hover {
    color: var(--text);
  }

  .hero {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
    gap: 32px 48px;
    align-items: end;
    padding: 56px 0 36px;
  }
  .eyebrow {
    margin: 0 0 18px;
    font: 500 12px/1 var(--mono);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent);
  }
  h1 {
    margin: 0;
    font: 500 clamp(40px, 5.4vw, 66px) / 1.03 var(--serif);
    letter-spacing: -0.025em;
  }
  h1 em {
    color: var(--muted);
  }
  .lede {
    margin: 18px 0 0;
    max-width: 46ch;
    color: var(--muted);
    font-size: 16px;
  }
  .stats {
    margin: 0;
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
    background: var(--bg);
    border-bottom: 1px solid var(--line);
  }
  .segments {
    display: flex;
    border: 1px solid var(--line-strong);
    border-radius: 8px;
    padding: 2px;
  }
  .segments button {
    border: 0;
    background: transparent;
    padding: 8px 14px;
    min-height: 36px;
    border-radius: 6px;
    font-size: 13px;
    color: var(--muted);
    cursor: pointer;
  }
  .segments button[aria-pressed='true'] {
    background: var(--surface-raised);
    color: var(--text);
    font-weight: 500;
  }
  .cats {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .cats button {
    border: 1px solid rgba(236, 232, 225, 0.12);
    background: transparent;
    border-radius: 999px;
    padding: 6px 12px;
    min-height: 32px;
    font-size: 12px;
    color: var(--muted);
    cursor: pointer;
  }
  .cats button:hover {
    color: var(--text);
  }
  .cats button[aria-pressed='true'] {
    border-color: var(--accent);
    background: var(--accent-soft);
    color: var(--text);
    font-weight: 500;
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
