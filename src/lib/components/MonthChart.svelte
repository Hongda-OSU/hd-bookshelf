<script lang="ts">
  import type { IndexEntry } from '../book'
  import { placeholderCover } from '../cover'
  import { MONTH_ABBR, bookHref } from '../format'

  type Props = { books: IndexEntry[]; year: number; currentMonth?: number }
  let { books, year, currentMonth }: Props = $props()

  const months = $derived(
    MONTH_ABBR.map((label, i) => {
      const key = `${year}-${String(i + 1).padStart(2, '0')}`
      return {
        label,
        current: currentMonth === i + 1,
        books: books.filter((b) => b.dateFinished === key),
      }
    }),
  )
</script>

<section aria-labelledby="month-chart-title">
  <div class="head">
    <h2 id="month-chart-title">每月读完</h2>
    <span class="caption">{year} · 每一格是一本书</span>
  </div>
  <div class="grid">
    {#each months as m, i (i)}
      <div class="col">
        <div class="stack">
          {#each m.books as b (b.id)}
            <a
              class="chip"
              href={bookHref(b.id)}
              title={b.title}
              aria-label="{b.title}，{i + 1} 月读完"
              style:--chip-bg={placeholderCover(b.id, b.title).bg}
              style:--chip-mark={placeholderCover(b.id, b.title).mark}
            ></a>
          {/each}
        </div>
        <span class="label" class:current={m.current}>{m.label}</span>
      </div>
    {/each}
  </div>
</section>

<style>
  section {
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 18px 18px 14px;
    background: var(--surface);
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 14px;
  }
  h2 {
    margin: 0;
    font: 500 13px/1 var(--sans);
  }
  .caption {
    font: 400 12px/1 var(--mono);
    color: var(--muted);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    align-items: end;
    gap: 12px 6px;
  }
  @media (max-width: 640px) {
    .grid {
      grid-template-columns: repeat(6, minmax(0, 1fr));
    }
  }
  .col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .stack {
    min-height: 58px;
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column-reverse;
    align-items: center;
    gap: 3px;
    padding-bottom: 4px;
    border-bottom: 1px solid var(--line-strong);
  }
  .chip {
    display: block;
    width: min(30px, 80%);
    height: 12px;
    border-radius: 2px;
    background: var(--chip-bg);
    box-shadow: inset 0 0 0 1px
      color-mix(in srgb, var(--chip-mark) 40%, transparent);
  }
  .chip:hover {
    filter: brightness(1.2);
  }
  .label {
    font: 400 11px/1 var(--mono);
    color: var(--faint);
  }
  .label.current {
    color: var(--accent);
  }
</style>
