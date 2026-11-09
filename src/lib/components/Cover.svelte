<script lang="ts">
  import { coverUrl, placeholderCover } from '../cover'

  type Props = {
    id: string
    title: string
    author?: string
    cover?: string
    size?: 'sm' | 'md' | 'lg'
  }
  let { id, title, author, cover, size = 'md' }: Props = $props()

  // Fall back to the placeholder when the image URL is broken.
  let failed = $state(false)
  const ph = $derived(placeholderCover(id, title))
  const src = $derived(cover && !failed ? coverUrl(cover) : undefined)
</script>

<!-- Decorative: the title and author are always shown as text next to it. -->
<div
  class="cover {size}"
  class:cjk={ph.cjk}
  style:--cover-bg={ph.bg}
  style:--cover-ink={ph.ink}
  style:--cover-mark={ph.mark}
  aria-hidden="true"
>
  {#if src}
    <img {src} alt="" loading="lazy" onerror={() => (failed = true)} />
  {:else}
    <span class="mark {ph.variant}"></span>
    <span class="title {ph.variant}">{title}</span>
    {#if author}
      <span class="author {ph.variant}">{author}</span>
    {/if}
  {/if}
  <span class="spine"></span>
</div>

<style>
  .cover {
    position: relative;
    width: 100%;
    aspect-ratio: 2 / 3;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    padding: 14% 11% 10% 15%;
    overflow: hidden;
    border-radius: 3px 6px 6px 3px;
    background: var(--cover-bg);
    color: var(--cover-ink);
    box-shadow: 0 10px 24px -14px rgba(0, 0, 0, 0.7);
  }
  .sm {
    --t: 11px;
    --a: 6.5px;
  }
  .md {
    --t: 15px;
    --a: 8.5px;
  }
  .lg {
    --t: 26px;
    --a: 11px;
    border-radius: 4px 8px 8px 4px;
    box-shadow: 0 24px 50px -22px rgba(0, 0, 0, 0.9);
  }

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .spine {
    position: absolute;
    inset: 0 auto 0 0;
    width: 7%;
    background: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.28),
      rgba(0, 0, 0, 0.05) 70%,
      rgba(255, 255, 255, 0.08)
    );
  }

  .title {
    position: relative;
    font: 600 var(--t) / 1.15 var(--serif);
    letter-spacing: -0.01em;
    overflow-wrap: anywhere;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 4;
    line-clamp: 4;
    overflow: hidden;
  }
  .cjk .title {
    font-family: var(--serif-cjk);
    font-weight: 700;
    letter-spacing: 0.04em;
  }
  .author {
    position: relative;
    font: 500 var(--a) / 1.3 var(--sans);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    opacity: 0.75;
  }

  .mark.band {
    position: absolute;
    left: 15%;
    right: 11%;
    top: 34%;
    height: 2px;
    background: var(--cover-mark);
  }
  .title.band {
    margin-top: 34%;
  }
  .author.band,
  .author.block {
    margin-top: auto;
  }

  .mark.frame {
    position: absolute;
    inset: 7% 7% 7% 9%;
    border: 1px solid var(--cover-mark);
    opacity: 0.7;
  }
  .title.frame {
    margin-top: auto;
    text-align: center;
  }
  .author.frame {
    margin: 10% 0 8%;
    text-align: center;
  }

  .mark.block {
    position: absolute;
    right: 12%;
    bottom: 28%;
    width: 26%;
    aspect-ratio: 1;
    border-radius: 50%;
    background: var(--cover-mark);
  }
</style>
