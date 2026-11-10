<script lang="ts">
  import type { Book, IndexEntry } from '../lib/book'
  import Cover from '../lib/components/Cover.svelte'
  import SiteHeader from '../lib/components/SiteHeader.svelte'
  import { FORMAT_LABEL, bookHref, cnMonth, dotMonth } from '../lib/format'
  import { shelfOrder } from '../lib/order'

  let { id, books }: { id: string; books: IndexEntry[] } = $props()

  // Full book files (with sentences) load on demand, one chunk per book.
  const files = import.meta.glob<{ default: Book }>('../../data/books/*.json')

  const entry = $derived(books.find((b) => b.id === id))
  let book = $state<Book | null>(null)

  $effect(() => {
    const load = files[`../../data/books/${id}.json`]
    if (!load) return
    let live = true
    load().then((m) => {
      if (live) book = m.default
    })
    return () => {
      live = false
    }
  })

  const sentences = $derived(
    [...(book?.sentences ?? [])].sort((a, b) =>
      a.addedAt.localeCompare(b.addedAt),
    ),
  )

  const order = $derived(shelfOrder(books))
  const at = $derived(order.findIndex((b) => b.id === id))
  const prev = $derived(at > 0 ? order[at - 1] : undefined)
  const next = $derived(
    at >= 0 && at < order.length - 1 ? order[at + 1] : undefined,
  )

  // Chinese names read "<name> 著"; others get an English "by".
  const CJK = /[\u3400-\u9fff]/

  function when(b: IndexEntry): string {
    return b.status === 'finished' && b.dateFinished
      ? dotMonth(b.dateFinished)
      : '在读'
  }
</script>

