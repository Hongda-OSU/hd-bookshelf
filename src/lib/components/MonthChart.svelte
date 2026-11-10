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
        books: books
          .filter((b) => b.dateFinished === key)
          .map((b) => ({ ...b, ph: placeholderCover(b.id, b.title) })),
      }
    }),
  )
</script>

<section aria-labelledby="month-chart-title">
  <div class="head">
    <h2 id="month-chart-title">每月读完</h2>
  </div>
  <div class="grid">
    {#each months as m, i (i)}
      <div
        class="col"
        class:future={currentMonth !== undefined && i + 1 > currentMonth}
      >
        <div class="stack">
          {#each m.books as b (b.id)}
            <a
              class="chip"
              href={bookHref(b.id)}
              title={b.title}
              aria-label="{b.title}，{i + 1} 月读完"
              style:--chip-bg={b.coverColor ?? b.ph.bg}
              style:--chip-mark={b.coverColor ? '#ffffff' : b.ph.mark}
            ></a>
          {/each}
        </div>
        <span class="label long" class:current={m.current}>{m.label}</span>
        <span class="label short" class:current={m.current}>{i + 1}</span>
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
  .grid {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    align-items: end;
    gap: 12px 6px;
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
  /* Months still to come: faded, so "nothing yet" reads apart from "none". */
  .future .stack {
    border-bottom-color: var(--line);
  }
  .future .label {
    opacity: 0.35;
  }
  /* Phones: keep the year on one line, months as 1-12. Last, so it wins. */
  .label.short {
    display: none;
  }
  @media (max-width: 640px) {
    .grid {
      gap: 0 4px;
    }
    .stack {
      min-height: 44px;
    }
    .label.long {
      display: none;
    }
    .label.short {
      display: inline;
    }
  }
</style>