<div class="container">
  <SiteHeader current={entry?.title} />

  {#if !entry}
    <div class="missing">
      <p tabindex="-1" data-page-title>书架上没有这本书。</p>
      <a href="#/">回到书架</a>
    </div>
  {:else}
    <div class="layout">
      <aside>
        <div class="cover" style:view-transition-name="book-cover">
          <Cover
            id={entry.id}
            title={entry.title}
            author={entry.author}
            cover={entry.cover}
            size="lg"
          />
        </div>
        <dl class="facts">
          <div>
            <dt>{entry.status === 'finished' ? '读完' : '开始'}</dt>
            <dd>
              {#if entry.status === 'finished' && entry.dateFinished}
                {cnMonth(entry.dateFinished)}
              {:else if entry.dateStarted}
                {cnMonth(entry.dateStarted)}
              {:else}
                —
              {/if}
            </dd>
          </div>
          {#if entry.format}
            <div>
              <dt>形式</dt>
              <dd>{FORMAT_LABEL[entry.format]}</dd>
            </div>
          {/if}
          <div>
            <dt>摘录</dt>
            <dd>{entry.sentenceCount} 句</dd>
          </div>
          <div>
            <dt>分类</dt>
            <dd>{entry.category}</dd>
          </div>
          <div>
            <dt>ISBN</dt>
            <dd class="mono">{book?.isbn ?? '—'}</dd>
          </div>
        </dl>
      </aside>

      <main>
        <p class="status">
          {#if entry.status === 'finished' && entry.dateFinished}
            <span>读完</span> · {dotMonth(entry.dateFinished)}
          {:else}
            <span>在读</span>{entry.dateStarted
              ? ` · ${dotMonth(entry.dateStarted)} 开始`
              : ''}
          {/if}
        </p>
        <h1 tabindex="-1" data-page-title>{entry.title}</h1>
        {#if entry.author}
          <p class="author" class:cjk={CJK.test(entry.author)}>
            {CJK.test(entry.author)
              ? `${entry.author} 著`
              : `by ${entry.author}`}
          </p>
        {/if}

        <section class="rec">
          <h2 class="label">推荐语</h2>
          {#if entry.recommendation}
            <p class="rec-text">{entry.recommendation}</p>
          {:else}
            <p class="rec-text empty">
              {entry.status === 'reading'
                ? '还在读，读完再写。'
                : '没写推荐语。'}
            </p>
          {/if}
        </section>

        <section class="lines">
          <div class="lines-head">
            <h2>我划下来的句子</h2>
            <span>{entry.sentenceCount} 句 · 按记录时间</span>
          </div>
          {#if book}
            {#each sentences as s, i (i)}
              <article>
                <blockquote>{s.text}</blockquote>
                {#if s.note}
                  <p class="note"><span>批注 ·</span>{s.note}</p>
                {/if}
                <p class="meta">
                  {#if s.location}<span>{s.location}</span>{/if}
                  <span>记于 {s.addedAt}</span>
                </p>
              </article>
            {:else}
              <p class="none">还没有摘录。</p>
            {/each}
          {/if}
        </section>

        {#if prev || next}
          <nav aria-label="上一本和下一本">
            {#if prev}
              <a class="pn" href={bookHref(prev.id)}>
                <span class="pn-k">← 上一本 · {when(prev)}</span>
                <span class="pn-t">{prev.title}</span>
              </a>
            {:else}
              <span></span>
            {/if}
            {#if next}
              <a class="pn right" href={bookHref(next.id)}>
                <span class="pn-k">{when(next)} · 下一本 →</span>
                <span class="pn-t">{next.title}</span>
              </a>
            {/if}
          </nav>
        {/if}
      </main>
    </div>
  {/if}
</div>

<style>
  .missing {
    padding: 96px 0;
    text-align: center;
    color: var(--muted);
  }
  .missing a {
    color: var(--accent);
  }

  /* One column until there's room for two; stacked, the aside spans the
     full width so its rules line up with the content below. */
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 48px;
    padding-top: 56px;
  }
  @media (min-width: 900px) {
    .layout {
      grid-template-columns: 280px minmax(0, 1fr);
      gap: 48px 64px;
      align-items: start;
    }
  }
  aside {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .cover {
    max-width: 260px;
  }
  /* Phones: smaller cover so the title isn't pushed below the fold. */
  @media (max-width: 640px) {
    .layout {
      padding-top: 36px;
    }
    .cover {
      max-width: 180px;
    }
  }
  .facts {
    margin: 16px 0 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    border-top: 1px solid var(--line);
  }
  .facts > div {
    padding: 12px 0;
    border-bottom: 1px solid var(--line);
  }
  .facts > div:nth-child(even) {
    padding-left: 14px;
    border-left: 1px solid var(--line);
  }
  /* Odd number of facts: the last one (ISBN) takes the whole row. */
  .facts > div:last-child:nth-child(odd) {
    grid-column: 1 / -1;
  }
  .facts dt {
    font: 400 11px/1 var(--mono);
    color: var(--faint);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .facts dd {
    margin: 7px 0 0;
    font-size: 14px;
  }
  .facts .mono {
    font: 400 13px var(--mono);
  }

  main {
    min-width: 0;
  }
  .status {
    margin: 0;
    font: 500 12px/1 var(--mono);
    letter-spacing: 0.04em;
    color: var(--faint);
  }
  .status span {
    color: var(--apricot);
  }
  /* Negative left margin cancels the serif's side bearing so the title's
     first stroke lines up with the status line (optical alignment). */
  h1 {
    margin: 16px 0 8px -0.04em;
    font: 500 clamp(36px, 4.6vw, 56px) / 1.04 var(--serif);
    letter-spacing: -0.025em;
  }
  /* Focus lands here on navigation (App.svelte); it isn't a control, so no ring. */
  [data-page-title]:focus {
    outline: none;
  }
  /* Byline set like a title page. */
  .author {
    margin: 10px 0 0;
    font: italic 400 22px/1.3 var(--serif);
    color: var(--muted);
  }
  /* Chinese has no italic; the browser would just slant the glyphs. */
  .author.cjk {
    font-style: normal;
    font-family: var(--serif-cjk);
    font-size: 19px;
  }

  .rec {
    margin-top: 40px;
  }
  .label {
    margin: 0 0 14px;
    font: 500 11px/1 var(--mono);
    letter-spacing: 0.1em;
    color: var(--muted);
  }
  .rec-text {
    margin: 0;
    max-width: 34em;
    font: 400 24px/1.5 var(--serif);
    letter-spacing: -0.005em;
  }
  .rec-text.empty {
    font-size: 18px;
    color: var(--faint);
  }

  .lines {
    margin-top: 48px;
  }
  .lines-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 6px 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--line);
  }
  .lines-head h2 {
    margin: 0;
    font: 500 24px/1.1 var(--serif);
  }
  .lines-head span {
    font: 400 12px/1 var(--mono);
    color: var(--muted);
    white-space: nowrap;
  }
  article {
    padding: 24px 0;
    border-bottom: 1px solid var(--line);
  }
  /* The prev/next rule closes the list; avoid a second line right above it. */
  article:last-of-type {
    border-bottom: 0;
  }
  blockquote {
    margin: 0;
    padding-left: 18px;
    border-left: 2px solid var(--line-strong);
    font: 400 21px/1.5 var(--serif);
  }
  .note {
    margin: 12px 0 0 20px;
    font-size: 14px;
    color: var(--muted);
  }
  .note span {
    margin-right: 0.4em;
    color: var(--accent);
  }
  .meta {
    margin: 10px 0 0 20px;
    display: flex;
    gap: 14px;
    font: 400 11px/1 var(--mono);
    color: var(--faint);
  }
  .none {
    padding: 24px 0;
    color: var(--faint);
  }

  /* No boxes: a rule, then the previous book at the left end and the next
     at the right end. */
  nav {
    margin-top: 48px;
    padding-top: 22px;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px 32px;
    border-top: 1px solid var(--line);
  }
  .pn {
    flex: 0 1 calc(50% - 16px);
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .pn.right {
    margin-left: auto;
    text-align: right;
  }
  @media (max-width: 480px) {
    .pn {
      flex-basis: 100%;
    }
  }
  .pn-k {
    font: 400 11px/1 var(--mono);
    color: var(--faint);
  }
  .pn-t {
    font: 500 22px/1.25 var(--serif);
    transition: color 0.15s ease;
  }
  .pn:hover .pn-t {
    color: var(--apricot);
  }
</style>
